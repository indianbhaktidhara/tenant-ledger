import { AppState, ComputedElecRow, ComputedMiscRow, ComputedRentRow, Tenant } from '../types';
import {
  formatMonthLabel,
  getElecClosingBalance,
  getMiscClosingBalance,
  getRentClosingBalance,
  parseMonthKey
} from './ledgerCalculations';

function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(field: string | number | undefined | null): string {
  if (field === undefined || field === null) return '""';
  const str = String(field);
  return `"${str.replace(/"/g, '""')}"`;
}

// 1. Rent Ledger CSV
export function exportRentLedgerCSV(tenant: Tenant, rows: ComputedRentRow[]) {
  const headers = [
    'Month',
    'Opening Balance (₹)',
    'Rent Charged (₹)',
    'Paid / Received (₹)',
    'Closing Balance (₹)',
    'Status',
    'Payment Mode',
    'Notes'
  ];

  const lines = [
    `"Tenant Name: ${tenant.name}"`,
    `"Report: Monthly Rent Ledger"`,
    `"Default Fixed Rent: ₹${tenant.fixedRent || 0}"`,
    `"Initial Opening Rent Balance: ₹${tenant.openingRent || 0}"`,
    `"Generated On: ${new Date().toLocaleDateString('en-IN')}"`,
    '',
    headers.map(escapeCSV).join(',')
  ];

  rows.forEach((row) => {
    lines.push([
      escapeCSV(formatMonthLabel(row.month)),
      escapeCSV(row.opening),
      escapeCSV(row.rent),
      escapeCSV(row.paid),
      escapeCSV(row.balanceAfter),
      escapeCSV(row.status.toUpperCase()),
      escapeCSV(row.paymentMode || '-'),
      escapeCSV(row.note || '')
    ].join(','));
  });

  const filename = `${tenant.name.replace(/\s+/g, '_')}_Rent_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCSV(filename, lines.join('\r\n'));
}

// 2. Electricity Ledger CSV
export function exportElecLedgerCSV(tenant: Tenant, rows: ComputedElecRow[]) {
  const headers = [
    'Month',
    'Opening Last Reading',
    'Current Meter Reading',
    'Consumed Units',
    'Rate (₹/Unit)',
    'Amount (Units x Rate) (₹)',
    'Opening Bal (₹)',
    'Amount Recd (₹)',
    'Amount Bal (₹)',
    'Status',
    'Notes'
  ];

  const lines = [
    `"Tenant Name: ${tenant.name}"`,
    `"Report: Electricity Ledger"`,
    `"Electricity Unit Rate: ₹${tenant.elecRate || 7}/unit"`,
    `"Initial Baseline Reading: ${tenant.initialReading || 0} units"`,
    `"Initial Opening Elec Balance: ₹${tenant.openingElec || 0}"`,
    `"Generated On: ${new Date().toLocaleDateString('en-IN')}"`,
    '',
    headers.map(escapeCSV).join(',')
  ];

  rows.forEach((row) => {
    lines.push([
      escapeCSV(formatMonthLabel(row.month)),
      escapeCSV(row.prevReading),
      escapeCSV(row.reading),
      escapeCSV(row.units),
      escapeCSV(tenant.elecRate || 7),
      escapeCSV(row.amount),
      escapeCSV(row.opening),
      escapeCSV(row.received),
      escapeCSV(row.balanceAfter),
      escapeCSV(row.status.toUpperCase()),
      escapeCSV(row.note || '')
    ].join(','));
  });

  const filename = `${tenant.name.replace(/\s+/g, '_')}_Electricity_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCSV(filename, lines.join('\r\n'));
}

// 3. Miscellaneous Expenses Ledger CSV
export function exportMiscLedgerCSV(tenant: Tenant, rows: ComputedMiscRow[]) {
  const headers = [
    'Month',
    'Opening Balance (₹)',
    'Expense / Receipt Items',
    'Total Amount Added (₹)',
    'Paid / Received (₹)',
    'Closing Balance (₹)',
    'Status',
    'Notes'
  ];

  const lines = [
    `"Tenant Name: ${tenant.name}"`,
    `"Report: Miscellaneous & Expenses Ledger"`,
    `"Initial Opening Misc Balance: ₹${tenant.openingMisc || 0}"`,
    `"Generated On: ${new Date().toLocaleDateString('en-IN')}"`,
    '',
    headers.map(escapeCSV).join(',')
  ];

  rows.forEach((row) => {
    const itemDetails = (row.items || [])
      .map((it) => `${it.label}: ₹${it.amount}`)
      .join('; ');

    lines.push([
      escapeCSV(formatMonthLabel(row.month)),
      escapeCSV(row.opening),
      escapeCSV(itemDetails || 'None'),
      escapeCSV(row.add),
      escapeCSV(row.received),
      escapeCSV(row.balanceAfter),
      escapeCSV(row.status.toUpperCase()),
      escapeCSV(row.note || '')
    ].join(','));
  });

  const filename = `${tenant.name.replace(/\s+/g, '_')}_Misc_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCSV(filename, lines.join('\r\n'));
}

// 4. Consolidated Tenant Statement (Rent + Elec + Misc)
export function exportTenantConsolidatedCSV(
  tenant: Tenant,
  rentRows: ComputedRentRow[],
  elecRows: ComputedElecRow[],
  miscRows: ComputedMiscRow[]
) {
  // Collect all months
  const monthsSet = new Set<string>();
  rentRows.forEach((r) => monthsSet.add(r.month));
  elecRows.forEach((r) => monthsSet.add(r.month));
  miscRows.forEach((r) => monthsSet.add(r.month));
  const months = Array.from(monthsSet).sort();

  const headers = [
    'Month',
    'Rent Due (₹)',
    'Rent Paid (₹)',
    'Rent Balance (₹)',
    'Elec Units',
    'Elec Due (₹)',
    'Elec Paid (₹)',
    'Elec Balance (₹)',
    'Misc Items',
    'Misc Due (₹)',
    'Misc Paid (₹)',
    'Misc Balance (₹)',
    'Total Month Due (₹)',
    'Total Month Paid (₹)',
    'Combined Net Balance (₹)'
  ];

  const lines = [
    `"Tenant: ${tenant.name}"`,
    `"Phone: ${tenant.phone || 'N/A'}"`,
    `"Unit / Room: ${tenant.unit || 'N/A'}"`,
    `"Report: Consolidated Multi-Ledger Statement"`,
    `"Generated On: ${new Date().toLocaleDateString('en-IN')}"`,
    '',
    headers.map(escapeCSV).join(',')
  ];

  months.forEach((m) => {
    const r = rentRows.find((x) => x.month === m);
    const e = elecRows.find((x) => x.month === m);
    const ms = miscRows.find((x) => x.month === m);

    const rDue = r ? r.rent : 0;
    const rPaid = r ? r.paid : 0;
    const rBal = r ? r.balanceAfter : 0;

    const eUnits = e ? e.units : 0;
    const eDue = e ? e.amount : 0;
    const ePaid = e ? e.received : 0;
    const eBal = e ? e.balanceAfter : 0;

    const msItems = ms ? ms.items.map((it) => `${it.label} (₹${it.amount})`).join('; ') : '';
    const msDue = ms ? ms.add : 0;
    const msPaid = ms ? ms.received : 0;
    const msBal = ms ? ms.balanceAfter : 0;

    const totDue = rDue + eDue + msDue;
    const totPaid = rPaid + ePaid + msPaid;
    const netBal = rBal + eBal + msBal;

    lines.push([
      escapeCSV(formatMonthLabel(m)),
      escapeCSV(rDue),
      escapeCSV(rPaid),
      escapeCSV(rBal),
      escapeCSV(eUnits),
      escapeCSV(eDue),
      escapeCSV(ePaid),
      escapeCSV(eBal),
      escapeCSV(msItems || '-'),
      escapeCSV(msDue),
      escapeCSV(msPaid),
      escapeCSV(msBal),
      escapeCSV(totDue),
      escapeCSV(totPaid),
      escapeCSV(netBal)
    ].join(','));
  });

  const filename = `${tenant.name.replace(/\s+/g, '_')}_Consolidated_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCSV(filename, lines.join('\r\n'));
}

// 5. All Tenants Closing Ledger Summary
export function exportAllTenantsClosingCSV(state: AppState) {
  const headers = [
    'Tenant Name',
    'Phone',
    'Unit/Room',
    'Fixed Rent (₹)',
    'Elec Rate (₹/unit)',
    'Opening Rent (₹)',
    'Rent Balance (₹)',
    'Opening Elec (₹)',
    'Elec Balance (₹)',
    'Opening Misc (₹)',
    'Misc Balance (₹)',
    'Total Net Outstanding (₹)',
    'Status'
  ];

  const lines = [
    `"Tenant Ledger System - All Tenants Closing Balance Report"`,
    `"Total Tenants: ${state.tenants.length}"`,
    `"Generated On: ${new Date().toLocaleDateString('en-IN')}"`,
    '',
    headers.map(escapeCSV).join(',')
  ];

  let totalRentBal = 0;
  let totalElecBal = 0;
  let totalMiscBal = 0;
  let grandTotal = 0;

  state.tenants.forEach((t) => {
    const rb = getRentClosingBalance(state, t.id);
    const eb = getElecClosingBalance(state, t.id);
    const mb = getMiscClosingBalance(state, t.id);
    const net = rb + eb + mb;

    totalRentBal += rb;
    totalElecBal += eb;
    totalMiscBal += mb;
    grandTotal += net;

    const status = net > 0 ? 'DUE' : net < 0 ? 'ADVANCE' : 'SETTLED';

    lines.push([
      escapeCSV(t.name),
      escapeCSV(t.phone || '-'),
      escapeCSV(t.unit || '-'),
      escapeCSV(t.fixedRent || 0),
      escapeCSV(t.elecRate || 0),
      escapeCSV(t.openingRent || 0),
      escapeCSV(rb),
      escapeCSV(t.openingElec || 0),
      escapeCSV(eb),
      escapeCSV(t.openingMisc || 0),
      escapeCSV(mb),
      escapeCSV(net),
      escapeCSV(status)
    ].join(','));
  });

  lines.push('');
  lines.push([
    escapeCSV('TOTALS'),
    '""',
    '""',
    '""',
    '""',
    '""',
    escapeCSV(totalRentBal),
    '""',
    escapeCSV(totalElecBal),
    '""',
    escapeCSV(totalMiscBal),
    escapeCSV(grandTotal),
    escapeCSV(grandTotal > 0 ? 'NET DUE' : grandTotal < 0 ? 'NET ADVANCE' : 'ALL SETTLED')
  ].join(','));

  const filename = `All_Tenants_Closing_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCSV(filename, lines.join('\r\n'));
}

// 6. Monthly Collection Report (All Tenants for chosen month)
export function exportMonthlyReportCSV(state: AppState, targetMonth: string) {
  const headers = [
    'Tenant Name',
    'Rent Charged (₹)',
    'Rent Paid (₹)',
    'Elec Charged (₹)',
    'Elec Paid (₹)',
    'Misc Charged (₹)',
    'Misc Paid (₹)',
    'Total Due This Month (₹)',
    'Total Collected This Month (₹)',
    'Net Difference (₹)'
  ];

  const lines = [
    `"Tenant Ledger - Monthly Collections Report"`,
    `"Month: ${formatMonthLabel(targetMonth)}"`,
    `"Generated On: ${new Date().toLocaleDateString('en-IN')}"`,
    '',
    headers.map(escapeCSV).join(',')
  ];

  let totRentDue = 0;
  let totRentPaid = 0;
  let totElecDue = 0;
  let totElecPaid = 0;
  let totMiscDue = 0;
  let totMiscPaid = 0;
  let grandDue = 0;
  let grandPaid = 0;

  state.tenants.forEach((t) => {
    const re = state.entries[`${t.id}:${targetMonth}`];
    const ee = state.elecEntries[`${t.id}:${targetMonth}`];
    const me = state.miscEntries[`${t.id}:${targetMonth}`];

    const rDue = re ? Number(re.rent) || 0 : 0;
    const rPaid = re ? Number(re.paid) || 0 : 0;
    const eDue = ee ? Number(ee.amount) || 0 : 0;
    const ePaid = ee ? Number(ee.received) || 0 : 0;
    const mDue = me ? me.items.reduce((s, it) => s + (Number(it.amount) || 0), 0) : 0;
    const mPaid = me ? Number(me.received) || 0 : 0;

    const rowDue = rDue + eDue + mDue;
    const rowPaid = rPaid + ePaid + mPaid;
    const rowDiff = rowDue - rowPaid;

    totRentDue += rDue;
    totRentPaid += rPaid;
    totElecDue += eDue;
    totElecPaid += ePaid;
    totMiscDue += mDue;
    totMiscPaid += mPaid;
    grandDue += rowDue;
    grandPaid += rowPaid;

    lines.push([
      escapeCSV(t.name),
      escapeCSV(rDue),
      escapeCSV(rPaid),
      escapeCSV(eDue),
      escapeCSV(ePaid),
      escapeCSV(mDue),
      escapeCSV(mPaid),
      escapeCSV(rowDue),
      escapeCSV(rowPaid),
      escapeCSV(rowDiff)
    ].join(','));
  });

  lines.push('');
  lines.push([
    escapeCSV('TOTALS'),
    escapeCSV(totRentDue),
    escapeCSV(totRentPaid),
    escapeCSV(totElecDue),
    escapeCSV(totElecPaid),
    escapeCSV(totMiscDue),
    escapeCSV(totMiscPaid),
    escapeCSV(grandDue),
    escapeCSV(grandPaid),
    escapeCSV(grandDue - grandPaid)
  ].join(','));

  const filename = `Monthly_Report_${targetMonth}_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCSV(filename, lines.join('\r\n'));
}
