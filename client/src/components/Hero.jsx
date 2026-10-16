import React from 'react';
import { Sparkles, Clock, Truck, ShieldCheck, HeartHandshake, MapPin } from 'lucide-react';

export default function Hero({ settings }) {
  const currency = settings?.currency_symbol || '₹';
  const minOrder = settings?.min_order_amount || 0;
  const freeAbove = settings?.free_delivery_above || 0;

  return (
    <section className="hero-card">
      <div className="hero-content">
        <div className="hero-tag">
          <Sparkles size={14} />
          <span>Homestyle • Fresh Daily • Zero Preservatives</span>
        </div>

        <h1 className="hero-title">
          {settings?.tagline || 'Authentic & Piping Hot South Indian Tiffens, Crispy Dosas & Idlis'}
        </h1>

        <p className="hero-desc">
          Prepared in hygienic homestyle kitchens with pure ingredients, cold-pressed oils, and authentic grandma recipes. Hot, healthy lunch & dinner delivered on your schedule.
        </p>

        <div className="hero-features">
          {settings?.shop_address && (
            <div className="hero-badge-pill" title="Shop Address">
              <MapPin size={14} color="#ea580c" />
              <span>{settings.shop_address}</span>
            </div>
          )}

          <div className="hero-badge-pill">
            <Clock size={14} color="#ea580c" />
            <span>{settings?.business_hours_text || 'Mon - Sun: 7:30 AM - 9:30 PM'}</span>
          </div>

          <div className="hero-badge-pill">
            <Truck size={14} color="#ea580c" />
            <span>Free Delivery on orders above {currency}{freeAbove}</span>
          </div>

          <div className="hero-badge-pill">
            <ShieldCheck size={14} color="#15803d" />
            <span>Min. Order {currency}{minOrder}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
