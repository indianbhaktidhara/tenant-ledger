import { AppState, ComputedElecRow, ComputedMiscRow, ComputedRentRow, Tenant } from '../types';

export const TENANT_COLORS = [
  '#A9752B', // Brass
  '#2E5F55', // Deep Teal
  '#6B4F8C', // Plum
  '#3D6EA1', // Volt Blue
  '#A13D2E', // Rust Red
  '#5C7A3A', // Forest Olive
  '#D97706', // Amber
  '#0D9488'  // Turquoise
];

export function monthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function parseMonthKey(key: string): Date {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, (month || 1) - 1, 1);
}

export function formatMonthLabel(key: string): string {
  const d = parseMonthKey(key);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function formatShortMonthLabel(key: string): string {
  const d = parseMonthKey(key);
  return d.toLocaleDateString('en-IN', { month: 'short' });
}

export function formatCurrency(amount: number): string {
  const rounded = Math.round(((amount || 0) + Number.EPSILON) * 100) / 100;
  return '₹' + rounded.toLocaleString('en-IN');
}

export function formatNumber(n: number): string {
  return (n || 0).toLocaleString('en-IN');
}

export function getStatus(balanceAfter: number, isOverdueCandidate: boolean): 'settled' | 'advance' | 'due' | 'overdue' {
  if (balanceAfter <= 0) {
    return balanceAfter < 0 ? 'advance' : 'settled';
  }
  return isOverdueCandidate ? 'overdue' : 'due';
}

export function computeRentLedger(state: AppState, tenantId: string): ComputedRentRow[] {
  const tenant = state.tenants.find((t) => t.id === tenantId);
  const openingSeed = tenant ? tenant.openingRent : 0;
  const currentMk = monthKey(new Date());

  const entries = Object.keys(state.entries)
    .filter((k) => k.startsWith(`${tenantId}:`))
    .map((k) => {
      const e = state.entries[k];
      return {
        key: k,
        month: k.split(':')[1],
        rent: Number(e.rent) || 0,
        paid: Number(e.paid) || 0,
        paymentDate: e.paymentDate,
        paymentMode: e.paymentMode,
        note: e.note || ''
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  let running = openingSeed;
  return entries.map((entry, index) => {
    const opening = running;
    running = opening + entry.rent - entry.paid;
    const isOverdue = index === entries.length - 1 && entry.month < currentMk && running > 0;
    return {
      ...entry,
      opening,
      balanceAfter: running,
      status: getStatus(running, isOverdue)
    };
  });
}

export function computeElecLedger(state: AppState, tenantId: string): ComputedElecRow[] {
  const tenant = state.tenants.find((t) => t.id === tenantId);
  const openingSeed = tenant ? tenant.openingElec : 0;
  let prevReading = tenant?.initialReading ?? 0;
  const currentMk = monthKey(new Date());

  const entries = Object.keys(state.elecEntries)
    .filter((k) => k.startsWith(`${tenantId}:`))
    .map((k) => {
      const e = state.elecEntries[k];
      return {
        key: k,
        month: k.split(':')[1],
        reading: Number(e.reading) || 0,
        amount: Number(e.amount) || 0,
        received: Number(e.received) || 0,
        paymentDate: e.paymentDate,
        note: e.note || ''
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  let running = openingSeed;
  return entries.map((entry, index) => {
    const units = Math.max(0, entry.reading - prevReading);
    const rate = tenant?.elecRate ?? 7;
    const calculatedAmount = entry.amount !== 0 ? entry.amount : Math.round(units * rate);
    const opening = running;
    running = opening + calculatedAmount - entry.received;
    const isOverdue = index === entries.length - 1 && entry.month < currentMk && running > 0;
    const result: ComputedElecRow = {
      ...entry,
      amount: calculatedAmount,
      prevReading,
      units,
      opening,
      balanceAfter: running,
      status: getStatus(running, isOverdue)
    };
    prevReading = entry.reading;
    return result;
  });
}

export function computeMiscLedger(state: AppState, tenantId: string): ComputedMiscRow[] {
  const tenant = state.tenants.find((t) => t.id === tenantId);
  const openingSeed = tenant ? tenant.openingMisc : 0;
  const currentMk = monthKey(new Date());

  const entries = Object.keys(state.miscEntries)
    .filter((k) => k.startsWith(`${tenantId}:`))
    .map((k) => {
      const e = state.miscEntries[k];
      return {
        key: k,
        month: k.split(':')[1],
        items: Array.isArray(e.items) ? e.items : [],
        received: Number(e.received) || 0,
        paymentDate: e.paymentDate,
        note: e.note || ''
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  let running = openingSeed;
  return entries.map((entry, index) => {
    const add = entry.items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
    const opening = running;
    running = opening + add - entry.received;
    const isOverdue = index === entries.length - 1 && entry.month < currentMk && running > 0;
    return {
      ...entry,
      add,
      opening,
      balanceAfter: running,
      status: getStatus(running, isOverdue)
    };
  });
}

export function getRentClosingBalance(state: AppState, tenantId: string): number {
  const list = computeRentLedger(state, tenantId);
  if (list.length > 0) return list[list.length - 1].balanceAfter;
  const t = state.tenants.find((item) => item.id === tenantId);
  return t ? t.openingRent : 0;
}

export function getElecClosingBalance(state: AppState, tenantId: string): number {
  const list = computeElecLedger(state, tenantId);
  if (list.length > 0) return list[list.length - 1].balanceAfter;
  const t = state.tenants.find((item) => item.id === tenantId);
  return t ? t.openingElec : 0;
}

export function getMiscClosingBalance(state: AppState, tenantId: string): number {
  const list = computeMiscLedger(state, tenantId);
  if (list.length > 0) return list[list.length - 1].balanceAfter;
  const t = state.tenants.find((item) => item.id === tenantId);
  return t ? t.openingMisc : 0;
}

export function getLastElecReading(state: AppState, tenantId: string): number {
  const list = computeElecLedger(state, tenantId);
  if (list.length > 0) return list[list.length - 1].reading;
  const t = state.tenants.find((item) => item.id === tenantId);
  return t?.initialReading || 0;
}

export function computeMonthSummary(state: AppState, targetMonth: string) {
  let due = 0;
  let collected = 0;

  state.tenants.forEach((t) => {
    // Rent
    const re = state.entries[`${t.id}:${targetMonth}`];
    if (re) {
      due += Number(re.rent) || 0;
      collected += Number(re.paid) || 0;
    }
    // Electricity
    const ee = state.elecEntries[`${t.id}:${targetMonth}`];
    if (ee) {
      due += Number(ee.amount) || 0;
      collected += Number(ee.received) || 0;
    }
    // Misc
    const me = state.miscEntries[`${t.id}:${targetMonth}`];
    if (me && Array.isArray(me.items)) {
      due += me.items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
      collected += Number(me.received) || 0;
    }
  });

  return {
    due,
    collected,
    outstanding: due - collected
  };
}
