import React, { useState, useEffect } from 'react';
import { Search, X, MessageCircle, Clock, CheckCircle2, Truck, AlertCircle, ChefHat, PackageCheck } from 'lucide-react';
import { fetchOrderDetails } from '../api';

const STATUS_STEPS = [
  { key: 'New', label: 'Order Received', desc: 'Sent to kitchen for review' },
  { key: 'Accepted', label: 'Accepted', desc: 'Kitchen accepted your order' },
  { key: 'Preparing', label: 'Preparing', desc: 'Fresh hot cooking underway' },
  { key: 'Out for Delivery', label: 'Out for Delivery', desc: 'Rider is on the way' },
  { key: 'Delivered', label: 'Delivered', desc: 'Delivered to your address' }
];

export default function OrderTrackerModal({
  isOpen,
  onClose,
  initialOrderNumber = ''
}) {
  if (!isOpen) return null;

  const [searchCode, setSearchCode] = useState(initialOrderNumber);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialOrderNumber) {
      handleLookup(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  const handleLookup = async (codeToSearch) => {
    const code = (codeToSearch || searchCode).trim();
    if (!code) {
      setError('Please enter a valid order number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await fetchOrderDetails(code);
      setOrderData(data);
    } catch (err) {
      setError(err.message || 'Order not found. Please check your order code.');
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  const currentStatus = orderData?.order?.status || 'New';
  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === currentStatus);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🔍</span>
            <h2 className="drawer-title">Track Tiffin Order</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Search Bar */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleLookup();
            }}
            style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}
          >
            <input
              type="text"
              className="form-input"
              placeholder="Enter Order # (e.g. TIF-261016-5912)"
              value={searchCode}
              onChange={e => setSearchCode(e.target.value)}
              style={{ textTransform: 'uppercase' }}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ width: 'auto', padding: '0 1.25rem' }}
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </form>

          {error && (
            <div style={{
              background: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {orderData?.order && (
            <div>
              {/* Order status card */}
              <div style={{
                background: 'white',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '1.2rem',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: '700' }}>
                      Order Status
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                      #{orderData.order.order_number}
                    </div>
                  </div>
                  <span className={`order-status-badge ${orderData.order.status.replace(/ /g, '_')}`}>
                    {orderData.order.status}
                  </span>
                </div>

                {orderData.order.status === 'Cancelled' ? (
                  <div style={{
                    background: '#fef2f2',
                    color: '#b91c1c',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}>
                    This order has been cancelled by the kitchen or customer.
                  </div>
                ) : (
                  /* Step Tracker */
                  <div style={{ margin: '1.5rem 0 0.5rem' }}>
                    {STATUS_STEPS.map((step, idx) => {
                      const isCompleted = idx <= currentStepIndex;
                      const isCurrent = idx === currentStepIndex;

                      return (
                        <div key={step.key} style={{ display: 'flex', gap: '0.85rem', marginBottom: '1rem', position: 'relative' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: isCompleted ? (isCurrent ? 'var(--primary)' : '#16a34a') : '#e7e5e4',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            flexShrink: 0,
                            zIndex: 2,
                            boxShadow: isCurrent ? '0 0 0 4px rgba(234, 88, 12, 0.2)' : 'none'
                          }}>
                            {isCompleted ? '✓' : idx + 1}
                          </div>

                          {idx < STATUS_STEPS.length - 1 && (
                            <div style={{
                              position: 'absolute',
                              top: '28px',
                              left: '13px',
                              width: '2px',
                              height: 'calc(100% - 10px)',
                              background: idx < currentStepIndex ? '#16a34a' : '#e7e5e4',
                              zIndex: 1
                            }} />
                          )}

                          <div style={{ paddingBottom: '0.25rem' }}>
                            <div style={{
                              fontSize: '0.88rem',
                              fontWeight: isCurrent ? '800' : '600',
                              color: isCurrent ? 'var(--primary)' : (isCompleted ? 'var(--text-main)' : 'var(--text-light)')
                            }}>
                              {step.label}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {step.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Order Info */}
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                <div><strong>Customer:</strong> {orderData.order.customer_name} ({orderData.order.customer_phone})</div>
                <div><strong>Delivery Address:</strong> {orderData.order.delivery_address} ({orderData.order.delivery_area})</div>
                <div><strong>Delivery Slot:</strong> {orderData.order.delivery_date} • {orderData.order.delivery_slot}</div>
                <div><strong>Total Amount:</strong> ₹{orderData.order.total_amount.toFixed(2)} ({orderData.order.payment_method})</div>
              </div>

              {/* Direct WhatsApp Contact Button */}
              {orderData.whatsappUrl && (
                <a
                  href={orderData.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-cta-btn"
                  style={{ fontSize: '0.92rem', padding: '0.75rem' }}
                >
                  <MessageCircle size={18} fill="white" />
                  <span>Chat with Kitchen on WhatsApp</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
