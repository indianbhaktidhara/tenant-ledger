import { AppState, Tenant } from '../types';
import { monthKey, TENANT_COLORS } from './ledgerCalculations';

const STORAGE_KEY = 'tenant_ledger_state_v1';

export function createInitialState(): AppState {
  const initialTenants: Tenant[] = [
    {
      id: 't_vedprakash',
      name: 'Vedprakash',
      color: TENANT_COLORS[0],
      phone: '+91 98765 43210',
      unit: 'Flat 101',
      fixedRent: 8500,
      elecRate: 9,
      openingRent: 0,
      openingElec: 0,
      openingMisc: 0,
      initialReading: 1240
    },
    {
      id: 't_beena',
      name: 'Beena',
      color: TENANT_COLORS[1],
      phone: '+91 98765 43211',
      unit: 'Flat 102',
      fixedRent: 7500,
      elecRate: 9,
      openingRent: 500, // sample previous pending rent
      openingElec: 120,
      openingMisc: 0,
      initialReading: 980
    },
    {
      id: 't_narmadeshwar',
      name: 'Narmadeshwar',
      color: TENANT_COLORS[2],
      phone: '+91 98765 43212',
      unit: 'Flat 201',
      fixedRent: 11000,
      elecRate: 9,
      openingRent: 0,
      openingElec: 0,
      openingMisc: 0,
      initialReading: 2150
    },
    {
      id: 't_neeraj',
      name: 'Neeraj',
      color: TENANT_COLORS[3],
      phone: '+91 98765 43213',
      unit: 'Flat 202',
      fixedRent: 9000,
      elecRate: 9,
      openingRent: -1000, // sample advance
      openingElec: 0,
      openingMisc: 0,
      initialReading: 1530
    },
    {
      id: 't_anita',
      name: 'Anita',
      color: TENANT_COLORS[4],
      phone: '+91 98765 43214',
      unit: 'Flat 301',
      fixedRent: 8000,
      elecRate: 9,
      openingRent: 0,
      openingElec: 0,
      openingMisc: 0,
      initialReading: 890
    }
  ];

  const now = new Date();
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const currentMk = monthKey(now);
  const prevMk = monthKey(prevDate);

  const entries: AppState['entries'] = {
    // Previous month sample
    [`t_vedprakash:${prevMk}`]: {
      month: prevMk,
      rent: 8500,
      paid: 8500,
      paymentDate: `${prevMk}-05`,
      paymentMode: 'UPI',
      note: 'Paid on time'
    },
    [`t_beena:${prevMk}`]: {
      month: prevMk,
      rent: 7500,
      paid: 7000,
      paymentDate: `${prevMk}-07`,
      paymentMode: 'Cash',
      note: 'Part payment ₹7,000'
    },
    // Current month sample
    [`t_vedprakash:${currentMk}`]: {
      month: currentMk,
      rent: 8500,
      paid: 8500,
      paymentDate: `${currentMk}-04`,
      paymentMode: 'UPI',
      note: 'GPay receipt #9821'
    },
    [`t_beena:${currentMk}`]: {
      month: currentMk,
      rent: 7500,
      paid: 0,
      note: 'Reminder sent on 5th'
    },
    [`t_narmadeshwar:${currentMk}`]: {
      month: currentMk,
      rent: 11000,
      paid: 11000,
      paymentDate: `${currentMk}-03`,
      paymentMode: 'Bank Transfer',
      note: 'NEFT credit'
    },
    [`t_neeraj:${currentMk}`]: {
      month: currentMk,
      rent: 9000,
      paid: 8000,
      paymentDate: `${currentMk}-05`,
      paymentMode: 'UPI',
      note: 'Adjusted with ₹1000 advance'
    },
    [`t_anita:${currentMk}`]: {
      month: currentMk,
      rent: 8000,
      paid: 8000,
      paymentDate: `${currentMk}-02`,
      paymentMode: 'UPI',
      note: 'Full settlement'
    }
  };

  const elecEntries: AppState['elecEntries'] = {
    [`t_vedprakash:${prevMk}`]: {
      month: prevMk,
      reading: 1330,
      amount: 810, // (1330 - 1240) = 90 units * 9
      received: 810,
      note: 'Paid with rent'
    },
    [`t_vedprakash:${currentMk}`]: {
      month: currentMk,
      reading: 1425,
      amount: 855, // (1425 - 1330) = 95 units * 9
      received: 855,
      note: 'September meter reading'
    },
    [`t_beena:${currentMk}`]: {
      month: currentMk,
      reading: 1060,
      amount: 720, // (1060 - 980) = 80 units * 9
      received: 0,
      note: 'Due with rent'
    },
    [`t_narmadeshwar:${currentMk}`]: {
      month: currentMk,
      reading: 2265,
      amount: 1035, // 115 units * 9
      received: 1035,
      note: 'Cleared via UPI'
    }
  };

  const miscEntries: AppState['miscEntries'] = {
    [`t_vedprakash:${currentMk}`]: {
      month: currentMk,
      items: [
        { id: 'm1', label: 'Bathroom Tap Repair', amount: 350, category: 'repair' }
      ],
      received: 350,
      note: 'Plumber bill reimbursed'
    },
    [`t_narmadeshwar:${currentMk}`]: {
      month: currentMk,
      items: [
        { id: 'm2', label: 'Building Maintenance & Garbage', amount: 500, category: 'maintenance' }
      ],
      received: 500,
      note: 'Monthly society charge'
    }
  };

  return {
    tenants: initialTenants,
    entries,
    elecEntries,
    miscEntries
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
