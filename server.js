// server.js
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';

dotenv.config();

const app = express();

// Make sure your .env has: STRIPE_SECRET_KEY=sk_test_...
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 👇 Replace this with your actual Netlify URL if it's different
const NETLIFY_URL = 'https://tubular-bavarois-b598f2.netlify.app';

// Allow your local dev and Netlify frontend to call this server
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      NETLIFY_URL,
    ],
    methods: ['GET', 'POST'],
  })
);

app.use(express.json());

// Simple test route so you can open the backend in a browser
app.get('/', (req, res) => {
  res.send('Stripe backend is running.');
});

// Create Stripe Checkout session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const items = req.body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items in request' });
    }

    const line_items = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
        },
        // item.price is like 8.25, Stripe needs cents
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      // After successful payment, send back to your Netlify site
      success_url: `${NETLIFY_URL}/?success=true`,
      cancel_url: `${NETLIFY_URL}/?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    res.status(500).json({ error: 'Unable to create checkout session' });
  }
});

// Render will give you PORT, otherwise use 4242 locally
const PORT = process.env.PORT || 4242;

app.listen(PORT, () => {
  console.log(`Stripe server listening on port ${PORT}`);
});
