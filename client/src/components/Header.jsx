import React from 'react';
import { ShoppingBag, Search, ShieldCheck, Clock, Phone, MapPin } from 'lucide-react';

export default function Header({
  settings,
  cartCount,
  onOpenCart,
  onOpenAdmin,
  onOpenTracker,
  searchTerm,
  setSearchTerm
}) {
  const isOpen = settings?.is_accepting_orders === 1;

  return (
    <header className="header-master" style={{ position: 'sticky', top: 0, zIndex: 40 }}>
      {settings?.shop_address && (
        <div
          className="top-address-strip"
          style={{
            background: 'linear-gradient(90deg, #9a3412 0%, #ea580c 50%, #c2410c 100%)',
            color: '#ffffff',
            fontSize: '0.78rem',
            padding: '0.42rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            fontWeight: '600',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <MapPin size={13} style={{ flexShrink: 0 }} />
          <span><strong>Shop Address:</strong> {settings.shop_address}</span>
          {settings?.phone_number && (
            <span style={{ opacity: 0.9, marginLeft: '0.5rem' }}>
              • 📞 {settings.phone_number}
            </span>
          )}
        </div>
      )}

      <div className="top-nav" style={{ position: 'relative' }}>
        <div className="brand-badge" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="brand-icon">
            🍱
          </div>
          <div>
            <div className="brand-title">{settings?.business_name || 'Sri Vigneswara Tiffens'}</div>
            {settings?.shop_address && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                <MapPin size={11} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={settings.shop_address}>
                  {settings.shop_address}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
              <span className={`status-pill ${isOpen ? 'open' : 'closed'}`}>
                <span className="status-dot"></span>
                {isOpen ? 'Accepting Orders' : 'Kitchen Closed'}
              </span>
              <span className="brand-sub" style={{ display: 'none', md: 'inline' }}>
                • {settings?.timezone || 'Asia/Kolkata'}
              </span>
            </div>
          </div>
        </div>

      <div className="nav-actions">
        <button
          className="nav-btn"
          onClick={onOpenTracker}
          title="Track your order status"
        >
          <Search size={16} />
          <span style={{ display: 'none', sm: 'inline' }}>Track</span>
        </button>

        <button
          className="nav-btn"
          onClick={onOpenAdmin}
          title="Owner / Admin Portal"
        >
          <ShieldCheck size={16} />
          <span style={{ display: 'none', sm: 'inline' }}>Admin</span>
        </button>

        <button
          className="cart-nav-btn"
          onClick={onOpenCart}
          aria-label="View Cart"
        >
          <ShoppingBag size={18} />
          <span>Cart</span>
          {cartCount > 0 && (
            <span className="cart-count-badge">{cartCount}</span>
          )}
        </button>
      </div>
      </div>
    </header>
  );
}
