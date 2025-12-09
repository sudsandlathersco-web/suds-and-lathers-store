// server.js - Stripe Checkout backend for Suds & Lathers Co.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

// 🔗 Allow your frontend at port 5174
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://tubular-bavarois-b598f2.netlify.app', // your Netlify site
    ],
  })
);


// (Optional) simple test route
app.get('/', (req, res) => {
  res.send('Stripe server is running ✅');
});

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty or invalid.' });
    }

    // 1) Turn cart items into Stripe line items
    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100), // dollars → cents
      },
      quantity: item.qty,
    }));

    // 2) Compute total quantity for shipping rule
    const totalQty = items.reduce(
      (sum, item) => sum + (item.qty || 1),
      0
    );

    // 3) Your shipping rule:
    // - $0 if no items
    // - Free if 3+ bars
    // - Otherwise $3 per bar
    let shippingAmount = 0;
    if (totalQty > 0 && totalQty < 3) {
      shippingAmount = totalQty * 300; // $3 → 300 cents per bar
    }

    // 4) Add shipping line item if needed
    if (shippingAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping',
          },
          unit_amount: shippingAmount,
        },
        quantity: 1,
      });
    }

    // 5) Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: 'http://tubular-bavarois-b598f2.netlify.app/?success=true',
      cancel_url: 'http://tubular-bavarois-b598f2.netlify.app/?canceled=true',
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

const PORT = 4242;
app.listen(PORT, () => {
  console.log(`Stripe server listening at http://localhost:${PORT}`);
});
