import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import CategoryNav from './components/CategoryNav';
import MenuItemCard from './components/MenuItemCard';
import CartDrawer from './components/CartDrawer';
import OrderConfirmationModal from './components/OrderConfirmationModal';
import OrderTrackerModal from './components/OrderTrackerModal';
import AdminDashboard from './components/AdminDashboard';
import { fetchSettings, fetchMenu } from './api';
import { Search, Sparkles, ShoppingBag, ArrowRight, Phone, MessageCircle, Heart, ShieldCheck, MapPin } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cart state persisted in localStorage
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('tiffin_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('tiffin_cart', JSON.stringify(cart));
  }, [cart]);

  // Filtering states
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [vegOnlyFilter, setVegOnlyFilter] = useState(false);

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [trackerOrderNumber, setTrackerOrderNumber] = useState('');
  const [confirmedOrderData, setConfirmedOrderData] = useState(null);

  // Load data
  const loadData = async () => {
    try {
      const [settingsData, menuData] = await Promise.all([
        fetchSettings(),
        fetchMenu()
      ]);
      setSettings(settingsData);
      setCategories(menuData.categories || []);
      setMenuItems(menuData.items || []);
    } catch (err) {
      console.error('Error loading app data:', err);
      setError('Unable to load menu. Please check your connection or try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cart actions
  const handleAddToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleUpdateQty = (itemId, newQty) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(i => i.id !== itemId));
    } else {
      setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity: newQty } : i));
    }
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleOrderSuccess = (orderData) => {
    setCart([]);
    setIsCartOpen(false);
    setConfirmedOrderData(orderData);
  };

  // Filter items
  const filteredItems = menuItems.filter(item => {
    // Category filter
    if (activeCategory !== 'all' && item.category_id !== activeCategory) {
      return false;
    }

    // Veg only
    if (vegOnlyFilter && item.dietary !== 'veg') {
      return false;
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      const matchCategory = (item.category_name || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCategory) return false;
    }

    return true;
  });

  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const currency = settings?.currency_symbol || '₹';

  return (
    <div className="app-container">
      {/* Sticky Header */}
      <Header
        settings={settings}
        cartCount={cartTotalCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenTracker={() => {
          setTrackerOrderNumber('');
          setIsTrackerOpen(true);
        }}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {/* Main Content */}
      <main style={{ flex: 1, paddingBottom: cart.length > 0 ? '5rem' : '1.5rem' }}>
        {/* Hero Section */}
        <Hero settings={settings} />

        {/* Store Closed Banner if not accepting orders */}
        {settings?.is_accepting_orders === 0 && (
          <div style={{
            background: '#fef2f2',
            border: '1.5px solid #fecaca',
            color: '#b91c1c',
            margin: '0.75rem 1rem',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.3rem' }}>🔴</span>
              <div>
                <div style={{ fontWeight: '800', fontSize: '0.92rem' }}>Kitchen is Currently Closed</div>
                <div style={{ fontSize: '0.78rem', color: '#991b1b', marginTop: '2px' }}>
                  We are currently not accepting new orders. Please check back during our business hours ({settings?.business_hours_text || 'Morning & Evening'}).
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.76rem', fontWeight: '800', background: 'white', color: '#b91c1c', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)', border: '1px solid #fecaca' }}>
              Orders Paused
            </span>
          </div>
        )}

        {/* Category Pills Navigation */}
        <CategoryNav
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />

        {/* Search and Filters Bar */}
        <div className="filter-bar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search dishes (e.g. Thali, Paratha, Dal, Gulab Jamun)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                ✕
              </button>
            )}
          </div>

          <button
            className={`diet-toggle-btn ${vegOnlyFilter ? 'active' : ''}`}
            onClick={() => setVegOnlyFilter(!vegOnlyFilter)}
          >
            <span>🟢</span>
            <span>Pure Veg Only</span>
          </button>
        </div>

        {/* Menu Section */}
        <section className="menu-section">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🍱</div>
              <p style={{ fontWeight: '600' }}>Loading fresh daily tiffin menu...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#b91c1c' }}>
              <p>{error}</p>
              <button className="btn-primary" onClick={loadData} style={{ maxWidth: '200px', margin: '1rem auto 0' }}>
                Retry Loading
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'white', borderRadius: 'var(--radius-lg)', margin: '1rem 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>No dishes matched your search</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Try searching for something else or clear your filters.
              </p>
              <button
                className="btn-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setVegOnlyFilter(false);
                  setActiveCategory('all');
                }}
                style={{ maxWidth: '180px', margin: '0 auto' }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div>
              <div className="section-header">
                <h2 className="section-title">
                  <span>{activeCategory === 'all' ? 'Today’s Homestyle Menu' : (categories.find(c => c.id === activeCategory)?.name || 'Menu Items')}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: '600' }}>
                    ({filteredItems.length} items)
                  </span>
                </h2>
              </div>

              <div className="items-grid">
                {filteredItems.map(item => {
                  const cartItem = cart.find(ci => ci.id === item.id);
                  return (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      currency={currency}
                      cartQty={cartItem ? cartItem.quantity : 0}
                      onAddToCart={handleAddToCart}
                      onUpdateQty={handleUpdateQty}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Floating Bottom Cart Bar when Cart has Items */}
      {cart.length > 0 && !isCartOpen && (
        <div className="floating-cart-bar" onClick={() => setIsCartOpen(true)}>
          <div className="cart-bar-left">
            <span className="cart-bar-badge">{cartTotalCount} items</span>
            <div>
              <div className="cart-bar-total">{currency}{cartSubtotal.toFixed(2)}</div>
              <div className="cart-bar-sub">Plus delivery charges</div>
            </div>
          </div>

          <button className="cart-bar-btn">
            <span>View Cart</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🍱</span>
          <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
            {settings?.business_name || 'Sri Vigneswara Tiffens'}
          </strong>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto' }}>
          Delivering fresh, hygienic homestyle meals cooked with pure ghee, whole grains, and mom's love.
        </p>

        {settings?.shop_address && (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0.5rem auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
            <MapPin size={14} color="var(--primary)" /> {settings.shop_address}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          {settings?.phone_number && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Phone size={14} /> {settings.phone_number}
            </span>
          )}
          {settings?.whatsapp_number && (
            <a
              href={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#16a34a', fontWeight: '600' }}
            >
              <MessageCircle size={14} /> WhatsApp Us
            </a>
          )}
          <span
            onClick={() => setIsAdminOpen(true)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)', fontWeight: '600' }}
          >
            <ShieldCheck size={14} /> Owner Login
          </span>
        </div>

        <div className="footer-text">
          Default Timezone: {settings?.timezone || 'Asia/Kolkata'} • Currency: {settings?.currency_code || 'INR'} ({currency})
        </div>
      </footer>

      {/* Modals & Drawers */}
      {isCartOpen && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          settings={settings}
          onUpdateQty={handleUpdateQty}
          onClearCart={handleClearCart}
          onOrderSuccess={handleOrderSuccess}
        />
      )}

      {confirmedOrderData && (
        <OrderConfirmationModal
          orderData={confirmedOrderData}
          onClose={() => setConfirmedOrderData(null)}
          onOpenTracker={(orderNum) => {
            setConfirmedOrderData(null);
            setTrackerOrderNumber(orderNum);
            setIsTrackerOpen(true);
          }}
        />
      )}

      {isTrackerOpen && (
        <OrderTrackerModal
          isOpen={isTrackerOpen}
          onClose={() => setIsTrackerOpen(false)}
          initialOrderNumber={trackerOrderNumber}
        />
      )}

      {isAdminOpen && (
        <AdminDashboard
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          onRefreshMenu={loadData}
        />
      )}
    </div>
  );
}
