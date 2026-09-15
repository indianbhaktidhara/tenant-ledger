import React, { useState } from 'react';
import { Tenant } from '../types';
import { TENANT_COLORS } from '../utils/ledgerCalculations';
import { X, Check, Trash2, UserPlus, UserCheck } from 'lucide-react';

interface Props {
  tenant?: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (tenantData: Tenant) => void;
  onDelete?: (tenantId: string) => void;
}

export const TenantSettingsModal: React.FC<Props> = ({
  tenant,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(tenant);

  const [name, setName] = useState(tenant?.name || '');
  const [phone, setPhone] = useState(tenant?.phone || '');
  const [unit, setUnit] = useState(tenant?.unit || '');
  const [color, setColor] = useState(tenant?.color || TENANT_COLORS[0]);
  const [fixedRent, setFixedRent] = useState(tenant?.fixedRent?.toString() || '');
  const [elecRate, setElecRate] = useState(tenant?.elecRate?.toString() || '9');
  const [openingRent, setOpeningRent] = useState(tenant?.openingRent?.toString() || '0');
  const [openingElec, setOpeningElec] = useState(tenant?.openingElec?.toString() || '0');
  const [openingMisc, setOpeningMisc] = useState(tenant?.openingMisc?.toString() || '0');
  const [initialReading, setInitialReading] = useState(tenant?.initialReading?.toString() || '0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data: Tenant = {
      id: tenant ? tenant.id : `t_${Date.now().toString(36)}`,
      name: name.trim(),
      phone: phone.trim(),
      unit: unit.trim(),
      color,
      fixedRent: parseFloat(fixedRent) || 0,
      elecRate: parseFloat(elecRate) || 0,
      openingRent: parseFloat(openingRent) || 0,
      openingElec: parseFloat(openingElec) || 0,
      openingMisc: parseFloat(openingMisc) || 0,
      initialReading: parseFloat(initialReading) || 0
    };

    onSave(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl border border-[var(--rule)] shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[var(--rule)] flex justify-between items-center bg-[var(--paper)]">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <UserCheck size={20} className="text-[var(--brass)]" />
            ) : (
              <UserPlus size={20} className="text-[var(--teal)]" />
            )}
            <h3 className="font-serif-slab text-lg font-bold text-[var(--ink)]">
              {isEditing ? `Edit Tenant — ${tenant?.name}` : 'Add New Tenant'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--ink-soft)] hover:text-[var(--ink)] rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
              Tenant Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[var(--rule)] rounded-md text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
              placeholder="e.g. Ramesh Kumar"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Unit / Flat / Room
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[var(--rule)] rounded-md text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
                placeholder="e.g. Flat 301, 1st Floor"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                Phone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[var(--rule)] rounded-md text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--ink)]"
                placeholder="e.g. +91 98765 43210"
              />
            </div>
          </div>

          {/* Color tag picker */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
              Tenant Color Badge
            </label>
            <div className="flex gap-2.5">
              {TENANT_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-115 ring-2 ring-offset-2 ring-[var(--ink)]' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Ledger Default Rates */}
          <div className="pt-3 border-t border-[var(--rule-soft)]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink-soft)] mb-2">
              Default Monthly Rates
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--brass-dark)] mb-1">
                  Monthly Fixed Rent (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={fixedRent}
                  onChange={(e) => setFixedRent(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm font-mono-plex bg-white border border-[var(--rule)] rounded-md text-[var(--ink)] focus:ring-1 focus:ring-[var(--brass)]"
                  placeholder="e.g. 8500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--volt-dark)] mb-1">
                  Electricity Rate / Unit (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={elecRate}
                  onChange={(e) => setElecRate(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm font-mono-plex bg-white border border-[var(--rule)] rounded-md text-[var(--ink)] focus:ring-1 focus:ring-[var(--volt)]"
                  placeholder="e.g. 9"
                />
              </div>
            </div>
          </div>

          {/* Opening Balances Entry */}
          <div className="pt-3 border-t border-[var(--rule-soft)] bg-[var(--paper-subtle)] p-3 rounded-lg border border-[var(--rule)]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
              Opening Balances Entry
            </h4>
            <p className="text-[11px] text-[var(--ink-soft)] mb-2.5">
              Enter previous pending balances (+ for due, - for advance paid) before ledger entries.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-[var(--brass-dark)] mb-0.5">
                  Rent Opening (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={openingRent}
                  onChange={(e) => setOpeningRent(e.target.value)}
                  className="w-full px-2 py-1 text-xs font-mono-plex bg-white border border-[var(--rule)] rounded"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[var(--volt-dark)] mb-0.5">
                  Elec Opening (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={openingElec}
                  onChange={(e) => setOpeningElec(e.target.value)}
                  className="w-full px-2 py-1 text-xs font-mono-plex bg-white border border-[var(--rule)] rounded"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[var(--plum-dark)] mb-0.5">
                  Misc Opening (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={openingMisc}
                  onChange={(e) => setOpeningMisc(e.target.value)}
                  className="w-full px-2 py-1 text-xs font-mono-plex bg-white border border-[var(--rule)] rounded"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-[10px] font-medium text-[var(--ink-soft)] mb-0.5">
                Initial Meter Reading (Starting Units)
              </label>
              <input
                type="number"
                step="any"
                value={initialReading}
                onChange={(e) => setInitialReading(e.target.value)}
                className="w-full px-2 py-1 text-xs font-mono-plex bg-white border border-[var(--rule)] rounded max-w-xs"
                placeholder="e.g. 1200"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-[var(--rule)] flex justify-between items-center">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${tenant?.name} and their ledger records?`)) {
                    onDelete(tenant!.id);
                    onClose();
                  }
                }}
                className="px-2.5 py-1.5 text-xs text-[var(--danger)] hover:bg-[var(--danger-bg)] rounded transition-colors flex items-center gap-1"
              >
                <Trash2 size={14} /> Delete Tenant
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg border border-[var(--rule)] text-xs text-[var(--ink-soft)] hover:bg-[var(--paper)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[var(--ink)] text-white text-xs font-medium hover:bg-black flex items-center gap-1 shadow-xs"
              >
                <Check size={14} /> Save Tenant
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
