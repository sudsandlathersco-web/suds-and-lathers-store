// server.js - Stripe backend for Suds & Lathers Co.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

// --- Stripe setup ---
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is missing in .env');
  process.exit(1);
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// --- Express app setup ---
const app = express();

// Allow JSON bodies
app.use(express.json());

// CORS: allow local dev + Netlify site
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://tubular-bavarois-b598f2.netlify.app',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow tools like Postman (no origin) and known frontends
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn('Blocked CORS origin:', origin);
        callback(null, false);
      }
    },
  })
);

// Health-check / root route
app.get('/', (req, res) => {
  res.send('Stripe backend is running.');
});

// Helper: build line items for soaps
function buildSoapLineItems(items) {
  return items.map((item) => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.name,
      },
      // prices from frontend are in dollars; Stripe needs cents
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.qty,
  }));
}

// Helper: shipping rules
// - Free shipping if 3 or more bars
// - Otherwise $3 per bar
function calculateShippingCents(items) {
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  if (totalQty === 0) return 0;
  if (totalQty >= 3) return 0;
  return totalQty * 300; // 3.00 per bar in cents
}

// Main checkout route
app.post('/create-checkout-session', async (req, res) => {
  try {
    const items = req.body && req.body.items;

    // Guard against missing or invalid items
    if (!Array.isArray(items) || items.length === 0) {
      console.error('❌ No items provided in request body:', req.body);
      return res.status(400).json({ error: 'No items provided' });
    }

    console.log('🧴 Creating checkout for items:', items);

    const lineItems = buildSoapLineItems(items);
    const shippingCents = calculateShippingCents(items);

    if (shippingCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping',
          },
          unit_amount: shippingCents,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url:
        'https://tubular-bavarois-b598f2.netlify.app/?success=true',
      cancel_url:
        'https://tubular-bavarois-b598f2.netlify.app/?canceled=true',
      // You can turn on automatic tax in Stripe dashboard & set this to true
      automatic_tax: { enabled: false },
    });

    console.log('✅ Session created:', session.id);

    res.json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe error:', err);
    res
      .status(500)
      .json({ error: 'Stripe error', details: err.message ?? 'Unknown error' });
  }
});

// --- Start server ---
const port = process.env.PORT || 4242;
app.listen(port, () => {
  console.log(`Stripe server listening on port ${port}`);
});
