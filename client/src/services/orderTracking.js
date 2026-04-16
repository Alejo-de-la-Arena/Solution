/**
 * Persistencia en localStorage para que un usuario sin login pueda "seguir su pedido".
 * Guardamos como máximo MAX_ORDERS, orden por createdAt desc.
 */

const STORAGE_KEY = 'solution_tracked_orders';
const MAX_ORDERS = 5;

function readAll() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAll(arr) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    window.dispatchEvent(new CustomEvent('solution:trackedOrdersChanged'));
  } catch {
    /* ignore quota / unavailable */
  }
}

function sortDesc(arr) {
  return [...arr].sort((a, b) => {
    const ta = Date.parse(a.createdAt || 0) || 0;
    const tb = Date.parse(b.createdAt || 0) || 0;
    return tb - ta;
  });
}

/**
 * @param {{ orderId: string, paymentMethod?: string, total?: number, customerEmail?: string, createdAt?: string, status?: string }} info
 */
export function saveTrackedOrder(info) {
  const orderId = (info?.orderId || '').trim();
  if (!orderId) return;
  const now = new Date().toISOString();
  const entry = {
    orderId,
    paymentMethod: info.paymentMethod || null,
    total: typeof info.total === 'number' ? info.total : null,
    customerEmail: info.customerEmail || null,
    createdAt: info.createdAt || now,
    updatedAt: now,
    status: info.status || 'pending_payment',
  };

  const current = readAll().filter((o) => o.orderId !== orderId);
  current.unshift(entry);
  const trimmed = sortDesc(current).slice(0, MAX_ORDERS);
  writeAll(trimmed);
}

export function getTrackedOrders() {
  return sortDesc(readAll());
}

export function getLatestTrackedOrder() {
  return getTrackedOrders()[0] || null;
}

export function getTrackedOrder(orderId) {
  if (!orderId) return null;
  return readAll().find((o) => o.orderId === orderId) || null;
}

export function updateTrackedOrderStatus(orderId, status) {
  if (!orderId || !status) return;
  const current = readAll();
  const idx = current.findIndex((o) => o.orderId === orderId);
  if (idx === -1) return;
  if (current[idx].status === status) return;
  current[idx] = {
    ...current[idx],
    status,
    updatedAt: new Date().toISOString(),
  };
  writeAll(current);
}

export function removeTrackedOrder(orderId) {
  if (!orderId) return;
  const next = readAll().filter((o) => o.orderId !== orderId);
  writeAll(next);
}

export const TRACKED_ORDERS_STORAGE_KEY = STORAGE_KEY;
