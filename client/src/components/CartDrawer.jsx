import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, AlertCircle, CheckCircle2, Copy, ArrowRight, MapPin } from 'lucide-react';

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  settings,
  onUpdateQty,
  onClearCart,
  onOrderSuccess
}) {
  const currency = settings?.currency_symbol || '₹';
  const minOrder = settings?.min_order_amount || 0;
  const freeAbove = settings?.free_delivery_above || 0;
  const deliveryAreas = settings?.delivery_areas || [];
  const deliverySlots = (settings?.delivery_slots || []).filter(s => s.active !== false);

  // Form states
  const [customerName, setCustomerName] = useState(() => localStorage.getItem('tiffin_name') || '');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('tiffin_phone') || '');
  const [deliveryAddress, setDeliveryAddress] = useState(() => localStorage.getItem('tiffin_address') || '');
  const [deliveryArea, setDeliveryArea] = useState(() => {
    const saved = localStorage.getItem('tiffin_area');
    if (saved && deliveryAreas.some(a => a.name === saved)) return saved;
    return deliveryAreas[0]?.name || '';
  });

  // Today's date formatted YYYY-MM-DD
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const [deliveryDate, setDeliveryDate] = useState(todayDateStr);
  const [deliverySlot, setDeliverySlot] = useState(deliverySlots[0]?.label || 'Regular Lunch');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Selected area fee
  const selectedAreaObj = deliveryAreas.find(a => a.name === deliveryArea);
  const baseDeliveryFee = selectedAreaObj ? selectedAreaObj.fee : (settings?.default_delivery_fee || 30);
  const isFreeDelivery = subtotal >= freeAbove && freeAbove > 0;
  const deliveryFee = isFreeDelivery ? 0 : baseDeliveryFee;
  const finalTotal = subtotal + deliveryFee;

  const amountNeededForFree = freeAbove > 0 && subtotal < freeAbove ? freeAbove - subtotal : 0;
  const isMinOrderMet = subtotal >= minOrder;

  const handleCopyUpi = () => {
    if (settings?.upi_id) {
      navigator.clipboard.writeText(settings.upi_id);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (cart.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!deliveryAddress.trim() || deliveryAddress.trim().length < 5) {
      setErrorMessage('Please provide a complete delivery address with flat/house number.');
      return;
    }

    if (!deliveryArea) {
      setErrorMessage('Please select your delivery area.');
      return;
    }

    if (!isMinOrderMet) {
      setErrorMessage(`Minimum order amount is ${currency}${minOrder}. Please add more items.`);
      return;
    }

    // Save to localStorage for convenience
    localStorage.setItem('tiffin_name', customerName);
    localStorage.setItem('tiffin_phone', customerPhone);
    localStorage.setItem('tiffin_address', deliveryAddress);
    localStorage.setItem('tiffin_area', deliveryArea);

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: deliveryAddress,
        delivery_area: deliveryArea,
        delivery_slot: deliverySlot,
        delivery_date: deliveryDate,
        special_instructions: specialInstructions,
        payment_method: paymentMethod,
        items: cart.map(i => ({ id: i.id, quantity: i.quantity }))
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit order');
      }

      onOrderSuccess(data);
    } catch (err) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Standard UPI URI for QR generation
  const upiUri = settings?.upi_id
    ? `upi://pay?pa=${settings.upi_id}&pn=${encodeURIComponent(settings.upi_name || 'Sri Vigneswara Tiffens')}&am=${finalTotal.toFixed(2)}&cu=INR`
    : '';

  const qrImageUrl = settings?.upi_qr_url || (upiUri ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUri)}` : '');

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.3rem' }}>🍱</span>
            <h2 className="drawer-title">Your Order Cart</h2>
            {cart.length > 0 && (
              <span className="cart-count-badge">{cart.reduce((a, b) => a + b.quantity, 0)}</span>
            )}
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {errorMessage && (
            <div style={{
              background: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.88rem'
            }}>
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🍲</div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>Your cart is empty</h3>
              <p style={{ fontSize: '0.88rem', maxWidth: '300px', margin: '0 auto 1.5rem' }}>
                Looks like you haven't added any homestyle meals yet. Browse our daily special thalis!
              </p>
              <button className="btn-primary" onClick={onClose} style={{ maxWidth: '200px', margin: '0 auto' }}>
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              {/* Free Delivery incentive banner */}
              {freeAbove > 0 && (
                <div style={{
                  background: isFreeDelivery ? '#ecfdf5' : '#fff7ed',
                  border: `1px solid ${isFreeDelivery ? '#a7f3d0' : '#fed7aa'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  color: isFreeDelivery ? '#047857' : '#9a3412',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  marginBottom: '1rem'
                }}>
                  {isFreeDelivery ? (
                    <>
                      <CheckCircle2 size={16} color="#10b981" />
                      <span>Congratulations! You unlocked <strong>FREE Delivery</strong> 🎉</span>
                    </>
                  ) : (
                    <>
                      <span>🚚 Add {currency}{amountNeededForFree.toFixed(0)} more to get <strong>FREE Delivery</strong>!</span>
                    </>
                  )}
                </div>
              )}

              {/* Items List */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Selected Meals ({cart.length})
                  </span>
                  <button
                    onClick={onClearCart}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <Trash2 size={14} /> Clear all
                  </button>
                </div>

                {cart.map(item => (
                  <div key={item.id} className="cart-item-row">
                    <div style={{ flex: 1 }}>
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-price">
                        {currency}{item.price} x {item.quantity} = <strong>{currency}{(item.price * item.quantity).toFixed(2)}</strong>
                      </div>
                    </div>

                    <div className="qty-counter">
                      <button
                        className="qty-btn"
                        onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="qty-number">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Details Form */}
              <form id="orderForm" onSubmit={handleSubmit}>
                <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={18} color="var(--primary)" />
                  Delivery Details
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name <span className="req">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone (10 Digits) <span className="req">*</span></label>
                    <input
                      type="tel"
                      className="form-input"
                      required
                      placeholder="e.g. 9876543210"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Delivery Area <span className="req">*</span></label>
                  <select
                    className="form-select"
                    value={deliveryArea}
                    onChange={e => setDeliveryArea(e.target.value)}
                    required
                  >
                    {deliveryAreas.map(area => (
                      <option key={area.id || area.name} value={area.name}>
                        {area.name} (Delivery Fee: {currency}{area.fee}) {area.estimatedTime ? `• ~${area.estimatedTime}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Complete Address & Landmark <span className="req">*</span></label>
                  <textarea
                    className="form-textarea"
                    required
                    placeholder="House / Flat No., Floor, Apartment Name, Street, Landmark"
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    rows={2}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Delivery Date <span className="req">*</span></label>
                    <input
                      type="date"
                      className="form-input"
                      min={todayDateStr}
                      value={deliveryDate}
                      onChange={e => setDeliveryDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Meal Slot <span className="req">*</span></label>
                    <select
                      className="form-select"
                      value={deliverySlot}
                      onChange={e => setDeliverySlot(e.target.value)}
                      required
                    >
                      {deliverySlots.map(slot => (
                        <option key={slot.id || slot.label} value={slot.label}>
                          {slot.mealType ? `[${slot.mealType}] ` : ''}{slot.label} ({slot.timeRange})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Special Cooking / Delivery Instructions (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Less spicy, keep at security, do not ring bell"
                    value={specialInstructions}
                    onChange={e => setSpecialInstructions(e.target.value)}
                  />
                </div>

                {/* Payment Selection */}
                <h4 style={{ fontSize: '1rem', fontWeight: '800', margin: '1.25rem 0 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>💳</span> Select Payment Method
                </h4>

                <div className="payment-options">
                  <div
                    className={`payment-card ${paymentMethod === 'UPI' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('UPI')}
                  >
                    <span style={{ fontSize: '1.3rem' }}>📱</span>
                    <div>
                      <div className="payment-card-title">UPI / QR Code</div>
                      <div className="payment-card-sub">GPay, PhonePe, Paytm</div>
                    </div>
                  </div>

                  <div
                    className={`payment-card ${paymentMethod === 'COD' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('COD')}
                  >
                    <span style={{ fontSize: '1.3rem' }}>💵</span>
                    <div>
                      <div className="payment-card-title">Cash on Delivery</div>
                      <div className="payment-card-sub">Pay cash when food arrives</div>
                    </div>
                  </div>
                </div>

                {/* UPI Details Box */}
                {paymentMethod === 'UPI' && (
                  <div className="upi-box">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#9a3412' }}>Pay via UPI ID:</span>
                      <button type="button" className="copy-btn" onClick={handleCopyUpi}>
                        {copiedUpi ? 'Copied! ✓' : 'Copy UPI'}
                      </button>
                    </div>

                    <div className="upi-id-badge" style={{ width: '100%', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span>{settings?.upi_id || 'annapurna.tiffin@okhdfcbank'}</span>
                      <Copy size={14} />
                    </div>

                    {qrImageUrl && (
                      <div style={{ textAlign: 'center', margin: '0.75rem 0', background: 'white', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: '600' }}>
                          Scan to pay <strong>{currency}{finalTotal.toFixed(2)}</strong>:
                        </div>
                        <img
                          src={qrImageUrl}
                          alt="UPI QR Code"
                          style={{ width: '140px', height: '140px', margin: '0 auto', display: 'block', borderRadius: '4px' }}
                        />
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                          Accepts Google Pay, PhonePe, Paytm, BHIM & All UPI Apps
                        </div>
                      </div>
                    )}

                    <div style={{
                      fontSize: '0.75rem',
                      color: '#b45309',
                      background: '#fffbeb',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid #fde68a',
                      lineHeight: '1.4'
                    }}>
                      <strong>Payment Notice:</strong> We do not automatically charge or auto-verify UPI payments. After placing this order, please share your payment screenshot on WhatsApp to verify your order.
                    </div>
                  </div>
                )}

                {/* Bill Breakdown */}
                <div className="bill-card">
                  <div className="bill-row">
                    <span>Items Subtotal</span>
                    <span>{currency}{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="bill-row">
                    <span>Delivery Fee ({deliveryArea})</span>
                    <span>
                      {isFreeDelivery ? (
                        <span style={{ color: '#15803d', fontWeight: '700' }}>FREE</span>
                      ) : (
                        `${currency}${deliveryFee.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  <div className="bill-row total">
                    <span>To Pay</span>
                    <span>{currency}{finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {!isMinOrderMet && (
                  <div style={{
                    background: '#fff1f2',
                    color: '#e11d48',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <AlertCircle size={16} />
                    <span>Minimum order amount is {currency}{minOrder}. Please add {currency}{(minOrder - subtotal).toFixed(0)} more.</span>
                  </div>
                )}
              </form>
            </>
          )}
        </div>

        {/* Footer with Place Order Button */}
        {cart.length > 0 && (
          <div className="drawer-footer">
            <button
              type="submit"
              form="orderForm"
              className="btn-primary"
              disabled={isSubmitting || !isMinOrderMet}
            >
              {isSubmitting ? (
                <span>Placing Your Order...</span>
              ) : (
                <>
                  <span>Confirm Order ({currency}{finalTotal.toFixed(2)})</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
            <div style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
              🔒 Safe & Secure Homestyle Kitchen Order
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
