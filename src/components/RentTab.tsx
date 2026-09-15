import React, { useState } from 'react';
import { AppState, RentEntry, Tenant } from '../types';
import {
  computeRentLedger,
  formatCurrency,
  formatMonthLabel,
  monthKey
} from '../utils/ledgerCalculations';
import { exportRentLedgerCSV } from '../utils/csvExport';
import {
  Download,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  Edit2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Props {
  state: AppState;
  tenant: Tenant;
  viewMonth: Date;
  onUpdateTenant: (updated: Tenant) => void;
  onUpdateEntry: (key: string, entry: RentEntry) => void;
  onDeleteEntry: (key: string) => void;
}

export const RentTab: React.FC<Props> = ({
  state,
  tenant,
  viewMonth,
  onUpdateTenant,
  onUpdateEntry,
  onDeleteEntry
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editOpeningModal, setEditOpeningModal] = useState(false);
  const [editFixedModal, setEditFixedModal] = useState(false);

  // Add month form state
  const curViewMonthKey = monthKey(viewMonth);
  const [newMonth, setNewMonth] = useState(curViewMonthKey);
  const [newRent, setNewRent] = useState(tenant.fixedRent?.toString() || '0');
  const [newPaid, setNewPaid] = useState('0');
  const [newPayMode, setNewPayMode] = useState('UPI');
  const [newNote, setNewNote] = useState('');

  // Edit opening temp state
  const [tempOpening, setTempOpening] = useState(tenant.openingRent?.toString() || '0');
  // Edit fixed rent temp state
  const [tempFixedRent, setTempFixedRent] = useState(tenant.fixedRent?.toString() || '0');

  const rows = computeRentLedger(state, tenant.id).slice().reverse();

  const handleCreateMonth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonth) return;
    const key = `${tenant.id}:${newMonth}`;
    const entry: RentEntry = {
      month: newMonth,
      rent: parseFloat(newRent) || 0,
      paid: parseFloat(newPaid) || 0,
      paymentMode: newPayMode,
      paymentDate: `${newMonth}-05`,
      note: newNote.trim()
    };
    onUpdateEntry(key, entry);
    setIsAddModalOpen(false);
    setNewNote('');
  };

  const handleFieldChange = (
    key: string,
    existing: RentEntry,
    field: keyof RentEntry,
    value: string | number
  ) => {
    const updated: RentEntry = {
      ...existing,
      [field]: typeof value === 'string' && (field === 'rent' || field === 'paid') ? parseFloat(value) || 0 : value
    };
    onUpdateEntry(key, updated);
  };

  return (
    <div className="space-y-4">
      {/* Settings Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Fixed Rent Bar */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--rule)] bg-[var(--brass-bg)] shadow-2xs">
          <div>
            <span className="block text-[10px] uppercase font-bold tracking-wider text-[var(--brass-dark)]">
              Monthly Fixed Rent
            </span>
            <span className="font-mono-plex text-base font-bold text-[var(--brass)]">
              {tenant.fixedRent ? formatCurrency(tenant.fixedRent) : 'Not Set'}
            </span>
          </div>
          <button
            onClick={() => {
              setTempFixedRent(tenant.fixedRent?.toString() || '0');
              setEditFixedModal(true);
            }}
            className="px-2.5 py-1 text-xs font-medium rounded border border-[var(--brass)] text-[var(--brass-dark)] hover:bg-white/60 transition-colors flex items-center gap-1"
          >
            <Edit2 size={12} /> {tenant.fixedRent ? 'Edit' : 'Set'}
          </button>
        </div>

        {/* Opening Balance (Rent) */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--rule)] bg-white shadow-2xs">
          <div>
            <span className="block text-[10px] uppercase font-bold tracking-wider text-[var(--ink-soft)]">
              Opening Balance (Rent)
            </span>
            <span
              className={`font-mono-plex text-base font-bold ${
                tenant.openingRent > 0
                  ? 'text-[var(--danger)]'
                  : tenant.openingRent < 0
                  ? 'text-[var(--teal)]'
                  : 'text-[var(--ink)]'
              }`}
            >
              {formatCurrency(tenant.openingRent)}
              {tenant.openingRent < 0 ? ' (Adv)' : tenant.openingRent > 0 ? ' (Due)' : ''}
            </span>
          </div>
          <button
            onClick={() => {
              setTempOpening(tenant.openingRent?.toString() || '0');
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
            {rows.length} Month{rows.length === 1 ? '' : 's'} Recorded
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportRentLedgerCSV(tenant, computeRentLedger(state, tenant.id))}
            className="px-2.5 py-1.5 rounded-md border border-[var(--rule)] bg-white text-xs font-medium text-[var(--ink)] hover:bg-[var(--paper-subtle)] transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Download CSV report of Rent Ledger"
          >
            <Download size={13} className="text-[var(--brass)]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setNewRent(tenant.fixedRent?.toString() || '0');
              setNewPaid(tenant.fixedRent?.toString() || '0');
              setIsAddModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-md bg-[var(--ink)] text-white text-xs font-medium hover:bg-black transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={14} />
            <span>Add Month Entry</span>
          </button>
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[var(--rule)] rounded-lg bg-white/50 text-[var(--ink-soft)] text-sm">
            <Calendar className="mx-auto mb-2 text-[var(--ink-muted)]" size={28} />
            <p className="font-serif-slab text-base text-[var(--ink)]">No Rent Entries Yet</p>
            <p className="text-xs mt-1">
              Click &quot;Add Month Entry&quot; to record rent and payment receipts for {tenant.name}.
            </p>
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.key}
              className="bg-white border border-[var(--rule)] rounded-lg shadow-2xs overflow-hidden transition-all hover:border-[var(--ink-soft)]"
            >
              {/* Card Header */}
              <div className="px-4 py-2.5 bg-[var(--paper-subtle)] border-b border-[var(--rule-soft)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-serif-slab font-bold text-sm text-[var(--ink)]">
                    {formatMonthLabel(row.month)}
                  </span>
                  {row.paymentMode && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-[var(--rule)] text-[var(--ink-soft)] flex items-center gap-1">
                      <CreditCard size={10} /> {row.paymentMode}
                    </span>
                  )}
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

                {/* Rent Charged */}
                <div className="flex items-center justify-between py-1 border-b border-[var(--rule-soft)]">
                  <span className="text-[var(--ink-soft)] font-medium">Rent Amount (₹):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      value={row.rent}
                      onChange={(e) =>
                        handleFieldChange(row.key, row, 'rent', parseFloat(e.target.value) || 0)
                      }
                      className="w-24 px-2 py-1 text-right font-mono-plex text-sm bg-[var(--paper)] border border-[var(--rule)] rounded text-[var(--ink)] focus:bg-white"
                    />
                  </div>
                </div>

                {/* Paid / Received */}
                <div className="flex items-center justify-between py-1 border-b border-[var(--rule-soft)]">
                  <span className="text-[var(--teal-dark)] font-medium">Less Received / Paid (₹):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      value={row.paid}
                      onChange={(e) =>
                        handleFieldChange(row.key, row, 'paid', parseFloat(e.target.value) || 0)
                      }
                      className="w-24 px-2 py-1 text-right font-mono-plex text-sm bg-[var(--teal-bg)] border border-[var(--teal)] rounded text-[var(--teal-dark)] font-bold focus:bg-white"
                    />
                  </div>
                </div>

                {/* Balance After */}
                <div className="flex items-center justify-between py-1.5 font-semibold text-sm">
                  <span className="text-[var(--ink)]">Closing Balance:</span>
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
                    placeholder="Add payment note, transaction ID, or date (optional)..."
                    onChange={(e) => handleFieldChange(row.key, row, 'note', e.target.value)}
                    className="w-full px-2.5 py-1 text-xs bg-[var(--paper)] border border-transparent focus:border-[var(--rule)] rounded text-[var(--ink-soft)] focus:bg-white"
                  />
                </div>

                {/* Card actions */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      if (confirm(`Delete entry for ${formatMonthLabel(row.month)}?`)) {
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

      {/* Add Month Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[var(--rule)] shadow-2xl max-w-sm w-full p-4 sm:p-5">
            <h3 className="font-serif-slab text-lg font-bold text-[var(--ink)] mb-3">
              Add Month Rent Entry — {tenant.name}
            </h3>
            <form onSubmit={handleCreateMonth} className="space-y-3">
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
                <label className="block text-xs font-semibold text-[var(--brass-dark)] mb-1">
                  Rent Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newRent}
                  onChange={(e) => setNewRent(e.target.value)}
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
                  value={newPaid}
                  onChange={(e) => setNewPaid(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-[var(--rule)] rounded-md font-mono-plex"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-soft)] mb-1">
                  Payment Mode
                </label>
                <select
                  value={newPayMode}
                  onChange={(e) => setNewPayMode(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-[var(--rule)] rounded-md bg-white"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-soft)] mb-1">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="e.g. Paid in full"
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
                  className="px-4 py-1.5 text-xs rounded bg-[var(--ink)] text-white font-medium hover:bg-black"
                >
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Opening Rent Modal */}
      {editOpeningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[var(--rule)] shadow-2xl max-w-sm w-full p-4 sm:p-5">
            <h3 className="font-serif-slab text-lg font-bold text-[var(--ink)] mb-2">
              Opening Rent Balance — {tenant.name}
            </h3>
            <p className="text-xs text-[var(--ink-soft)] mb-3">
              Enter amount already due (+ for pending due, - for advance paid) before the ledger starts.
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
                    openingRent: parseFloat(tempOpening) || 0
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

      {/* Edit Fixed Rent Modal */}
      {editFixedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[var(--rule)] shadow-2xl max-w-sm w-full p-4 sm:p-5">
            <h3 className="font-serif-slab text-lg font-bold text-[var(--ink)] mb-2">
              Monthly Fixed Rent — {tenant.name}
            </h3>
            <p className="text-xs text-[var(--ink-soft)] mb-3">
              Default monthly rent amount for automatic pre-fill in new entries.
            </p>
            <input
              type="number"
              step="any"
              value={tempFixedRent}
              onChange={(e) => setTempFixedRent(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[var(--rule)] rounded-md font-mono-plex mb-4"
              placeholder="e.g. 8500"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditFixedModal(false)}
                className="px-3 py-1.5 text-xs rounded border border-[var(--rule)] text-[var(--ink-soft)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateTenant({
                    ...tenant,
                    fixedRent: parseFloat(tempFixedRent) || 0
                  });
                  setEditFixedModal(false);
                }}
                className="px-4 py-1.5 text-xs rounded bg-[var(--ink)] text-white font-medium hover:bg-black"
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
