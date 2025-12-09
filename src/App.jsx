import { useState } from 'react';
import { Routes, Route, Link, useParams, useLocation } from 'react-router-dom';
import './App.css';

const PRODUCTS = [
  {
    id: 'lemon-bar',
    name: 'Lemon Bar',
    price: 8.25,
    img: '/lemon-bar.jpeg',
    qtyAvailable: 10,
    description:
      'A vibrant goat’s milk bar infused with shea butter, cocoa butter, and skin-loving oils for a creamy, nourishing lather. Bright lemon fragrance lifts the senses while bentonite clay gently purifies, leaving your skin soft, smooth, and refreshed.',
  },
  {
    id: 'whiskey-barrel',
    name: 'Whiskey Barrel',
    price: 8.25,
    img: '/whiskey-barrel.JPG',
    qtyAvailable: 8,
    description:
      'Warm, smoky, and a little bit rugged, this goat’s milk bar blends nourishing oils and butters with notes of oak barrel, vanilla, and spice. Bentonite clay adds a gentle detoxifying touch for a clean that feels smooth, cozy, and refined.',
  },
  {
    id: 'tabac-leather',
    name: 'Tabac & Leather',
    price: 8.25,
    img: '/tabac-leather.JPG',
    qtyAvailable: 6,
    description:
      'Inspired by a classic study lined with books and worn-in leather chairs, this bar pairs rich tobacco and soft leather notes with a creamy goat’s milk base. Natural oils and butters create a velvety lather that feels both bold and comforting.',
  },
  {
    id: 'sunflower-sandalwood',
    name: 'Sunflower Sandalwood',
    price: 8.25,
    img: '/sunflower-sandalwood.JPG',
    qtyAvailable: 12,
    description:
      "A creamy goat's milk bar enriched with nourishing oils and butters, grounded in the warm, woody richness of sandalwood and brightened with soft sunflower notes. Smooth, comforting and beautifully balanced for everyday use.",
  },
  {
    id: 'christmas-wreath',
    name: 'Christmas Wreath',
    price: 8.25,
    img: '/christmas-wreath.jpeg',
    qtyAvailable: 5,
    description:
      'A cozy holiday blend wrapped in a creamy goat’s milk lather. This bar combines nourishing oils and butters with the fresh, evergreen scent of a Christmas wreath—pine, winter greens, and a hint of spice for a festive, comforting cleanse.',
  },
  {
    id: 'vanilla-buttercream',
    name: 'Vanilla Buttercream',
    price: 8.25,
    img: '/vanilla-buttercream.jpeg',
    qtyAvailable: 9,
    description:
      'A decadent goat’s milk bar enriched with cocoa and shea butters for a silky, conditioning lather. Warm vanilla buttercream fragrance wraps your skin in soft sweetness, while bentonite clay gently clarifies for a clean, indulgent finish.',
  },
];

function App() {
  const [cart, setCart] = useState([]);
  const location = useLocation();
  const isGrannyPage = location.pathname.startsWith('/grannys-house');

  const addToCart = (product) => {
    const existing = cart.find((item) => item.id === product.id);
    const currentQty = existing ? existing.qty : 0;
    const remaining = product.qtyAvailable - currentQty;

    if (remaining <= 0) {
      alert('Sorry, this item is sold out or you reached the limit.');
      return;
    }

    setCart((prev) => {
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, qty: Math.max(1, item.qty + delta) }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const totalQty = cart.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  const shipping =
    totalQty === 0 ? 0 : totalQty >= 3 ? 0 : totalQty * 3;

  const total = subtotal + shipping;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const response = await fetch(
        'http://localhost:4242/create-checkout-session',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: cart }),
        }
      );

      const data = await response.json();

      if (data && data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned:', data);
        alert('Sorry, something went wrong starting checkout.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('There was a problem starting checkout.');
    }
  };

  const remainingFor = (product) => {
    const inCart = cart.find((i) => i.id === product.id)?.qty || 0;
    return Math.max(0, product.qtyAvailable - inCart);
  };

  return (
    <div className="app">
      {/* Header changes depending on page */}
      <header className="header">
        {isGrannyPage ? (
          <>
            <h1>Granny&apos;s House</h1>
            <p>Cozy crafts, blankets & country charm</p>
          </>
        ) : (
          <>
            <h1>Suds &amp; Lathers Co.</h1>
            <p>Handmade small-batch soaps & crafts</p>
          </>
        )}
      </header>

      {/* Granny's House banner only on main site, not on Granny page */}
      {!isGrannyPage && (
        <Link to="/grannys-house" className="granny-house">
          <div className="granny-house-overlay">
            <h2>Granny&apos;s House</h2>
            <p>
              A cozy corner full of handmade crafts, blankets, and country charm.
            </p>
          </div>
        </Link>
      )}

      <Routes>
        {/* HOME / SHOP PAGE */}
        <Route
          path="/"
          element={
            <main className="layout">
              <section className="products">
                <h2>Soaps</h2>
                <div className="product-grid">
                  {PRODUCTS.map((product) => {
                    const remaining = remainingFor(product);

                    return (
                      <div key={product.id} className="product-card">
                        {/* Image links to detail page */}
                        <Link
                          to={`/product/${product.id}`}
                          className="product-link"
                        >
                          <img
                            src={product.img}
                            alt={product.name}
                            className="product-image"
                          />
                        </Link>

                        {/* Name links to detail page */}
                        <h3>
                          <Link
                            to={`/product/${product.id}`}
                            className="product-link"
                          >
                            {product.name}
                          </Link>
                        </h3>

                        <p>${product.price.toFixed(2)}</p>
                        <p className="stock-count">
                          {remaining} available
                        </p>

                        {/* Button row: Add to cart + Buy now */}
                        <div className="button-row">
                          <button
                            onClick={() => addToCart(product)}
                            className="add-to-cart-btn"
                            disabled={remaining <= 0}
                          >
                            {remaining > 0 ? 'Add to cart' : 'Sold out'}
                          </button>

                          {product.id === 'lemon-bar' && (
                            <a
                              href="https://buy.stripe.com/3cI00jbsh7kW1dr10E4Rq08"
                              className="buy-now-btn"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Buy now
                            </a>
                          )}

                          {product.id === 'vanilla-buttercream' && (
                            <a
                              href="https://buy.stripe.com/cNi5kD1RH20CaO1bFi4Rq07"
                              className="buy-now-btn"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Buy now
                            </a>
                          )}

                          {product.id === 'sunflower-sandalwood' && (
                            <a
                              href="https://buy.stripe.com/28EdR98g5ax85tH10E4Rq05"
                              className="buy-now-btn"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Buy now
                            </a>
                          )}

                          {product.id === 'christmas-wreath' && (
                            <a
                              href="https://buy.stripe.com/14A5kDdAp0WycW9aBe4Rq06"
                              className="buy-now-btn"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Buy now
                            </a>
                          )}

                          {product.id === 'whiskey-barrel' && (
                            <a
                              href="https://buy.stripe.com/fZu6oH9k934G1drdNq4Rq09"
                              className="buy-now-btn"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Buy now
                            </a>
                          )}

                          {product.id === 'tabac-leather' && (
                            <a
                              href="https://buy.stripe.com/6oUcN58g520C6xLgZC4Rq0a"
                              className="buy-now-btn"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Buy now
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* CART SIDEBAR */}
              <CartSidebar
                cart={cart}
                changeQty={changeQty}
                removeFromCart={removeFromCart}
                subtotal={subtotal}
                shipping={shipping}
                total={total}
                onCheckout={handleCheckout}
              />
            </main>
          }
        />

        {/* PRODUCT DETAIL PAGE */}
        <Route
          path="/product/:id"
          element={
            <ProductDetail
              products={PRODUCTS}
              cart={cart}
              addToCart={addToCart}
              changeQty={changeQty}
              removeFromCart={removeFromCart}
              subtotal={subtotal}
              shipping={shipping}
              total={total}
              onCheckout={handleCheckout}
              remainingFor={remainingFor}
            />
          }
        />

        {/* GRANNY'S HOUSE PAGE */}
        <Route path="/grannys-house" element={<GrannysHouse />} />
      </Routes>
    </div>
  );
}

/* === Reusable Cart Sidebar === */
function CartSidebar({
  cart,
  changeQty,
  removeFromCart,
  subtotal,
  shipping,
  total,
  onCheckout,
}) {
  return (
    <aside className="cart">
      <h2>Your Cart</h2>

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <ul>
            {cart.map((item) => (
              <li key={item.id} className="cart-item">
                <div>
                  <strong>{item.name}</strong>
                  <div>${item.price.toFixed(2)} each</div>
                </div>

                <div className="cart-controls">
                  <button onClick={() => changeQty(item.id, -1)}>-</button>
                  <span>{item.qty}</span>
                  <button onClick={() => changeQty(item.id, 1)}>+</button>
                </div>

                <div className="cart-line-total">
                  ${(item.price * item.qty).toFixed(2)}
                </div>

                <button
                  className="remove-btn"
                  onClick={() => removeFromCart(item.id)}
                >
                  remove
                </button>
              </li>
            ))}
          </ul>

          <div className="totals">
            <div>
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div>
              <span>Shipping:</span>
              <span>${shipping.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <strong>Total:</strong>
              <strong>${total.toFixed(2)}</strong>
            </div>
          </div>
        </>
      )}

      <button
        className="checkout-main-btn"
        disabled={cart.length === 0}
        onClick={onCheckout}
      >
        Checkout
      </button>
    </aside>
  );
}

/* === Product Detail Page === */
function ProductDetail({
  products,
  cart,
  addToCart,
  changeQty,
  removeFromCart,
  subtotal,
  shipping,
  total,
  onCheckout,
  remainingFor,
}) {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <main
        style={{
          maxWidth: '1120px',
          margin: '0 auto',
          padding: '24px 16px',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none' }}>
          ← Back to shop
        </Link>
        <p style={{ marginTop: '16px' }}>Product not found.</p>
      </main>
    );
  }

  const remaining = remainingFor(product);

  return (
    <main className="layout">
      {/* LEFT: product detail */}
      <div
        style={{
          background: 'rgba(250, 246, 239, 0.98)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 14px 30px rgba(0,0,0,0.06)',
          border: '1px solid rgba(255,255,255,0.7)',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none' }}>
          ← Back to shop
        </Link>

        <img
          src={product.img}
          alt={product.name}
          className="product-image-large"
          style={{ marginTop: '16px', marginBottom: '16px' }}
        />
        <h2
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '1.6rem',
          }}
        >
          {product.name}
        </h2>
        <p style={{ marginTop: '8px', fontSize: '1.1rem' }}>
          ${product.price.toFixed(2)}
        </p>
        <p style={{ marginTop: '4px', fontSize: '0.95rem', opacity: 0.8 }}>
          {remaining} available
        </p>

        <p style={{ marginTop: '16px', lineHeight: 1.6 }}>
          {product.description}
        </p>

        <button
          onClick={() => addToCart(product)}
          style={{
            marginTop: '18px',
            padding: '10px 18px',
            borderRadius: '999px',
            border: 'none',
            cursor: remaining > 0 ? 'pointer' : 'not-allowed',
            background:
              remaining > 0
                ? 'linear-gradient(135deg, #d2bba3, #6c4f32)'
                : '#ccc',
            color: 'white',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontSize: '0.9rem',
          }}
          disabled={remaining <= 0}
        >
          {remaining > 0 ? 'Add to cart' : 'Sold out'}
        </button>

        {/* Stripe checkout buttons per product (detail page) */}
        {product.id === 'lemon-bar' && (
          <a
            href="https://buy.stripe.com/3cI00jbsh7kW1dr10E4Rq08"
            className="checkout-button"
            target="_blank"
            rel="noreferrer"
            style={{
              marginLeft: '12px',
              marginTop: '18px',
              display: 'inline-block',
            }}
          >
            Buy Lemon Bar now
          </a>
        )}

        {product.id === 'whiskey-barrel' && (
          <a
            href="https://buy.stripe.com/fZu6oH9k934G1drdNq4Rq09"
            className="checkout-button"
            target="_blank"
            rel="noreferrer"
            style={{
              marginLeft: '12px',
              marginTop: '18px',
              display: 'inline-block',
            }}
          >
            Buy Whiskey Barrel now
          </a>
        )}

        {product.id === 'tabac-leather' && (
          <a
            href="https://buy.stripe.com/6oUcN58g520C6xLgZC4Rq0a"
            className="checkout-button"
            target="_blank"
            rel="noreferrer"
            style={{
              marginLeft: '12px',
              marginTop: '18px',
              display: 'inline-block',
            }}
          >
            Buy Tabac &amp; Leather now
          </a>
        )}

        {product.id === 'sunflower-sandalwood' && (
          <a
            href="https://buy.stripe.com/28EdR98g5ax85tH10E4Rq05"
            className="checkout-button"
            target="_blank"
            rel="noreferrer"
            style={{
              marginLeft: '12px',
              marginTop: '18px',
              display: 'inline-block',
            }}
          >
            Buy Sunflower Sandwood now
          </a>
        )}

        {product.id === 'christmas-wreath' && (
          <a
            href="https://buy.stripe.com/14A5kDdAp0WycW9aBe4Rq06"
            className="checkout-button"
            target="_blank"
            rel="noreferrer"
            style={{
              marginLeft: '12px',
              marginTop: '18px',
              display: 'inline-block',
            }}
          >
            Buy Christmas Wreath now
          </a>
        )}

        {product.id === 'vanilla-buttercream' && (
          <a
            href="https://buy.stripe.com/cNi5kD1RH20CaO1bFi4Rq07"
            className="checkout-button"
            target="_blank"
            rel="noreferrer"
            style={{
              marginLeft: '12px',
              marginTop: '18px',
              display: 'inline-block',
            }}
          >
            Buy Vanilla Buttercream now
          </a>
        )}
      </div>

      {/* RIGHT: cart sidebar on detail page */}
      <CartSidebar
        cart={cart}
        changeQty={changeQty}
        removeFromCart={removeFromCart}
        subtotal={subtotal}
        shipping={shipping}
        total={total}
        onCheckout={onCheckout}
      />
    </main>
  );
}

/* === Granny's House Page === */
function GrannysHouse() {
  return (
    <main
      style={{
        maxWidth: '1320px', // full width like main layout
        margin: '0 auto',
        padding: '24px 16px',
      }}
    >
      <Link to="/" style={{ textDecoration: 'none' }}>
        ← Back to Suds &amp; Lathers Co.
      </Link>

      <h2
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '2rem',
          marginTop: '16px',
        }}
      >
        Granny&apos;s House
      </h2>

      <p style={{ marginTop: '10px', lineHeight: 1.6 }}>
        Welcome to Granny’s House — a cozy corner filled with homemade crafts,
        blankets, country decor, and nostalgic treasures.
      </p>

      <ul style={{ marginTop: '12px', paddingLeft: '18px' }}>
        <li>Handmade crochet and knit items</li>
        <li>Country-style wall decor</li>
        <li>Seasonal wreaths and table pieces</li>
        <li>Gifts inspired by rustic, simple living</li>
      </ul>

      <p style={{ marginTop: '16px', fontStyle: 'italic', opacity: 0.8 }}>
        More Granny’s House products coming soon…
      </p>
    </main>
  );
}

export default App;
