import React, { useState, useEffect } from 'react';
import {
  X, Lock, ShieldCheck, LogOut, RefreshCw, Plus, Edit2, Trash2,
  Eye, EyeOff, Check, AlertCircle, TrendingUp, ShoppingBag,
  Clock, DollarSign, MapPin, Settings, MessageCircle, Upload, Save, ChevronRight
} from 'lucide-react';
import {
  adminLogin,
  adminVerifyToken,
  adminFetchOrders,
  adminUpdateOrderStatus,
  adminFetchReports,
  adminCreateMenuItem,
  adminUpdateMenuItem,
  adminToggleItemAvailability,
  adminDeleteMenuItem,
  adminFetchSettings,
  adminUpdateSettings,
  adminUploadImage,
  adminChangePassword,
  adminUpdateItemPrice,
  adminToggleStoreStatus
} from '../api';

const STATUS_LIST = ['New', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

export default function AdminDashboard({ isOpen, onClose, onRefreshMenu }) {
  const [token, setToken] = useState(() => localStorage.getItem('tiffin_admin_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // orders, menu, reports, settings, security

  // Auth form
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Data states
  const [orders, setOrders] = useState([]);
  const [ordersFilter, setOrdersFilter] = useState('all');
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Menu management states
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingItem, setEditingItem] = useState(null); // null = not editing; {} = adding new; or item object
  const [menuLoading, setMenuLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Reports states
  const [reports, setReports] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Settings states
  const [settingsForm, setSettingsForm] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  // Store Open / Closed quick toggle state
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [tempPrice, setTempPrice] = useState('');

  // Password change
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMessage, setPassMessage] = useState('');
  const [passError, setPassError] = useState('');

  const handleToggleStore = async () => {
    try {
      const res = await adminToggleStoreStatus(token);
      setIsStoreOpen(res.is_accepting_orders === 1);
      if (onRefreshMenu) onRefreshMenu();
    } catch (err) {
      alert('Failed to toggle store status: ' + err.message);
    }
  };

  const handleQuickPriceSave = async (itemId) => {
    const numPrice = parseFloat(tempPrice);
    if (isNaN(numPrice) || numPrice < 0) {
      alert('Please enter a valid price');
      return;
    }
    try {
      await adminUpdateItemPrice(token, itemId, numPrice);
      setMenuItems(prev => prev.map(i => i.id === itemId ? { ...i, price: numPrice } : i));
      setEditingPriceId(null);
      if (onRefreshMenu) onRefreshMenu();
    } catch (err) {
      alert('Failed to update price: ' + err.message);
    }
  };

  // Verify stored token on mount
  useEffect(() => {
    if (token) {
      adminVerifyToken(token).then(valid => {
        if (valid) {
          setIsAuthenticated(true);
          loadSettings();
        } else {
          localStorage.removeItem('tiffin_admin_token');
          setToken('');
          setIsAuthenticated(false);
        }
      });
    }
  }, [token]);

  // Load active tab data when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      loadSettings(); // keep store status in sync
      if (activeTab === 'orders') loadOrders();
      if (activeTab === 'menu') loadMenuData();
      if (activeTab === 'reports') loadReports();
      if (activeTab === 'settings') loadSettings();
    }
  }, [isAuthenticated, activeTab, token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await adminLogin(loginPassword);
      setToken(res.token);
      localStorage.setItem('tiffin_admin_token', res.token);
      setIsAuthenticated(true);
      setLoginPassword('');
    } catch (err) {
      setAuthError(err.message || 'Invalid password');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tiffin_admin_token');
    setToken('');
    setIsAuthenticated(false);
  };

  // Orders functions
  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const params = {};
      if (ordersFilter !== 'all') params.status = ordersFilter;
      if (ordersSearch) params.search = ordersSearch;
      const res = await adminFetchOrders(token, params);
      setOrders(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await adminUpdateOrderStatus(token, orderId, newStatus);
      // Update locally
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const openCustomerWhatsApp = (order) => {
    let cleanPhone = order.customer_phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    const message = `Hello ${order.customer_name}! This is regarding your Tiffin Order #${order.order_number}. Current status: *${order.status}*. We are preparing/delivering your fresh meal!`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Menu functions
  const loadMenuData = async () => {
    setMenuLoading(true);
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      setMenuItems(data.items || []);
      setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setMenuLoading(false);
    }
  };

  const handleToggleItemStock = async (itemId) => {
    try {
      await adminToggleItemAvailability(token, itemId);
      setMenuItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, is_available: item.is_available === 1 ? 0 : 1 } : item
      ));
      if (onRefreshMenu) onRefreshMenu();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteItem = async (itemId, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await adminDeleteMenuItem(token, itemId);
      setMenuItems(prev => prev.filter(i => i.id !== itemId));
      if (onRefreshMenu) onRefreshMenu();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem.id) {
        // Update
        const updated = await adminUpdateMenuItem(token, editingItem.id, editingItem);
        setMenuItems(prev => prev.map(i => i.id === updated.id ? updated : i));
      } else {
        // Create
        const created = await adminCreateMenuItem(token, editingItem);
        setMenuItems(prev => [created, ...prev]);
      }
      setEditingItem(null);
      if (onRefreshMenu) onRefreshMenu();
    } catch (err) {
      alert('Error saving item: ' + err.message);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await adminUploadImage(token, file);
      setEditingItem(prev => ({ ...prev, photo_url: url }));
    } catch (err) {
      alert('Image upload failed: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Reports
  const loadReports = async () => {
    setReportsLoading(true);
    try {
      const data = await adminFetchReports(token);
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setReportsLoading(false);
    }
  };

  // Settings
  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const data = await adminFetchSettings(token);
      setSettingsForm(data);
      if (typeof data.is_accepting_orders === 'number') {
        setIsStoreOpen(data.is_accepting_orders === 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsSuccess('');
    try {
      await adminUpdateSettings(token, settingsForm);
      setSettingsSuccess('Settings saved successfully!');
      setTimeout(() => setSettingsSuccess(''), 3000);
      if (onRefreshMenu) onRefreshMenu();
    } catch (err) {
      alert('Failed to update settings: ' + err.message);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassMessage('');

    if (newPass !== confirmPass) {
      setPassError('New passwords do not match');
      return;
    }

    try {
      await adminChangePassword(token, currentPass, newPass);
      setPassMessage('Password updated successfully!');
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err) {
      setPassError(err.message || 'Failed to update password');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="drawer-panel"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '960px', width: '96vw', height: '94vh', maxHeight: '94vh' }}
      >
        {/* Header */}
        <div className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: '#ea580c', color: 'white', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', lineHeight: '1.2' }}>Owner Admin Portal</h2>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {isAuthenticated ? 'Authenticated Session • Live Store Controls' : 'Password Protected'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {isAuthenticated && (
              <>
                <button
                  type="button"
                  onClick={handleToggleStore}
                  style={{
                    background: isStoreOpen ? '#ecfdf5' : '#fef2f2',
                    border: `1.5px solid ${isStoreOpen ? '#86efac' : '#fecaca'}`,
                    color: isStoreOpen ? '#15803d' : '#b91c1c',
                    padding: '0.35rem 0.85rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                  }}
                  title="Click to toggle whether customer orders are accepted or closed"
                >
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isStoreOpen ? '#16a34a' : '#dc2626',
                    display: 'inline-block'
                  }}></span>
                  <span>{isStoreOpen ? 'KITCHEN OPEN' : 'KITCHEN CLOSED'}</span>
                </button>

                <button
                  className="btn-secondary"
                  onClick={handleLogout}
                  style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </>
            )}
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Not Authenticated: Login View */}
        {!isAuthenticated ? (
          <div className="drawer-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ maxWidth: '380px', width: '100%', padding: '1rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <Lock size={26} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Owner Dashboard Login</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Enter your business admin password to manage orders, menu items, and settings.
                </p>
              </div>

              {authError && (
                <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">Admin Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Enter password..."
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: '#166534', marginBottom: '1.25rem' }}>
                  🔑 <strong>Default Master Password:</strong> <code style={{ fontWeight: '700' }}>admin123</code> (You can change this anytime in Security settings)
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={authLoading}
                >
                  {authLoading ? 'Verifying...' : 'Unlock Dashboard'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard View */
          <>
            <div className="admin-tabs">
              <div
                className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <ShoppingBag size={16} />
                <span>Orders</span>
                {orders.filter(o => o.status === 'New').length > 0 && (
                  <span style={{ background: '#ea580c', color: 'white', borderRadius: '999px', fontSize: '0.7rem', padding: '0.1rem 0.45rem', fontWeight: '800' }}>
                    {orders.filter(o => o.status === 'New').length} New
                  </span>
                )}
              </div>

              <div
                className={`admin-tab ${activeTab === 'menu' ? 'active' : ''}`}
                onClick={() => setActiveTab('menu')}
              >
                <span>🍱</span>
                <span>Menu Items ({menuItems.length})</span>
              </div>

              <div
                className={`admin-tab ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('reports')}
              >
                <TrendingUp size={16} />
                <span>Sales Reports</span>
              </div>

              <div
                className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <Settings size={16} />
                <span>Store Settings</span>
              </div>

              <div
                className={`admin-tab ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <Lock size={16} />
                <span>Security</span>
              </div>
            </div>

            <div className="drawer-body" style={{ background: 'var(--bg-main)' }}>
              {/* TAB 1: ORDERS */}
              {activeTab === 'orders' && (
                <div>
                  {/* Filters & Refresh */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {['all', 'New', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'].map(st => (
                        <button
                          key={st}
                          className={`category-pill ${ordersFilter === st ? 'active' : ''}`}
                          onClick={() => {
                            setOrdersFilter(st);
                            setTimeout(loadOrders, 50);
                          }}
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        >
                          {st === 'all' ? 'All Orders' : st}
                        </button>
                      ))}
                    </div>

                    <button
                      className="nav-btn"
                      onClick={loadOrders}
                      disabled={ordersLoading}
                    >
                      <RefreshCw size={14} className={ordersLoading ? 'animate-spin' : ''} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {ordersLoading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>Loading orders...</div>
                  ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)' }}>
                      <ShoppingBag size={40} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
                      <h4 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>No orders found</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Orders placed by customers will appear here in real time.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {orders.map(order => (
                        <div
                          key={order.id}
                          style={{
                            background: 'white',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1.15rem',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>#{order.order_number}</span>
                                <span className={`order-status-badge ${order.status.replace(/ /g, '_')}`}>
                                  {order.status}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '2px' }}>
                                Placed on {new Date(order.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                              </div>
                            </div>

                            {/* Status changer dropdown */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <select
                                className="form-select"
                                style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem', width: 'auto' }}
                                value={order.status}
                                onChange={e => handleStatusChange(order.id, e.target.value)}
                              >
                                {STATUS_LIST.map(st => (
                                  <option key={st} value={st}>{st}</option>
                                ))}
                              </select>

                              <button
                                className="nav-btn"
                                onClick={() => openCustomerWhatsApp(order)}
                                style={{ background: '#dcfce7', borderColor: '#86efac', color: '#15803d' }}
                                title="Chat with customer on WhatsApp"
                              >
                                <MessageCircle size={16} />
                                <span>WhatsApp Customer</span>
                              </button>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: '0.82rem', background: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
                            <div>
                              <div><strong>Customer:</strong> {order.customer_name}</div>
                              <div><strong>Phone:</strong> {order.customer_phone}</div>
                            </div>
                            <div>
                              <div><strong>Address:</strong> {order.delivery_address}</div>
                              <div><strong>Area:</strong> {order.delivery_area}</div>
                            </div>
                            <div>
                              <div><strong>Date & Slot:</strong> {order.delivery_date} • {order.delivery_slot}</div>
                              <div><strong>Payment:</strong> <span style={{ fontWeight: '700' }}>{order.payment_method}</span></div>
                            </div>
                          </div>

                          {order.special_instructions && (
                            <div style={{ fontSize: '0.8rem', background: '#fffbeb', border: '1px solid #fde68a', padding: '0.45rem 0.75rem', borderRadius: '4px', marginBottom: '0.75rem', color: '#b45309' }}>
                              <strong>📝 Customer Note:</strong> {order.special_instructions}
                            </div>
                          )}

                          {/* Preserved items */}
                          <div style={{ borderTop: '1px dashed var(--border-medium)', paddingTop: '0.6rem' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                              Ordered Items ({order.items?.length || 0})
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                              {order.items?.map((it, idx) => (
                                <div key={idx} style={{ fontSize: '0.85rem', background: 'white', border: '1px solid var(--border-medium)', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>
                                  <strong>{it.quantity}x</strong> {it.item_name} @ ₹{it.unit_price} = <strong>₹{it.total_price.toFixed(2)}</strong>
                                </div>
                              ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem', fontSize: '0.88rem', fontWeight: '800' }}>
                              <span>Subtotal: ₹{order.subtotal.toFixed(2)}</span>
                              <span>Delivery: {order.delivery_fee === 0 ? 'FREE' : `₹${order.delivery_fee.toFixed(2)}`}</span>
                              <span style={{ color: 'var(--primary)', fontSize: '1rem' }}>Total: ₹{order.total_amount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MENU MANAGEMENT */}
              {activeTab === 'menu' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Manage Food Items</h3>
                    <button
                      className="btn-primary"
                      onClick={() => setEditingItem({
                        name: '',
                        category_id: categories[0]?.id || 1,
                        price: 100,
                        description: '',
                        photo_url: '',
                        is_available: 1,
                        is_special: 0,
                        dietary: 'veg',
                        spice_level: 'medium',
                        serving_info: 'Serves 1'
                      })}
                      style={{ width: 'auto', padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                    >
                      <Plus size={16} />
                      <span>Add New Dish</span>
                    </button>
                  </div>

                  {/* Add / Edit Item Modal / Inline Form */}
                  {editingItem && (
                    <div style={{ background: 'white', border: '2px solid var(--primary-200)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: '800' }}>
                          {editingItem.id ? `Edit Dish: ${editingItem.name}` : 'Add New Dish to Menu'}
                        </h4>
                        <button
                          className="close-btn"
                          onClick={() => setEditingItem(null)}
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <form onSubmit={handleSaveItem}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                          <div className="form-group">
                            <label className="form-label">Dish Name <span className="req">*</span></label>
                            <input
                              type="text"
                              className="form-input"
                              required
                              value={editingItem.name || ''}
                              onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                              placeholder="e.g. Special Ghar Ki Thali"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Category <span className="req">*</span></label>
                            <select
                              className="form-select"
                              value={editingItem.category_id}
                              onChange={e => setEditingItem({ ...editingItem, category_id: e.target.value })}
                            >
                              {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Price (INR ₹) <span className="req">*</span></label>
                            <input
                              type="number"
                              className="form-input"
                              required
                              step="1"
                              min="0"
                              value={editingItem.price || ''}
                              onChange={e => setEditingItem({ ...editingItem, price: e.target.value })}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Serving Info</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Serves 1 • 4 Rotis, Sabzi, Dal"
                              value={editingItem.serving_info || ''}
                              onChange={e => setEditingItem({ ...editingItem, serving_info: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Description</label>
                          <textarea
                            className="form-textarea"
                            rows={2}
                            placeholder="Detailed description of ingredients, preparation style..."
                            value={editingItem.description || ''}
                            onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                          <div className="form-group">
                            <label className="form-label">Photo URL</label>
                            <input
                              type="url"
                              className="form-input"
                              placeholder="https://... or upload image below"
                              value={editingItem.photo_url || ''}
                              onChange={e => setEditingItem({ ...editingItem, photo_url: e.target.value })}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Or Upload Food Image</label>
                            <input
                              type="file"
                              accept="image/*"
                              className="form-input"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                            />
                            {uploadingImage && <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Uploading...</span>}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', margin: '0.75rem 0 1.25rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                            <input
                              type="checkbox"
                              checked={editingItem.is_available === 1}
                              onChange={e => setEditingItem({ ...editingItem, is_available: e.target.checked ? 1 : 0 })}
                            />
                            <strong>Available in Stock</strong>
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                            <input
                              type="checkbox"
                              checked={editingItem.is_special === 1}
                              onChange={e => setEditingItem({ ...editingItem, is_special: e.target.checked ? 1 : 0 })}
                            />
                            <strong>Mark as Today's Special</strong>
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                            <input
                              type="radio"
                              name="dietary"
                              checked={editingItem.dietary === 'veg'}
                              onChange={() => setEditingItem({ ...editingItem, dietary: 'veg' })}
                            />
                            <span>🟢 Pure Veg</span>
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                            <input
                              type="radio"
                              name="dietary"
                              checked={editingItem.dietary === 'non-veg'}
                              onChange={() => setEditingItem({ ...editingItem, dietary: 'non-veg' })}
                            />
                            <span>🔴 Non-Veg</span>
                          </label>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setEditingItem(null)}
                            style={{ width: 'auto' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn-primary"
                            style={{ width: 'auto' }}
                          >
                            Save Dish
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Items List */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {menuItems.map(item => (
                      <div
                        key={item.id}
                        style={{
                          background: 'white',
                          border: '1px solid var(--border-medium)',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <div style={{ height: '120px', background: '#f5f5f4', position: 'relative' }}>
                          <img
                            src={item.photo_url || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80'}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                            <span className={`diet-indicator ${item.dietary === 'veg' ? 'veg' : 'non-veg'}`}>
                              <span className="dot"></span>
                            </span>
                          </div>
                          {item.is_special === 1 && (
                            <span className="special-badge" style={{ position: 'absolute', top: '8px', right: '8px' }}>
                              Special
                            </span>
                          )}
                        </div>

                        <div style={{ padding: '0.85rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h4 style={{ fontSize: '0.98rem', fontWeight: '700' }}>{item.name}</h4>

                            {editingPriceId === item.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: '800' }}>₹</span>
                                <input
                                  type="number"
                                  value={tempPrice}
                                  onChange={e => setTempPrice(e.target.value)}
                                  style={{
                                    width: '60px',
                                    padding: '0.2rem 0.35rem',
                                    borderRadius: '4px',
                                    border: '1.5px solid var(--primary)',
                                    fontSize: '0.88rem',
                                    fontWeight: '700',
                                    outline: 'none'
                                  }}
                                  autoFocus
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleQuickPriceSave(item.id);
                                    if (e.key === 'Escape') setEditingPriceId(null);
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleQuickPriceSave(item.id)}
                                  style={{
                                    background: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '0.25rem 0.45rem',
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingPriceId(null)}
                                  style={{
                                    background: '#e5e7eb',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '0.25rem 0.35rem',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => {
                                  setEditingPriceId(item.id);
                                  setTempPrice(String(item.price));
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  cursor: 'pointer',
                                  background: 'var(--primary-50)',
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: '6px',
                                  border: '1px solid var(--primary-200)',
                                  transition: 'background-color 0.15s ease'
                                }}
                                title="Click to adjust price"
                              >
                                <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '0.98rem' }}>₹{item.price}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--primary)', opacity: 0.8, textDecoration: 'underline' }}>Edit ₹</span>
                              </div>
                            )}
                          </div>

                          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                            {item.category_name}
                          </div>

                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem', flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {item.description}
                          </p>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '0.6rem' }}>
                            {/* Stock toggle */}
                            <button
                              onClick={() => handleToggleItemStock(item.id)}
                              style={{
                                background: item.is_available === 1 ? '#dcfce7' : '#fee2e2',
                                color: item.is_available === 1 ? '#15803d' : '#b91c1c',
                                border: 'none',
                                borderRadius: '999px',
                                padding: '0.25rem 0.6rem',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              {item.is_available === 1 ? 'In Stock' : 'Sold Out'}
                            </button>

                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                className="close-btn"
                                onClick={() => setEditingItem(item)}
                                title="Edit Item"
                                style={{ width: '28px', height: '28px' }}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                className="close-btn"
                                onClick={() => handleDeleteItem(item.id, item.name)}
                                title="Delete Item"
                                style={{ width: '28px', height: '28px', color: '#ef4444' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: REPORTS */}
              {activeTab === 'reports' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Sales & Order Metrics</h3>
                    <button className="nav-btn" onClick={loadReports}>
                      <RefreshCw size={14} />
                      <span>Refresh Reports</span>
                    </button>
                  </div>

                  {reportsLoading || !reports ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>Loading report metrics...</div>
                  ) : (
                    <div>
                      {/* Metric Stat Cards */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="stat-card">
                          <div className="stat-label">Today's Orders</div>
                          <div className="stat-val">{reports.today?.total_orders || 0}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '4px' }}>
                            Asia/Kolkata Business Day
                          </div>
                        </div>

                        <div className="stat-card">
                          <div className="stat-label">Today's Revenue</div>
                          <div className="stat-val" style={{ color: 'var(--primary)' }}>
                            ₹{(reports.today?.total_sales || 0).toFixed(2)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '4px' }}>
                            Total collected / expected
                          </div>
                        </div>

                        <div className="stat-card">
                          <div className="stat-label">All-Time Total Orders</div>
                          <div className="stat-val">{reports.allTime?.total_orders || 0}</div>
                        </div>

                        <div className="stat-card">
                          <div className="stat-label">All-Time Revenue</div>
                          <div className="stat-val" style={{ color: '#15803d' }}>
                            ₹{(reports.allTime?.total_sales || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Payment Method Breakdown & Top Dishes */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                        {/* Payment Breakdown */}
                        <div style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '0.75rem' }}>
                            Payment Method Split
                          </h4>
                          {reports.paymentBreakdown?.length === 0 ? (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No completed orders yet.</div>
                          ) : (
                            reports.paymentBreakdown?.map(pm => (
                              <div key={pm.payment_method} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px dashed var(--border-light)', fontSize: '0.88rem' }}>
                                <span>{pm.payment_method === 'UPI' ? '📱 UPI / QR Code' : '💵 Cash on Delivery'}</span>
                                <div>
                                  <strong>{pm.count} orders</strong> • ₹{pm.revenue.toFixed(2)}
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Top Selling Items */}
                        <div style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '0.75rem' }}>
                            Top Selling Tiffins & Dishes
                          </h4>
                          {reports.topItems?.length === 0 ? (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No sales recorded yet.</div>
                          ) : (
                            reports.topItems?.map((it, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px dashed var(--border-light)', fontSize: '0.85rem' }}>
                                <span><strong>#{idx + 1}</strong> {it.item_name}</span>
                                <div>
                                  <span style={{ fontWeight: '700' }}>{it.total_sold} ordered</span> (₹{it.total_revenue.toFixed(0)})
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: STORE SETTINGS */}
              {activeTab === 'settings' && (
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1rem' }}>
                    Store & Delivery Settings
                  </h3>

                  {settingsSuccess && (
                    <div style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                      <Check size={18} />
                      <span>{settingsSuccess}</span>
                    </div>
                  )}

                  {settingsLoading || !settingsForm ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>Loading settings...</div>
                  ) : (
                    <form onSubmit={handleSaveSettings} style={{ background: 'white', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '0.75rem', color: 'var(--primary)' }}>
                        General Business Information
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label">Business Name</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.business_name || ''}
                            onChange={e => setSettingsForm({ ...settingsForm, business_name: e.target.value })}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">WhatsApp Number (with country code e.g. 919876543210)</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.whatsapp_number || ''}
                            onChange={e => setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Calling Phone Number</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.phone_number || ''}
                            onChange={e => setSettingsForm({ ...settingsForm, phone_number: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Business Hours Text</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.business_hours_text || ''}
                            onChange={e => setSettingsForm({ ...settingsForm, business_hours_text: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Tagline</label>
                        <input
                          type="text"
                          className="form-input"
                          value={settingsForm.tagline || ''}
                          onChange={e => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Shop / Kitchen Address</label>
                        <textarea
                          className="form-textarea"
                          rows={2}
                          placeholder="e.g. Shop #4, Gandhi Road, Near Bus Stand, Opp. Temple..."
                          value={settingsForm.shop_address || ''}
                          onChange={e => setSettingsForm({ ...settingsForm, shop_address: e.target.value })}
                        />
                      </div>

                      {/* Orders Acceptance Toggle */}
                      <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '0.85rem', borderRadius: 'var(--radius-sm)', margin: '1rem 0' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={settingsForm.is_accepting_orders === 1}
                            onChange={e => setSettingsForm({ ...settingsForm, is_accepting_orders: e.target.checked ? 1 : 0 })}
                            style={{ width: '18px', height: '18px' }}
                          />
                          <div>
                            <strong style={{ fontSize: '0.9rem' }}>Accepting Customer Orders Online</strong>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              Uncheck this box if kitchen is overloaded or closed to temporarily stop new orders.
                            </div>
                          </div>
                        </label>
                      </div>

                      <h4 style={{ fontSize: '0.95rem', fontWeight: '800', margin: '1.25rem 0 0.75rem', color: 'var(--primary)' }}>
                        Delivery & Pricing Thresholds
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label">Currency Symbol</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.currency_symbol || '₹'}
                            onChange={e => setSettingsForm({ ...settingsForm, currency_symbol: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Timezone</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.timezone || 'Asia/Kolkata'}
                            onChange={e => setSettingsForm({ ...settingsForm, timezone: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Min. Order Amount (₹)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={settingsForm.min_order_amount}
                            onChange={e => setSettingsForm({ ...settingsForm, min_order_amount: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Default Delivery Fee (₹)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={settingsForm.default_delivery_fee}
                            onChange={e => setSettingsForm({ ...settingsForm, default_delivery_fee: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Free Delivery Above (₹)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={settingsForm.free_delivery_above}
                            onChange={e => setSettingsForm({ ...settingsForm, free_delivery_above: e.target.value })}
                          />
                        </div>
                      </div>

                      <h4 style={{ fontSize: '0.95rem', fontWeight: '800', margin: '1.25rem 0 0.75rem', color: 'var(--primary)' }}>
                        UPI Payment Details
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                        <div className="form-group">
                          <label className="form-label">UPI ID (VPA)</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.upi_id || ''}
                            onChange={e => setSettingsForm({ ...settingsForm, upi_id: e.target.value })}
                            placeholder="business@okhdfcbank"
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Payee Name</label>
                          <input
                            type="text"
                            className="form-input"
                            value={settingsForm.upi_name || ''}
                            onChange={e => setSettingsForm({ ...settingsForm, upi_name: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">UPI Instructions for Customer</label>
                        <textarea
                          className="form-textarea"
                          rows={2}
                          value={settingsForm.upi_instructions || ''}
                          onChange={e => setSettingsForm({ ...settingsForm, upi_instructions: e.target.value })}
                        />
                      </div>

                      <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                        <Save size={16} />
                        <span>Save All Settings</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 5: SECURITY / CHANGE PASSWORD */}
              {activeTab === 'security' && (
                <div style={{ maxWidth: '420px', margin: '1rem auto' }}>
                  <div style={{ background: 'white', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '0.25rem' }}>
                      Change Admin Password
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                      Secure your dashboard by choosing a strong password.
                    </p>

                    {passError && (
                      <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        {passError}
                      </div>
                    )}

                    {passMessage && (
                      <div style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        {passMessage}
                      </div>
                    )}

                    <form onSubmit={handlePasswordChange}>
                      <div className="form-group">
                        <label className="form-label">Current Password</label>
                        <input
                          type="password"
                          className="form-input"
                          required
                          value={currentPass}
                          onChange={e => setCurrentPass(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">New Password (min 6 characters)</label>
                        <input
                          type="password"
                          className="form-input"
                          required
                          value={newPass}
                          onChange={e => setNewPass(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Confirm New Password</label>
                        <input
                          type="password"
                          className="form-input"
                          required
                          value={confirmPass}
                          onChange={e => setConfirmPass(e.target.value)}
                        />
                      </div>

                      <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
                        Update Password
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
