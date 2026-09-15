import { AppState, Tenant } from '../types';
import { monthKey, TENANT_COLORS } from './ledgerCalculations';

const STORAGE_KEY = 'tenant_ledger_state_v2';

export function createInitialState(): AppState {
  const initialTenants: Tenant[] = [
    {
      id: 't_narmadeshwar',
      name: 'Narmadeshwar Mishra',
      color: TENANT_COLORS[2],
      phone: '+91 98765 43212',
      unit: 'Flat 201',
      fixedRent: 4000,
      elecRate: 7,
      openingRent: 0,
      openingElec: 0,
      openingMisc: 0,
      initialReading: 0
    },
    {
      id: 't_vedprakash',
      name: 'Vedprakash',
      color: TENANT_COLORS[0],
      phone: '+91 98765 43210',
      unit: 'Flat 101',
      fixedRent: 3300,
      elecRate: 7,
      openingRent: 0,
      openingElec: 0,
      openingMisc: 0,
      initialReading: 0
    },
    {
      id: 't_beena',
      name: 'Beena',
      color: TENANT_COLORS[1],
      phone: '+91 98765 43211',
      unit: 'Flat 102',
      fixedRent: 3300,
      elecRate: 7,
      openingRent: 0,
      openingElec: 0,
      openingMisc: 0,
      initialReading: 0
    },
    {
      id: 't_anita',
      name: 'Anita',
      color: TENANT_COLORS[4],
      phone: '+91 98765 43214',
      unit: 'Flat 301',
      fixedRent: 2000,
      elecRate: 7,
      openingRent: 0,
      openingElec: 0,
      openingMisc: 0,
      initialReading: 0
    },
    {
      id: 't_neeraj',
      name: 'Neeraj',
      color: TENANT_COLORS[3],
      phone: '+91 98765 43213',
      unit: 'Flat 202',
      fixedRent: 6000,
      elecRate: 7,
      openingRent: 0,
      openingElec: 0,
      openingMisc: 0,
      initialReading: 0
    }
  ];

  return {
    tenants: initialTenants,
    entries: {},
    elecEntries: {},
    miscEntries: {}
  };
}

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = createInitialState();
      saveAppState(init);
      return init;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.tenants || !Array.isArray(parsed.tenants)) {
      const init = createInitialState();
      saveAppState(init);
      return init;
    }
    // Normalize properties and auto-migrate Banita -> Anita
    let needsSave = false;
    parsed.tenants.forEach((t: Tenant) => {
      if (t.name === 'Banita') {
        t.name = 'Anita';
        needsSave = true;
      }
      if (t.id === 't_banita') {
        t.id = 't_anita';
        needsSave = true;
        if (parsed.entries) {
          Object.keys(parsed.entries).forEach((key) => {
            if (key.startsWith('t_banita:')) {
              const newKey = key.replace('t_banita:', 't_anita:');
              parsed.entries[newKey] = parsed.entries[key];
              delete parsed.entries[key];
            }
          });
        }
        if (parsed.elecEntries) {
          Object.keys(parsed.elecEntries).forEach((key) => {
            if (key.startsWith('t_banita:')) {
              const newKey = key.replace('t_banita:', 't_anita:');
              parsed.elecEntries[newKey] = parsed.elecEntries[key];
              delete parsed.elecEntries[key];
            }
          });
        }
        if (parsed.miscEntries) {
          Object.keys(parsed.miscEntries).forEach((key) => {
            if (key.startsWith('t_banita:')) {
              const newKey = key.replace('t_banita:', 't_anita:');
              parsed.miscEntries[newKey] = parsed.miscEntries[key];
              delete parsed.miscEntries[key];
            }
          });
        }
      }
      t.fixedRent = Number(t.fixedRent) || 0;
      t.elecRate = Number(t.elecRate) || 0;
      t.openingRent = Number(t.openingRent) || 0;
      t.openingElec = Number(t.openingElec) || 0;
      t.openingMisc = Number(t.openingMisc) || 0;
      t.initialReading = Number(t.initialReading) || 0;
    });
    if (!parsed.entries) parsed.entries = {};
    if (!parsed.elecEntries) parsed.elecEntries = {};
    if (!parsed.miscEntries) parsed.miscEntries = {};
    if (needsSave) {
      saveAppState(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('Error loading state from localStorage:', err);
    return createInitialState();
  }
}

export function saveAppState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving state to localStorage:', err);
  }
}
