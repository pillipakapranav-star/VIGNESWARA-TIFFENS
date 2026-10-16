import React from 'react';
import { Plus, Minus, Flame, Utensils } from 'lucide-react';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80';

export default function MenuItemCard({
  item,
  currency = '₹',
  cartQty = 0,
  onAddToCart,
  onUpdateQty
}) {
  const isAvailable = item.is_available === 1;
  const isVeg = item.dietary === 'veg';

  return (
    <article className="food-card">
      <div className="food-image-wrapper">
        <img
          src={item.photo_url || FALLBACK_IMAGE}
          alt={item.name}
          className="food-image"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = FALLBACK_IMAGE;
          }}
        />

        <div className="food-badge-overlay">
          {item.is_special === 1 && (
            <span className="special-badge">Special</span>
          )}
          <span className={`diet-indicator ${isVeg ? 'veg' : 'non-veg'}`} title={isVeg ? 'Pure Veg' : 'Non-Veg'}>
            <span className="dot"></span>
          </span>
        </div>

        {!isAvailable && (
          <div className="sold-out-overlay">
            Sold Out Today
          </div>
        )}
      </div>

      <div className="food-card-body">
        <div className="food-title-row">
          <h3 className="food-title">{item.name}</h3>
        </div>

        {item.serving_info && (
          <div className="food-serving">
            {item.serving_info}
          </div>
        )}

        <p className="food-description">{item.description}</p>

        <div className="food-footer">
          <div className="food-price">
            {currency}{item.price}
          </div>

          <div>
            {!isAvailable ? (
              <button className="add-btn" disabled>
                Unavailable
              </button>
            ) : cartQty === 0 ? (
              <button
                className="add-btn"
                onClick={() => onAddToCart(item)}
                aria-label={`Add ${item.name} to cart`}
              >
                <Plus size={16} />
                <span>ADD</span>
              </button>
            ) : (
              <div className="qty-counter">
                <button
                  className="qty-btn"
                  onClick={() => onUpdateQty(item.id, cartQty - 1)}
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="qty-number">{cartQty}</span>
                <button
                  className="qty-btn"
                  onClick={() => onUpdateQty(item.id, cartQty + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
