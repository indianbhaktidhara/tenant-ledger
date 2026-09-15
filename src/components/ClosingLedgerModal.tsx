import React from 'react';
import { AppState } from '../types';
import {
  formatCurrency,
  getElecClosingBalance,
  getMiscClosingBalance,
  getRentClosingBalance
} from '../utils/ledgerCalculations';
import { exportAllTenantsClosingCSV, exportMonthlyReportCSV } from '../utils/csvExport';
import { X, Download, FileSpreadsheet, Layers, ShieldCheck } from 'lucide-react';

interface Props {
  state: AppState;
  activeMonth: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectTenant: (tenantId: string) => void;
}

export const ClosingLedgerModal: React.FC<Props> = ({
  state,
  activeMonth,
  isOpen,
  onClose,
  onSelectTenant
}) => {
  if (!isOpen) return null;

  let totalRent = 0;
  let totalElec = 0;
  let totalMisc = 0;

  const tenantRows = state.tenants.map((tenant) => {
    const rentBal = getRentClosingBalance(state, tenant.id);
    const elecBal = getElecClosingBalance(state, tenant.id);
    const miscBal = getMiscClosingBalance(state, tenant.id);
    const netTotal = rentBal + elecBal + miscBal;

    totalRent += rentBal;
    totalElec += elecBal;
    totalMisc += miscBal;

    return {
      tenant,
      rentBal,
      elecBal,
      miscBal,
      netTotal
    };
  });

  const grandTotal = totalRent + totalElec + totalMisc;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[var(--card)] rounded-xl border border-[var(--rule)] shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--rule)] flex justify-between items-start bg-[var(--paper-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="text-[var(--brass)]" size={20} />
              <h3 className="font-serif-slab text-xl font-bold text-[var(--ink)]">
                Closing Ledger — All Tenants
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] mt-1">
              Consolidated real-time net balances for Rent, Electricity, and Misc expenses.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--rule-soft)] rounded-md transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-4 py-2.5 bg-[var(--paper)] border-b border-[var(--rule-soft)] flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-[var(--ink-soft)] flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[var(--teal)]" />
            {state.tenants.length} Active Tenancies Recorded
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportMonthlyReportCSV(state, activeMonth)}
              className="px-2.5 py-1 text-xs rounded border border-[var(--rule)] bg-white text-[var(--ink)] hover:bg-[var(--paper-subtle)] transition-colors flex items-center gap-1 shadow-2xs"
              title="Download collection report for current month"
            >
              <FileSpreadsheet size={13} className="text-[var(--volt)]" />
              <span>Month CSV</span>
            </button>
            <button
              onClick={() => exportAllTenantsClosingCSV(state)}
              className="px-3 py-1 text-xs rounded bg-[var(--ink)] text-white hover:bg-black transition-colors flex items-center gap-1 shadow-xs"
              title="Download closing balance report across all tenants"
            >
              <Download size={13} />
              <span>Export Closing CSV</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1">
          <div className="border border-[var(--rule)] rounded-lg overflow-hidden bg-white shadow-2xs">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-[var(--rule-soft)] text-[var(--ink-soft)] uppercase text-[10px] tracking-wider border-b border-[var(--rule)]">
                  <th className="py-2.5 px-3 font-semibold">Tenant</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Rent</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Elec.</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Misc</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Net Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule-soft)] font-mono-plex">
                {tenantRows.map(({ tenant, rentBal, elecBal, miscBal, netTotal }) => (
                  <tr
                    key={tenant.id}
                    onClick={() => {
                      onSelectTenant(tenant.id);
                      onClose();
                    }}
                    className="hover:bg-[var(--brass-bg)] cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-sans">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: tenant.color }}
                        />
                        <span className="font-medium text-[var(--ink)] hover:underline">
                          {tenant.name}
                        </span>
                        {tenant.unit && (
                          <span className="text-[10px] text-[var(--ink-muted)] px-1 py-0.5 rounded bg-[var(--paper)]">
                            {tenant.unit}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-[var(--brass-dark)]">
                      {formatCurrency(rentBal)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[var(--volt-dark)]">
                      {formatCurrency(elecBal)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[var(--plum-dark)]">
                      {formatCurrency(miscBal)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      <span
                        className={
                          netTotal > 0
                            ? 'text-[var(--danger)]'
                            : netTotal < 0
                            ? 'text-[var(--teal)]'
                            : 'text-[var(--ink-muted)]'
                        }
                      >
                        {formatCurrency(netTotal)}
                        {netTotal < 0 ? ' (Adv)' : ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--brass-bg)] border-t-2 border-[var(--rule)] font-mono-plex font-bold text-xs sm:text-sm">
                  <td className="py-3 px-3 font-sans text-[var(--ink)]">Total Outstanding</td>
                  <td className="py-3 px-3 text-right text-[var(--brass-dark)]">
                    {formatCurrency(totalRent)}
                  </td>
                  <td className="py-3 px-3 text-right text-[var(--volt-dark)]">
                    {formatCurrency(totalElec)}
                  </td>
                  <td className="py-3 px-3 text-right text-[var(--plum-dark)]">
                    {formatCurrency(totalMisc)}
                  </td>
                  <td className="py-3 px-3 text-right text-sm">
                    <span
                      className={
                        grandTotal > 0
                          ? 'text-[var(--danger)]'
                          : grandTotal < 0
                          ? 'text-[var(--teal)]'
                          : 'text-[var(--ink)]'
                      }
                    >
                      {formatCurrency(grandTotal)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-[11px] text-[var(--ink-soft)] mt-3 text-center">
            Click on any tenant row to switch directly to their ledger statement.
          </p>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-[var(--rule)] bg-[var(--paper-subtle)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-[var(--rule)] bg-white text-sm font-medium text-[var(--ink)] hover:bg-[var(--paper)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
