import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, MessageCircle, Copy, ArrowRight, Share2, Phone, Calendar, Clock, MapPin, X } from 'lucide-react';

export default function OrderConfirmationModal({
  orderData,
  onClose,
  onOpenTracker
}) {
  if (!orderData) return null;

  const { order, whatsappUrl, whatsappNumber } = orderData;
  const currency = '₹';

  // Run confetti explosion on modal open
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // safe fallback if canvas-confetti fails
    }
  }, []);

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.order_number);
    alert(`Order Number ${order.order_number} copied to clipboard!`);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        {/* Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🎉</span>
            <h2 className="drawer-title">Order Placed Successfully!</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="drawer-body">
          <div className="success-banner">
            <div className="success-icon-wrap">
              <CheckCircle2 size={38} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Thank You, {order.customer_name}!
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Your tiffin meal has been recorded in our kitchen system.
            </p>

            <div className="order-code-display" onClick={handleCopyOrderNumber} style={{ cursor: 'pointer' }} title="Click to copy">
              <span>{order.order_number}</span>
              <Copy size={16} style={{ display: 'inline', marginLeft: '8px', verticalAlign: 'middle', opacity: 0.7 }} />
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-light)' }}>
              (Tap code to copy your Order ID)
            </div>
          </div>

          {/* Prominent WhatsApp Call-To-Action */}
          <div style={{
            background: '#f0fdf4',
            border: '2px solid #86efac',
            borderRadius: 'var(--radius-md)',
            padding: '1.2rem',
            margin: '1rem 0',
            textAlign: 'center'
          }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#166534', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <MessageCircle size={20} color="#16a34a" />
              Final Step: Send Confirmation on WhatsApp
            </h4>

            <p style={{ fontSize: '0.84rem', color: '#14532d', marginBottom: '1rem', lineHeight: '1.45' }}>
              Click below to open our official WhatsApp chat with your order summary pre-filled.
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-cta-btn"
              id="whatsapp-continue-button"
            >
              <MessageCircle size={22} fill="white" />
              <span>Continue on WhatsApp →</span>
            </a>

            <div className="whatsapp-disclaimer">
              ⚠️ <strong>Important:</strong> WhatsApp does not send messages automatically. You must tap <strong>"Send"</strong> inside WhatsApp to transmit your order details to us.
            </div>
          </div>

          {/* Order Summary Receipt */}
          <div className="bill-card" style={{ marginTop: '1.25rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.65rem' }}>
              Order Breakdown
            </h4>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: '1.5' }}>
              <div><strong>Delivery To:</strong> {order.delivery_address} ({order.delivery_area})</div>
              <div><strong>Slot:</strong> {order.delivery_date} • {order.delivery_slot}</div>
              <div><strong>Phone:</strong> {order.customer_phone}</div>
              <div><strong>Payment:</strong> {order.payment_method}</div>
              {order.special_instructions && (
                <div><strong>Note:</strong> {order.special_instructions}</div>
              )}
            </div>

            <div style={{ borderTop: '1px dashed var(--border-medium)', paddingTop: '0.6rem', marginBottom: '0.6rem' }}>
              {order.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span>{item.quantity}x {item.item_name}</span>
                  <span style={{ fontWeight: '600' }}>{currency}{item.total_price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px dashed var(--border-medium)', paddingTop: '0.5rem' }}>
              <div className="bill-row">
                <span>Subtotal</span>
                <span>{currency}{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="bill-row">
                <span>Delivery Fee</span>
                <span>{order.delivery_fee === 0 ? 'FREE' : `${currency}${order.delivery_fee.toFixed(2)}`}</span>
              </div>
              <div className="bill-row total">
                <span>Total Amount</span>
                <span>{currency}{order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="drawer-footer" style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn-secondary"
            onClick={() => {
              onClose();
              if (onOpenTracker) onOpenTracker(order.order_number);
            }}
          >
            Track Order Status
          </button>
          <button
            className="btn-primary"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
