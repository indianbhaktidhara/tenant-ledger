import React, { useState } from 'react';
import { AppState, Tenant } from '../types';
import {
  computeElecLedger,
  computeMiscLedger,
  computeRentLedger,
  formatCurrency,
  formatShortMonthLabel
} from '../utils/ledgerCalculations';
import {
  exportElecLedgerCSV,
  exportMiscLedgerCSV,
  exportRentLedgerCSV,
  exportTenantConsolidatedCSV
} from '../utils/csvExport';
import { ChevronLeft, ChevronRight, Download, Table2 } from 'lucide-react';

interface Props {
  state: AppState;
  tenant: Tenant;
}

export const YearlyTab: React.FC<Props> = ({ state, tenant }) => {
  const [activeSubLedger, setActiveSubLedger] = useState<'rent' | 'elec' | 'misc' | 'all'>('rent');
  const [activeYear, setActiveYear] = useState<number>(() => new Date().getFullYear());

  const rentRows = computeRentLedger(state, tenant.id);
  const elecRows = computeElecLedger(state, tenant.id);
  const miscRows = computeMiscLedger(state, tenant.id);

  // Map rows depending on selected subLedger
  let rows: {
    month: string;
    opening: number;
    add: number;
    less: number;
    balanceAfter: number;
  }[] = [];

  if (activeSubLedger === 'rent') {
    rows = rentRows.map((r) => ({
      month: r.month,
      opening: r.opening,
      add: r.rent,
      less: r.paid,
      balanceAfter: r.balanceAfter
    }));
  } else if (activeSubLedger === 'elec') {
    rows = elecRows.map((e) => ({
      month: e.month,
      opening: e.opening,
      add: e.amount,
      less: e.received,
      balanceAfter: e.balanceAfter
    }));
  } else if (activeSubLedger === 'misc') {
    rows = miscRows.map((m) => ({
      month: m.month,
      opening: m.opening,
      add: m.add,
      less: m.received,
      balanceAfter: m.balanceAfter
    }));
  } else {
    // Consolidated
    const allMonths = Array.from(
      new Set([...rentRows.map((r) => r.month), ...elecRows.map((e) => e.month), ...miscRows.map((m) => m.month)])
    ).sort();

    rows = allMonths.map((m) => {
      const r = rentRows.find((x) => x.month === m);
      const e = elecRows.find((x) => x.month === m);
      const ms = miscRows.find((x) => x.month === m);

      const op = (r ? r.opening : 0) + (e ? e.opening : 0) + (ms ? ms.opening : 0);
      const add = (r ? r.rent : 0) + (e ? e.amount : 0) + (ms ? ms.add : 0);
      const less = (r ? r.paid : 0) + (e ? e.received : 0) + (ms ? ms.received : 0);
      const bal = (r ? r.balanceAfter : 0) + (e ? e.balanceAfter : 0) + (ms ? ms.balanceAfter : 0);

      return {
        month: m,
        opening: op,
        add,
        less,
        balanceAfter: bal
      };
    });
  }

  const yearRows = rows.filter((r) => r.month.startsWith(String(activeYear)));
  const priorRows = rows.filter((r) => r.month < `${activeYear}-01`);

  const openingForYear = yearRows.length
    ? yearRows[0].opening
    : priorRows.length
    ? priorRows[priorRows.length - 1].balanceAfter
    : activeSubLedger === 'rent'
    ? tenant.openingRent
    : activeSubLedger === 'elec'
    ? tenant.openingElec
    : activeSubLedger === 'misc'
    ? tenant.openingMisc
    : tenant.openingRent + tenant.openingElec + tenant.openingMisc;

  const closingForYear = yearRows.length
    ? yearRows[yearRows.length - 1].balanceAfter
    : openingForYear;

  const totalAdd = yearRows.reduce((s, r) => s + r.add, 0);
  const totalLess = yearRows.reduce((s, r) => s + r.less, 0);

  const handleExport = () => {
    if (activeSubLedger === 'rent') exportRentLedgerCSV(tenant, rentRows);
    else if (activeSubLedger === 'elec') exportElecLedgerCSV(tenant, elecRows);
    else if (activeSubLedger === 'misc') exportMiscLedgerCSV(tenant, miscRows);
    else exportTenantConsolidatedCSV(tenant, rentRows, elecRows, miscRows);
  };

  return (
    <div className="space-y-4">
      {/* Sub Ledger Toggle Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[var(--rule)] rounded-lg shadow-2xs">
          <button
            onClick={() => setActiveSubLedger('rent')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
              activeSubLedger === 'rent'
                ? 'bg-[var(--ink)] text-white'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            Rent
          </button>
          <button
            onClick={() => setActiveSubLedger('elec')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
              activeSubLedger === 'elec'
                ? 'bg-[var(--volt-dark)] text-white'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            Electricity
          </button>
          <button
            onClick={() => setActiveSubLedger('misc')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
              activeSubLedger === 'misc'
                ? 'bg-[var(--plum-dark)] text-white'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            Misc
          </button>
          <button
            onClick={() => setActiveSubLedger('all')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
              activeSubLedger === 'all'
                ? 'bg-[var(--brass-dark)] text-white'
                : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            Combined
          </button>
        </div>

        <button
          onClick={handleExport}
          className="px-2.5 py-1.5 rounded-md border border-[var(--rule)] bg-white text-xs font-medium text-[var(--ink)] hover:bg-[var(--paper-subtle)] transition-colors flex items-center gap-1.5 shadow-2xs"
          title="Download report as CSV"
        >
          <Download size={13} className="text-[var(--brass)]" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Year Navigation Bar */}
      <div className="flex items-center justify-between p-2.5 bg-[var(--paper-subtle)] border border-[var(--rule)] rounded-lg">
        <button
          onClick={() => setActiveYear((y) => y - 1)}
          className="w-8 h-8 rounded border border-[var(--rule)] bg-white flex items-center justify-center hover:bg-[var(--paper)] transition-colors text-[var(--ink)]"
          title="Previous year"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="text-center">
          <span className="font-serif-slab font-bold text-base text-[var(--ink)] block">
            {activeYear} Statement —{' '}
            {activeSubLedger === 'rent'
              ? 'Rent Ledger'
              : activeSubLedger === 'elec'
              ? 'Electricity Ledger'
              : activeSubLedger === 'misc'
              ? 'Misc Expenses'
              : 'All-in-One Combined'}
          </span>
          <span className="text-[11px] text-[var(--ink-soft)]">
            Opening Carried: <strong className="font-mono-plex">{formatCurrency(openingForYear)}</strong>
          </span>
        </div>

        <button
          onClick={() => setActiveYear((y) => y + 1)}
          className="w-8 h-8 rounded border border-[var(--rule)] bg-white flex items-center justify-center hover:bg-[var(--paper)] transition-colors text-[var(--ink)]"
          title="Next year"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Table */}
      {yearRows.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-[var(--rule)] rounded-lg bg-white/50 text-[var(--ink-soft)] text-sm">
          <Table2 className="mx-auto mb-2 text-[var(--ink-muted)]" size={28} />
          <p className="font-serif-slab text-base text-[var(--ink)]">No Entries in {activeYear}</p>
          <p className="text-xs mt-1">
            Opening balance carried forward into {activeYear}:{' '}
            <strong className="font-mono-plex">{formatCurrency(openingForYear)}</strong>
          </p>
        </div>
      ) : (
        <div className="border border-[var(--rule)] rounded-lg overflow-hidden bg-white shadow-2xs">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-[var(--rule-soft)] text-[var(--ink-soft)] uppercase text-[10px] tracking-wider border-b border-[var(--rule)]">
                <th className="py-2.5 px-3 font-semibold">Month</th>
                <th className="py-2.5 px-3 text-right font-semibold">Opening</th>
                <th className="py-2.5 px-3 text-right font-semibold">Add (Due)</th>
                <th className="py-2.5 px-3 text-right font-semibold">Less (Paid)</th>
                <th className="py-2.5 px-3 text-right font-semibold">Closing Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rule-soft)] font-mono-plex">
              {yearRows.map((r) => (
                <tr key={r.month} className="hover:bg-[var(--paper-subtle)] transition-colors">
                  <td className="py-2 px-3 font-sans font-medium text-[var(--ink)]">
                    {formatShortMonthLabel(r.month)}
                  </td>
                  <td className="py-2 px-3 text-right text-[var(--ink-soft)]">
                    {formatCurrency(r.opening)}
                  </td>
                  <td className="py-2 px-3 text-right text-[var(--brass-dark)]">
                    {formatCurrency(r.add)}
                  </td>
                  <td className="py-2 px-3 text-right text-[var(--teal-dark)] font-medium">
                    {formatCurrency(r.less)}
                  </td>
                  <td className="py-2 px-3 text-right font-bold">
                    <span
                      className={
                        r.balanceAfter > 0
                          ? 'text-[var(--danger)]'
                          : r.balanceAfter < 0
                          ? 'text-[var(--teal)]'
                          : 'text-[var(--ink)]'
                      }
                    >
                      {formatCurrency(r.balanceAfter)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[var(--brass-bg)] border-t-2 border-[var(--rule)] font-mono-plex font-bold text-xs sm:text-sm">
                <td className="py-2.5 px-3 font-sans text-[var(--ink)]">Closing {activeYear}</td>
                <td className="py-2.5 px-3 text-right text-[var(--ink)]">
                  {formatCurrency(openingForYear)}
                </td>
                <td className="py-2.5 px-3 text-right text-[var(--brass-dark)]">
                  {formatCurrency(totalAdd)}
                </td>
                <td className="py-2.5 px-3 text-right text-[var(--teal-dark)]">
                  {formatCurrency(totalLess)}
                </td>
                <td className="py-2.5 px-3 text-right text-sm">
                  <span
                    className={
                      closingForYear > 0
                        ? 'text-[var(--danger)]'
                        : closingForYear < 0
                        ? 'text-[var(--teal)]'
                        : 'text-[var(--ink)]'
                    }
                  >
                    {formatCurrency(closingForYear)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};
