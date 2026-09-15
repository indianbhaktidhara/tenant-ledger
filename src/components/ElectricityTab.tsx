import React, { useState } from 'react';
import { AppState, ElecEntry, Tenant } from '../types';
import {
  computeElecLedger,
  formatCurrency,
  formatMonthLabel,
  getLastElecReading,
  monthKey
} from '../utils/ledgerCalculations';
import { exportElecLedgerCSV } from '../utils/csvExport';
import {
  Zap,
  Download,
  Plus,
  Trash2,
  Gauge,
  Edit2
} from 'lucide-react';

interface Props {
  state: AppState;
  tenant: Tenant;
  viewMonth: Date;
  onUpdateTenant: (updated: Tenant) => void;
  onUpdateEntry: (key: string, entry: ElecEntry) => void;
  onDeleteEntry: (key: string) => void;
}

export const ElectricityTab: React.FC<Props> = ({
  state,
  tenant,
  viewMonth,
  onUpdateTenant,
  onUpdateEntry,
  onDeleteEntry
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editOpeningModal, setEditOpeningModal] = useState(false);
  const [editRateModal, setEditRateModal] = useState(false);

  // Add reading form state
  const curViewMonthKey = monthKey(viewMonth);
  const lastReading = getLastElecReading(state, tenant.id);
  const [newMonth, setNewMonth] = useState(curViewMonthKey);
  const [newReading, setNewReading] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newReceived, setNewReceived] = useState('');
  const [newNote, setNewNote] = useState('');

  // Modals temp state
  const [tempOpening, setTempOpening] = useState(tenant.openingElec?.toString() || '0');
  const [tempRate, setTempRate] = useState(tenant.elecRate?.toString() || '9');

  const rows = computeElecLedger(state, tenant.id).slice().reverse();

  const handleReadingInputChange = (valStr: string) => {
    setNewReading(valStr);
    const readingNum = parseFloat(valStr);
    if (!isNaN(readingNum) && tenant.elecRate > 0) {
      const units = Math.max(0, readingNum - lastReading);
      const calculatedAmt = Math.round(units * tenant.elecRate);
      setNewAmount(calculatedAmt.toString());
      setNewReceived(calculatedAmt.toString());
    }
  };

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonth) return;
    const key = `${tenant.id}:${newMonth}`;
    const entry: ElecEntry = {
      month: newMonth,
      reading: parseFloat(newReading) || 0,
      amount: parseFloat(newAmount) || 0,
      received: parseFloat(newReceived) || 0,
      note: newNote.trim()
    };
    onUpdateEntry(key, entry);
    setIsAddModalOpen(false);
    setNewReading('');
    setNewAmount('');
    setNewReceived('');
    setNewNote('');
  };

  const handleFieldChange = (
    key: string,
    existing: ElecEntry,
    field: keyof ElecEntry,
    value: string | number
  ) => {
    const updated: ElecEntry = {
      ...existing,
      [field]:
        typeof value === 'string' && (field === 'reading' || field === 'amount' || field === 'received')
          ? parseFloat(value) || 0
          : value
    };
    onUpdateEntry(key, updated);
  };

  return (
    <div className="space-y-4">
      {/* Settings Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Rate Per Unit Bar */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--rule)] bg-[var(--volt-bg)] shadow-2xs">
          <div>
            <span className="block text-[10px] uppercase font-bold tracking-wider text-[var(--volt-dark)] flex items-center gap-1">
              <Zap size={12} /> Rate Per Unit
            </span>
            <span className="font-mono-plex text-base font-bold text-[var(--volt)]">
              {tenant.elecRate ? `₹${tenant.elecRate} / unit` : 'Not Set'}
            </span>
          </div>
          <button
            onClick={() => {
              setTempRate(tenant.elecRate?.toString() || '9');
              setEditRateModal(true);
            }}
            className="px-2.5 py-1 text-xs font-medium rounded border border-[var(--volt)] text-[var(--volt-dark)] hover:bg-white/60 transition-colors flex items-center gap-1"
          >
            <Edit2 size={12} /> {tenant.elecRate ? 'Edit' : 'Set'}
          </button>
        </div>

        {/* Opening Balance (Electricity) */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--rule)] bg-white shadow-2xs">
          <div>
            <span className="block text-[10px] uppercase font-bold tracking-wider text-[var(--ink-soft)]">
              Opening Balance (Elec)
            </span>
            <span
              className={`font-mono-plex text-base font-bold ${
                tenant.openingElec > 0
                  ? 'text-[var(--danger)]'
                  : tenant.openingElec < 0
                  ? 'text-[var(--teal)]'
                  : 'text-[var(--ink)]'
              }`}
            >
              {formatCurrency(tenant.openingElec)}
              {tenant.openingElec < 0 ? ' (Adv)' : tenant.openingElec > 0 ? ' (Due)' : ''}
            </span>
          </div>
          <button
            onClick={() => {
              setTempOpening(tenant.openingElec?.toString() || '0');
              setEditOpeningModal(true);
            }}
            className="px-2.5 py-1 text-xs font-medium rounded border border-[var(--rule)] text-[var(--ink-soft)] hover:bg-[var(--paper-subtle)] transition-colors flex items-center gap-1"
          >
            <Edit2 size={12} /> Edit
          </button>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--ink-soft)]">
            Last Reading: <strong className="font-mono-plex">{lastReading}</strong> units
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportElecLedgerCSV(tenant, computeElecLedger(state, tenant.id))}
            className="px-2.5 py-1.5 rounded-md border border-[var(--rule)] bg-white text-xs font-medium text-[var(--ink)] hover:bg-[var(--paper-subtle)] transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Download CSV report of Electricity Ledger"
          >
            <Download size={13} className="text-[var(--volt)]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setIsAddModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-md bg-[var(--volt-dark)] text-white text-xs font-medium hover:bg-[var(--volt)] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={14} />
            <span>Add Meter Reading</span>
          </button>
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[var(--rule)] rounded-lg bg-white/50 text-[var(--ink-soft)] text-sm">
            <Gauge className="mx-auto mb-2 text-[var(--ink-muted)]" size={28} />
            <p className="font-serif-slab text-base text-[var(--ink)]">No Electricity Readings Yet</p>
            <p className="text-xs mt-1">
              Click &quot;Add Meter Reading&quot; to calculate consumed units and billing for {tenant.name}.
            </p>
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.key}
              className="bg-white border border-[var(--rule)] rounded-lg shadow-2xs overflow-hidden transition-all hover:border-[var(--ink-soft)]"
            >
              {/* Card Header */}
              <div className="px-4 py-2.5 bg-[var(--volt-bg)] border-b border-[var(--rule-soft)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-[var(--volt)]" />
                  <span className="font-serif-slab font-bold text-sm text-[var(--ink)]">
                    {formatMonthLabel(row.month)}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[var(--volt)] font-mono-plex font-semibold text-[var(--volt-dark)]">
                    {row.units} units consumed
                  </span>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    row.status === 'settled'
                      ? 'bg-[var(--teal-bg)] text-[var(--teal)]'
                      : row.status === 'advance'
                      ? 'bg-[var(--volt-bg)] text-[var(--volt)]'
                      : row.status === 'overdue'
                      ? 'bg-[var(--danger-bg)] text-[var(--danger)]'
                      : 'bg-[var(--brass-bg)] text-[var(--brass)]'
                  }`}
                >
                  {row.status}
                </span>
              </div>

              {/* Rows */}
              <div className="p-3 sm:p-4 space-y-2 text-xs sm:text-sm">
                {/* Opening */}
                <div className="flex items-center justify-between py-1 border-b border-dashed border-[var(--rule-soft)]">
                  <span className="text-[var(--ink-soft)]">Opening Balance:</span>
                  <span className="font-mono-plex font-medium text-[var(--ink)]">
                    {formatCurrency(row.opening)}
                  </span>
                </div>

                {/* Meter Reading */}
                <div className="flex items-center justify-between py-1 border-b border-[var(--rule-soft)]">
                  <div>
                    <span className="text-[var(--ink-soft)] font-medium">Meter Reading:</span>
                    <span className="block text-[10px] text-[var(--ink-muted)]">
                      Prev: {row.prevReading} &rarr; Curr: {row.reading}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      value={row.reading}
                      onChange={(e) =>
                        handleFieldChange(row.key, row, 'reading', parseFloat(e.target.value) || 0)
                      }
                      className="w-24 px-2 py-1 text-right font-mono-plex text-sm bg-[var(--paper)] border border-[var(--rule)] rounded text-[var(--ink)] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Amount Charged */}
                <div className="flex items-center justify-between py-1 border-b border-[var(--rule-soft)]">
                  <div>
                    <span className="text-[var(--ink-soft)] font-medium">Electricity Bill (₹):</span>
                    <span className="block text-[10px] text-[var(--ink-muted)]">
                      {row.units} units × ₹{tenant.elecRate || 9}/unit
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      value={row.amount}
                      onChange={(e) =>
                        handleFieldChange(row.key, row, 'amount', parseFloat(e.target.value) || 0)
                      }
                      className="w-24 px-2 py-1 text-right font-mono-plex text-sm bg-[var(--paper)] border border-[var(--rule)] rounded text-[var(--ink)] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Less Received */}
                <div className="flex items-center justify-between py-1 border-b border-[var(--rule-soft)]">
                  <span className="text-[var(--teal-dark)] font-medium">Less Received (₹):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      value={row.received}
                      onChange={(e) =>
                        handleFieldChange(row.key, row, 'received', parseFloat(e.target.value) || 0)
                      }
                      className="w-24 px-2 py-1 text-right font-mono-plex text-sm bg-[var(--teal-bg)] border border-[var(--teal)] rounded text-[var(--teal-dark)] font-bold focus:bg-white"
                    />
                  </div>
                </div>

                {/* Balance After */}
                <div className="flex items-center justify-between py-1.5 font-semibold text-sm">
                  <span className="text-[var(--ink)]">Closing Elec Balance:</span>
                  <span
                    className={`font-mono-plex font-bold ${
                      row.balanceAfter > 0
                        ? 'text-[var(--danger)]'
                        : row.balanceAfter < 0
                        ? 'text-[var(--teal)]'
                        : 'text-[var(--ink)]'
                    }`}
                  >
                    {formatCurrency(row.balanceAfter)}
                    {row.balanceAfter < 0 ? ' (Advance)' : row.balanceAfter === 0 ? ' (Settled)' : ' (Due)'}
                  </span>
                </div>

                {/* Note Field */}
                <div className="pt-2">
                  <input
                    type="text"
                    value={row.note || ''}
                    placeholder="Add electricity note (e.g. meter checked by landlord)..."
                    onChange={(e) => handleFieldChange(row.key, row, 'note', e.target.value)}
                    className="w-full px-2.5 py-1 text-xs bg-[var(--paper)] border border-transparent focus:border-[var(--rule)] rounded text-[var(--ink-soft)] focus:bg-white"
                  />
                </div>

                {/* Card actions */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      if (confirm(`Delete electricity entry for ${formatMonthLabel(row.month)}?`)) {
                        onDeleteEntry(row.key);
                      }
                    }}
                    className="text-[11px] text-[var(--danger)] hover:underline flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Delete Entry
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Reading Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[var(--rule)] shadow-2xl max-w-sm w-full p-4 sm:p-5">
            <h3 className="font-serif-slab text-lg font-bold text-[var(--ink)] mb-1">
              Add Electricity Reading — {tenant.name}
            </h3>
            <p className="text-xs text-[var(--ink-soft)] mb-3">
              Previous recorded reading was <strong className="font-mono-plex">{lastReading}</strong> units.
            </p>
            <form onSubmit={handleCreateEntry} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">Month</label>
                <input
                  type="month"
                  required
                  value={newMonth}
                  onChange={(e) => setNewMonth(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-[var(--rule)] rounded-md font-mono-plex"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--volt-dark)] mb-1">
                  Current Meter Reading *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newReading}
                  onChange={(e) => handleReadingInputChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-[var(--volt)] rounded-md font-mono-plex"
                  placeholder={`Greater than ${lastReading}`}
                  autoFocus
                />
                {newReading && parseFloat(newReading) >= lastReading && (
                  <span className="text-[11px] text-[var(--volt-dark)] mt-1 block font-mono-plex">
                    &rarr; {parseFloat(newReading) - lastReading} units consumed
                  </span>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  Calculated Bill Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-[var(--rule)] rounded-md font-mono-plex"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--teal-dark)] mb-1">
                  Amount Received / Paid (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={newReceived}
                  onChange={(e) => setNewReceived(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-[var(--rule)] rounded-md font-mono-plex"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-soft)] mb-1">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="e.g. Meter photo taken"
                  className="w-full px-3 py-1.5 text-sm border border-[var(--rule)] rounded-md"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs rounded border border-[var(--rule)] text-[var(--ink-soft)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs rounded bg-[var(--volt-dark)] text-white font-medium hover:bg-[var(--volt)]"
                >
                  Add Reading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Opening Elec Modal */}
      {editOpeningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[var(--rule)] shadow-2xl max-w-sm w-full p-4 sm:p-5">
            <h3 className="font-serif-slab text-lg font-bold text-[var(--ink)] mb-2">
              Opening Electricity Balance — {tenant.name}
            </h3>
            <p className="text-xs text-[var(--ink-soft)] mb-3">
              Enter prior pending electricity bill (+ for due, - for advance paid).
            </p>
            <input
              type="number"
              step="any"
              value={tempOpening}
              onChange={(e) => setTempOpening(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[var(--rule)] rounded-md font-mono-plex mb-4"
              placeholder="0"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditOpeningModal(false)}
                className="px-3 py-1.5 text-xs rounded border border-[var(--rule)] text-[var(--ink-soft)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateTenant({
                    ...tenant,
                    openingElec: parseFloat(tempOpening) || 0
                  });
                  setEditOpeningModal(false);
                }}
                className="px-4 py-1.5 text-xs rounded bg-[var(--ink)] text-white font-medium hover:bg-black"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Rate Modal */}
      {editRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[var(--rule)] shadow-2xl max-w-sm w-full p-4 sm:p-5">
            <h3 className="font-serif-slab text-lg font-bold text-[var(--ink)] mb-2">
              Electricity Unit Rate — {tenant.name}
            </h3>
            <p className="text-xs text-[var(--ink-soft)] mb-3">
              Rate charged per consumed kilowatt unit (₹).
            </p>
            <input
              type="number"
              step="any"
              value={tempRate}
              onChange={(e) => setTempRate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[var(--rule)] rounded-md font-mono-plex mb-4"
              placeholder="e.g. 9"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditRateModal(false)}
                className="px-3 py-1.5 text-xs rounded border border-[var(--rule)] text-[var(--ink-soft)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateTenant({
                    ...tenant,
                    elecRate: parseFloat(tempRate) || 0
                  });
                  setEditRateModal(false);
                }}
                className="px-4 py-1.5 text-xs rounded bg-[var(--volt-dark)] text-white font-medium hover:bg-[var(--volt)]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
