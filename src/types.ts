export interface MiscItem {
  id: string;
  label: string;
  amount: number;
  date?: string;
  category?: 'repair' | 'maintenance' | 'deposit' | 'penalty' | 'water' | 'receipt' | 'other';
}

export interface Tenant {
  id: string;
  name: string;
  color: string;
  phone?: string;
  unit?: string;
  fixedRent: number;
  elecRate: number;
  openingRent: number;
  openingElec: number;
  openingMisc: number;
  initialReading?: number;
}

export interface RentEntry {
  month: string; // YYYY-MM
  rent: number;
  paid: number;
  paymentDate?: string;
  paymentMode?: string;
  note: string;
}

export interface ElecEntry {
  month: string; // YYYY-MM
  reading: number;
  amount: number;
  received: number;
  paymentDate?: string;
  note: string;
}

export interface MiscEntry {
  month: string; // YYYY-MM
  items: MiscItem[];
  received: number;
  paymentDate?: string;
  note: string;
}

export interface ComputedRentRow extends RentEntry {
  key: string;
  opening: number;
  balanceAfter: number;
  status: 'settled' | 'advance' | 'due' | 'overdue';
}

export interface ComputedElecRow extends ElecEntry {
  key: string;
  prevReading: number;
  units: number;
  opening: number;
  balanceAfter: number;
  status: 'settled' | 'advance' | 'due' | 'overdue';
}

export interface ComputedMiscRow extends MiscEntry {
  key: string;
  add: number;
  opening: number;
  balanceAfter: number;
  status: 'settled' | 'advance' | 'due' | 'overdue';
}

export interface AppState {
  tenants: Tenant[];
  entries: Record<string, RentEntry>;       // key: `${tenantId}:${month}`
  elecEntries: Record<string, ElecEntry>;   // key: `${tenantId}:${month}`
  miscEntries: Record<string, MiscEntry>;   // key: `${tenantId}:${month}`
}
