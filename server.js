// server.js - Stripe backend for Suds & Lathers Co.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

// --- Stripe setup ---
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is missing in .env or Render env');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// --- Express app setup ---
const app = express();

// ✅ Stripe webhook MUST use RAW body, and MUST be defined BEFORE express.json()
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw buffer
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Event: Checkout finished successfully
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('✅ Webhook: checkout.session.completed', {
      id: session.id,
      email: session.customer_details?.email,
      amount_total: session.amount_total,
    });

    // Next step later: update inventory + email notification
  }

  res.json({ received: true });
});

// ✅ Normal middleware for all non-webhook routes
app.use(express.json());

// CORS: allow Netlify + local (allow all is fine for now)
app.use(cors());

// Health check
app.get('/', (req, res) => {
  res.send('Stripe backend is running.');
});

// ===== SETTINGS =====
const SHIPPING_PER_BAR_CENTS = 250; // $2.50 per bar
const FREE_SHIPPING_QTY = 5;

// Build line items from cart
function buildSoapLineItems(items) {
  return items.map((item) => ({
    price_data: {
      currency: 'usd',
      product_data: { name: item.name },
      unit_amount: Math.round(item.price * 100), // dollars -> cents
    },
    quantity: item.qty,
  }));
}

// Shipping: free if 5+ bars, otherwise $2.50 per bar
function calculateShippingCents(items) {
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  if (totalQty === 0) return 0;
  if (totalQty >= FREE_SHIPPING_QTY) return 0;
  return totalQty * SHIPPING_PER_BAR_CENTS;
}

app.post('/create-checkout-session', async (req, res) => {
  try {
    console.log('📩 Incoming /create-checkout-session body:', req.body);

    const items = req.body?.items;

    if (!Array.isArray(items) || items.length === 0) {
      console.error('❌ No items provided in request body');
      return res.status(400).json({ error: 'No items provided' });
    }

    const lineItems = buildSoapLineItems(items);

    const shippingCents = calculateShippingCents(items);
    if (shippingCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Shipping' },
          unit_amount: shippingCents,
        },
        quantity: 1,
      });
    }

    console.log('🧴 Creating Stripe session with line_items:', lineItems);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,

      // ✅ Turn on automatic tax AFTER you set Stripe Tax origin address
      // If your origin address is set now, flip this to true.
      automatic_tax: { enabled: true },

      billing_address_collection: 'auto',
      shipping_address_collection: { allowed_countries: ['US'] },

      success_url: 'https://sudsandlathers.com/?success=true',
      cancel_url: 'https://sudsandlathers.com/?canceled=true',
    });

    console.log('✅ Stripe session created:', session.id);
    res.json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe error:', err);
    res.status(500).json({
      error: 'Stripe error',
      message: err.message || 'Unknown Stripe error',
    });
  }
});

// --- Start the server ---
const port = process.env.PORT || 4242;
app.listen(port, () => {
  console.log(`Stripe server listening on port ${port}`);
});
