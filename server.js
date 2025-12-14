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

// Parse JSON bodies
app.use(express.json());

// ✅ CORS (allow your Netlify site + local dev)
const allowedOrigins = [
  'https://sudsandlathers.com',
  'https://www.sudsandlathers.com',
  'https://tubular-bavarois-b598f2.netlify.app', // keep if you still use this
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like curl/postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: false,
  })
);

// Simple health check
app.get('/', (req, res) => {
  res.send('Stripe backend is running.');
});

// Build line items from cart
function buildSoapLineItems(items) {
  return items.map((item) => ({
    price_data: {
      currency: 'usd',
      product_data: { name: item.name },
      unit_amount: Math.round(Number(item.price) * 100), // dollars -> cents
    },
    quantity: Number(item.qty) || 1,
  }));
}

// Shipping: free if 5+ bars, otherwise $2.50 per bar
function calculateShippingCents(items) {
  const totalQty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  if (totalQty === 0) return 0;
  if (totalQty >= 5) return 0;
  return totalQty * 250; // $2.50 per bar
}

app.post('/create-checkout-session', async (req, res) => {
  try {
    console.log('📩 Incoming /create-checkout-session body:', req.body);

    const items = req.body?.items;

    if (!Array.isArray(items) || items.length === 0) {
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

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,

      // automatic tax
      automatic_tax: { enabled: true },

      // helpful for tax calculation
      customer_creation: 'always',
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: ['US'] },

      success_url: 'https://sudsandlathers.com/?success=true',
      cancel_url: 'https://sudsandlathers.com/?canceled=true',
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe error:', err);
    return res.status(500).json({ error: 'Stripe error', message: err.message });
  }
});

    console.log('🧴 Creating Stripe session with line_items:', lineItems);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,

      // ✅ Stripe automatic tax
      automatic_tax: { enabled: true },

      // ✅ Collect address so Stripe can calculate tax correctly
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
      message: err?.message || 'Unknown Stripe error',
    });
  }
});

// --- Start the server ---
const port = process.env.PORT || 4242;
app.listen(port, () => {
  console.log(`Stripe server listening on port ${port}`);
});
