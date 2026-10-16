// Client API service for Tiffin ordering app

const API_BASE = '/api';

export async function fetchSettings() {
  const res = await fetch(`${API_BASE}/settings`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch settings');
  return data.settings;
}

export async function fetchMenu() {
  const res = await fetch(`${API_BASE}/menu`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch menu');
  return data;
}

export async function submitOrder(orderData) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to place order');
  return data;
}

export async function fetchOrderDetails(orderNumber) {
  const res = await fetch(`${API_BASE}/orders/${orderNumber}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Order not found');
  return data;
}

// Admin API
export async function adminLogin(password) {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Authentication failed');
  return data;
}

export async function adminVerifyToken(token) {
  const res = await fetch(`${API_BASE}/admin/verify`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.success;
}

export async function adminChangePassword(token, currentPassword, newPassword) {
  const res = await fetch(`${API_BASE}/admin/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update password');
  return data;
}

export async function adminFetchOrders(token, filters = {}) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${API_BASE}/admin/orders?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch orders');
  return data.orders;
}

export async function adminUpdateOrderStatus(token, orderId, status) {
  const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update status');
  return data;
}

export async function adminFetchReports(token) {
  const res = await fetch(`${API_BASE}/admin/reports`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch reports');
  return data;
}

export async function adminCreateMenuItem(token, itemData) {
  const res = await fetch(`${API_BASE}/admin/menu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(itemData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create menu item');
  return data.item;
}

export async function adminUpdateMenuItem(token, itemId, itemData) {
  const res = await fetch(`${API_BASE}/admin/menu/${itemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(itemData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update menu item');
  return data.item;
}

export async function adminUpdateItemPrice(token, itemId, price) {
  const res = await fetch(`${API_BASE}/admin/menu/${itemId}/price`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ price })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update price');
  return data;
}

export async function adminToggleStoreStatus(token) {
  const res = await fetch(`${API_BASE}/admin/toggle-store`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to toggle store status');
  return data;
}

export async function adminToggleItemAvailability(token, itemId) {
  const res = await fetch(`${API_BASE}/admin/menu/${itemId}/toggle`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to toggle availability');
  return data;
}

export async function adminDeleteMenuItem(token, itemId) {
  const res = await fetch(`${API_BASE}/admin/menu/${itemId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete menu item');
  return data;
}

export async function adminFetchSettings(token) {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch settings');
  return data.settings;
}

export async function adminUpdateSettings(token, settingsData) {
  const res = await fetch(`${API_BASE}/admin/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(settingsData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update settings');
  return data;
}

export async function adminUploadImage(token, file) {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_BASE}/admin/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
}
