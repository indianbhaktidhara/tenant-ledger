import React, { useState } from 'react';
import { AppState, Tenant } from '../types';
import { formatCurrency } from '../utils/ledgerCalculations';
import { X, Check, Calculator, Info } from 'lucide-react';

interface Props {
  state: AppState;
  isOpen: boolean;
  onClose: () => void;
  onSaveAll: (updatedTenants: Tenant[]) => void;
}

export const OpeningBalancesModal: React.FC<Props> = ({
  state,
  isOpen,
  onClose,
  onSaveAll
}) => {
  if (!isOpen) return null;

  const [tenantsData, setTenantsData] = useState<Tenant[]>(() =>
    state.tenants.map((t) => ({ ...t }))
  );

  const handleChange = (id: string, field: keyof Tenant, value: number) => {
    setTenantsData((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleSave = () => {
    onSaveAll(tenantsData);
    onClose();
  };

  const totalOpeningRent = tenantsData.reduce((s, t) => s + (Number(t.openingRent) || 0), 0);
  const totalOpeningElec = tenantsData.reduce((s, t) => s + (Number(t.openingElec) || 0), 0);
  const totalOpeningMisc = tenantsData.reduce((s, t) => s + (Number(t.openingMisc) || 0), 0);
  const grandOpeningTotal = totalOpeningRent + totalOpeningElec + totalOpeningMisc;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[var(--card)] rounded-xl border border-[var(--rule)] shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--rule)] flex justify-between items-start bg-[var(--paper-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--brass)]" />
              <h3 className="font-serif-slab text-xl font-bold text-[var(--ink)]">
                Opening Balances Entry Section
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] mt-1">
              Configure initial opening dues or advances for all 5 tenants before monthly entries begin.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--rule-soft)] rounded-md transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-4 py-2.5 bg-[var(--brass-bg)] border-b border-[var(--rule-soft)] text-xs text-[var(--brass-dark)] flex items-center gap-2">
          <Info size={16} className="shrink-0" />
          <span>
            <strong>Guide:</strong> Enter positive amounts (e.g. <strong>500</strong>) for pending balance/due, and negative amounts (e.g. <strong>-1000</strong>) for prepaid advance.
          </span>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          <div className="space-y-4">
            {tenantsData.map((tenant, idx) => (
              <div
                key={tenant.id}
                className="p-3.5 sm:p-4 rounded-lg border border-[var(--rule)] bg-[var(--paper)] transition-all hover:border-[var(--ink-soft)]"
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--rule-soft)]">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-xs"
                      style={{ backgroundColor: tenant.color }}
                    />
                    <div>
                      <span className="font-serif-slab font-bold text-base text-[var(--ink)]">
                        {tenant.name}
                      </span>
                      {tenant.unit && (
                        <span className="text-xs text-[var(--ink-muted)] ml-2 px-1.5 py-0.5 rounded bg-[var(--rule-soft)]">
                          {tenant.unit}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-mono-plex text-[var(--ink-soft)]">
                    Default Rent: {formatCurrency(tenant.fixedRent)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Rent Opening */}
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--brass-dark)] mb-1">
                      Rent Opening (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={tenant.openingRent ?? 0}
                      onChange={(e) =>
                        handleChange(tenant.id, 'openingRent', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-2.5 py-1.5 text-sm font-mono-plex bg-white border border-[var(--rule)] rounded-md text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--brass)]"
                      placeholder="0"
                    />
                    <span className="text-[10px] text-[var(--ink-muted)] mt-0.5 block">
                      {tenant.openingRent > 0
                        ? 'Pending Due'
                        : tenant.openingRent < 0
                        ? 'Prepaid Advance'
                        : 'Nil'}
                    </span>
                  </div>

                  {/* Electricity Opening */}
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--volt-dark)] mb-1">
                      Elec. Opening (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={tenant.openingElec ?? 0}
                      onChange={(e) =>
                        handleChange(tenant.id, 'openingElec', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-2.5 py-1.5 text-sm font-mono-plex bg-white border border-[var(--rule)] rounded-md text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--volt)]"
                      placeholder="0"
                    />
                    <span className="text-[10px] text-[var(--ink-muted)] mt-0.5 block">
                      {tenant.openingElec > 0 ? 'Pending Bill' : tenant.openingElec < 0 ? 'Advance' : 'Nil'}
                    </span>
                  </div>

                  {/* Misc Opening */}
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--plum-dark)] mb-1">
                      Misc. Opening (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={tenant.openingMisc ?? 0}
                      onChange={(e) =>
                        handleChange(tenant.id, 'openingMisc', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-2.5 py-1.5 text-sm font-mono-plex bg-white border border-[var(--rule)] rounded-md text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--plum)]"
                      placeholder="0"
                    />
                    <span className="text-[10px] text-[var(--ink-muted)] mt-0.5 block">
                      {tenant.openingMisc > 0 ? 'Pending Dues' : tenant.openingMisc < 0 ? 'Advance' : 'Nil'}
                    </span>
                  </div>

                  {/* Initial Meter Reading */}
                  <div>
                    <label className="block text-[11px] font-medium uppercase tracking-wider text-[var(--ink-soft)] mb-1">
                      Base Reading
                    </label>
                    <input
                      type="number"
                      value={tenant.initialReading ?? 0}
                      onChange={(e) =>
                        handleChange(tenant.id, 'initialReading', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-2.5 py-1.5 text-sm font-mono-plex bg-white border border-[var(--rule)] rounded-md text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--ink-soft)]"
                      placeholder="0"
                    />
                    <span className="text-[10px] text-[var(--ink-muted)] mt-0.5 block">
                      Start Meter Units
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary of Opening Balances */}
          <div className="p-3 bg-[var(--paper-subtle)] rounded-lg border border-[var(--rule)]">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)] mb-2 flex items-center gap-1.5">
              <Calculator size={14} /> Total Opening Ledger Summary
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono-plex">
              <div className="p-2 rounded bg-white border border-[var(--rule-soft)]">
                <span className="text-[var(--ink-soft)] block text-[10px]">Rent Opening</span>
                <span className="font-bold text-[var(--brass)]">{formatCurrency(totalOpeningRent)}</span>
              </div>
              <div className="p-2 rounded bg-white border border-[var(--rule-soft)]">
                <span className="text-[var(--ink-soft)] block text-[10px]">Elec Opening</span>
                <span className="font-bold text-[var(--volt)]">{formatCurrency(totalOpeningElec)}</span>
              </div>
              <div className="p-2 rounded bg-white border border-[var(--rule-soft)]">
                <span className="text-[var(--ink-soft)] block text-[10px]">Misc Opening</span>
                <span className="font-bold text-[var(--plum)]">{formatCurrency(totalOpeningMisc)}</span>
              </div>
              <div className="p-2 rounded bg-white border border-[var(--rule-soft)]">
                <span className="text-[var(--ink-soft)] block text-[10px]">Net Opening</span>
                <span className={`font-bold ${grandOpeningTotal > 0 ? 'text-[var(--danger)]' : 'text-[var(--teal)]'}`}>
                  {formatCurrency(grandOpeningTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-[var(--rule)] bg-[var(--paper-subtle)] flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--rule)] bg-white text-sm font-medium text-[var(--ink-soft)] hover:bg-[var(--paper)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-[var(--ink)] text-white text-sm font-medium hover:bg-black transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Check size={16} /> Save Opening Balances
          </button>
        </div>
      </div>
    </div>
  );
};
