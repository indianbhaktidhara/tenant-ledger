import React, { useState } from 'react';
import { AppState, MiscEntry, MiscItem, Tenant } from '../types';
import {
  computeMiscLedger,
  formatCurrency,
  formatMonthLabel,
  monthKey
} from '../utils/ledgerCalculations';
import { exportMiscLedgerCSV } from '../utils/csvExport';
import {
  Receipt,
  Download,
  Plus,
  Trash2,
  Edit2,
  Wrench
} from 'lucide-react';

interface Props {
  state: AppState;
  tenant: Tenant;
  viewMonth: Date;
  onUpdateTenant: (updated: Tenant) => void;
  onUpdateEntry: (key: string, entry: MiscEntry) => void;
  onDeleteEntry: (key: string) => void;
}

export const MiscTab: React.FC<Props> = ({
  state,
  tenant,
  viewMonth,
  onUpdateTenant,
  onUpdateEntry,
  onDeleteEntry
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editOpeningModal, setEditOpeningModal] = useState(false);

  // Add month form state
  const curViewMonthKey = monthKey(viewMonth);
  const [newMonth, setNewMonth] = useState(curViewMonthKey);
  const [firstItemLabel, setFirstItemLabel] = useState('');
  const [firstItemAmount, setFirstItemAmount] = useState('');
  const [newReceived, setNewReceived] = useState('0');
  const [newNote, setNewNote] = useState('');

  // Temp opening state
  const [tempOpening, setTempOpening] = useState(tenant.openingMisc?.toString() || '0');

  const rows = computeMiscLedger(state, tenant.id).slice().reverse();

  const handleCreateMonth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonth) return;
    const key = `${tenant.id}:${newMonth}`;

    const items: MiscItem[] = [];
    if (firstItemLabel.trim()) {
      items.push({
        id: `m_${Date.now()}`,
        label: firstItemLabel.trim(),
        amount: parseFloat(firstItemAmount) || 0,
        category: 'repair'
      });
    }

    const entry: MiscEntry = {
      month: newMonth,
      items,
      received: parseFloat(newReceived) || 0,
      note: newNote.trim()
    };

    onUpdateEntry(key, entry);
    setIsAddModalOpen(false);
    setFirstItemLabel('');
    setFirstItemAmount('');
    setNewReceived('0');
    setNewNote('');
  };

  const handleAddItemToEntry = (key: string, existing: MiscEntry) => {
    const newItem: MiscItem = {
      id: `it_${Date.now().toString(36)}`,
      label: 'Repair / Maintenance',
      amount: 0,
      category: 'repair'
    };
    const updated: MiscEntry = {
      ...existing,
      items: [...(existing.items || []), newItem]
    };
    onUpdateEntry(key, updated);
  };

  const handleUpdateItem = (
    key: string,
    existing: MiscEntry,
    itemIndex: number,
    field: 'label' | 'amount',
    val: string | number
  ) => {
    const updatedItems = [...existing.items];
    if (!updatedItems[itemIndex]) return;

    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      [field]: field === 'amount' ? parseFloat(val.toString()) || 0 : val
    };

    onUpdateEntry(key, { ...existing, items: updatedItems });
  };

  const handleRemoveItem = (key: string, existing: MiscEntry, itemIndex: number) => {
    const updatedItems = existing.items.filter((_, idx) => idx !== itemIndex);
    onUpdateEntry(key, { ...existing, items: updatedItems });
  };

  const handleReceivedChange = (key: string, existing: MiscEntry, valStr: string) => {
    onUpdateEntry(key, {
      ...existing,
      received: parseFloat(valStr) || 0
    });
  };

  const handleNoteChange = (key: string, existing: MiscEntry, valStr: string) => {
    onUpdateEntry(key, {
      ...existing,
      note: valStr
    });
  };

  return (
    <div className="space-y-4">
      {/* Settings Row: Opening Balance (Misc) */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--rule)] bg-[var(--plum-bg)] shadow-2xs">
        <div>
          <span className="block text-[10px] uppercase font-bold tracking-wider text-[var(--plum-dark)] flex items-center gap-1">
            <Receipt size={12} /> Opening Balance (Misc Ledger)
          </span>
          <span
            className={`font-mono-plex text-base font-bold ${
              tenant.openingMisc > 0
                ? 'text-[var(--danger)]'
                : tenant.openingMisc < 0
                ? 'text-[var(--teal)]'
                : 'text-[var(--plum)]'
            }`}
          >
            {formatCurrency(tenant.openingMisc)}
            {tenant.openingMisc < 0 ? ' (Advance)' : tenant.openingMisc > 0 ? ' (Due)' : ''}
          </span>
        </div>
        <button
          onClick={() => {
            setTempOpening(tenant.openingMisc?.toString() || '0');
            setEditOpeningModal(true);
          }}
          className="px-2.5 py-1 text-xs font-medium rounded border border-[var(--plum)] text-[var(--plum-dark)] hover:bg-white/60 transition-colors flex items-center gap-1"
        >
          <Edit2 size={12} /> Edit
        </button>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--ink-soft)]">
            One-off repairs, maintenance receipts, deposits & expenses
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportMiscLedgerCSV(tenant, computeMiscLedger(state, tenant.id))}
            className="px-2.5 py-1.5 rounded-md border border-[var(--rule)] bg-white text-xs font-medium text-[var(--ink)] hover:bg-[var(--paper-subtle)] transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Download CSV report of Miscellaneous Ledger"
          >
            <Download size={13} className="text-[var(--plum)]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setIsAddModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-md bg-[var(--plum-dark)] text-white text-xs font-medium hover:bg-[var(--plum)] transition-colors flex items-center gap-1.5 shadow-xs"
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
            <Wrench className="mx-auto mb-2 text-[var(--ink-muted)]" size={28} />
            <p className="font-serif-slab text-base text-[var(--ink)]">No Miscellaneous Expenses Yet</p>
            <p className="text-xs mt-1">
              Click &quot;Add Month Entry&quot; to log repair charges, maintenance receipts, or one-off items for {tenant.name}.
            </p>
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.key}
              className="bg-white border border-[var(--rule)] rounded-lg shadow-2xs overflow-hidden transition-all hover:border-[var(--ink-soft)]"
            >
              {/* Card Header */}
              <div className="px-4 py-2.5 bg-[var(--plum-bg)] border-b border-[var(--rule-soft)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt size={14} className="text-[var(--plum)]" />
                  <span className="font-serif-slab font-bold text-sm text-[var(--ink)]">
                    {formatMonthLabel(row.month)}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-[var(--plum-dark)] font-semibold border border-[var(--rule)]">
                    {row.items.length} Expense Item{row.items.length === 1 ? '' : 's'}
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

                {/* Items List */}
                <div className="space-y-1.5 py-1">
                  {row.items.map((it, idx) => (
                    <div
                      key={it.id || idx}
                      className="flex items-center justify-between gap-2 p-1.5 rounded bg-[var(--paper)] border border-[var(--rule-soft)]"
                    >
                      <input
                        type="text"
                        value={it.label}
                        onChange={(e) =>
                          handleUpdateItem(row.key, row, idx, 'label', e.target.value)
                        }
                        placeholder="Description (e.g. Plumber repair)"
                        className="flex-1 px-1.5 py-0.5 text-xs bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[var(--ink-soft)] rounded text-[var(--ink)]"
                      />
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[var(--ink-muted)]">₹</span>
                        <input
                          type="number"
                          step="any"
                          value={it.amount}
                          onChange={(e) =>
                            handleUpdateItem(row.key, row, idx, 'amount', e.target.value)
                          }
                          className="w-20 px-1.5 py-0.5 text-right font-mono-plex text-xs bg-white border border-[var(--rule)] rounded text-[var(--ink)] focus:outline-none"
                        />
                        <button
                          onClick={() => handleRemoveItem(row.key, row, idx)}
                          className="p-1 text-[var(--ink-soft)] hover:text-[var(--danger)] rounded"
                          title="Remove item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Item Button */}
                  <button
                    onClick={() => handleAddItemToEntry(row.key, row)}
                    className="w-full py-1.5 text-xs font-medium text-[var(--plum-dark)] hover:bg-[var(--plum-bg)] rounded border border-dashed border-[var(--plum)] transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus size={12} /> Add Expense / Receipt Item
                  </button>
                </div>

                {/* Total Added */}
                <div className="flex items-center justify-between py-1 border-t border-[var(--rule-soft)] font-medium">
                  <span className="text-[var(--ink-soft)]">Total Charges Added (₹):</span>
                  <span className="font-mono-plex font-bold text-[var(--plum)]">
                    {formatCurrency(row.add)}
                  </span>
                </div>

                {/* Less Received */}
                <div className="flex items-center justify-between py-1 border-b border-[var(--rule-soft)]">
                  <span className="text-[var(--teal-dark)] font-medium">Less Received / Paid (₹):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      value={row.received}
                      onChange={(e) => handleReceivedChange(row.key, row, e.target.value)}
                      className="w-24 px-2 py-1 text-right font-mono-plex text-sm bg-[var(--teal-bg)] border border-[var(--teal)] rounded text-[var(--teal-dark)] font-bold focus:bg-white"
                    />
                  </div>
                </div>

                {/* Balance After */}
                <div className="flex items-center justify-between py-1.5 font-semibold text-sm">
                  <span className="text-[var(--ink)]">Closing Misc Balance:</span>
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
                    placeholder="Add expense note, receipt number or bill details..."
                    onChange={(e) => handleNoteChange(row.key, row, e.target.value)}
                    className="w-full px-2.5 py-1 text-xs bg-[var(--paper)] border border-transparent focus:border-[var(--rule)] rounded text-[var(--ink-soft)] focus:bg-white"
                  />
                </div>

                {/* Card actions */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      if (confirm(`Delete miscellaneous entry for ${formatMonthLabel(row.month)}?`)) {
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

      {/* Add Month Misc Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[var(--rule)] shadow-2xl max-w-sm w-full p-4 sm:p-5">
            <h3 className="font-serif-slab text-lg font-bold text-[var(--ink)] mb-1">
              Add Misc Entry — {tenant.name}
            </h3>
            <p className="text-xs text-[var(--ink-soft)] mb-3">
              Record repair receipts, society maintenance, or deposit items.
            </p>
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
                <label className="block text-xs font-semibold text-[var(--plum-dark)] mb-1">
                  First Expense / Receipt Item (optional)
                </label>
                <input
                  type="text"
                  value={firstItemLabel}
                  onChange={(e) => setFirstItemLabel(e.target.value)}
                  placeholder="e.g. Tap Repair or Water charge"
                  className="w-full px-3 py-1.5 text-sm border border-[var(--rule)] rounded-md"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  Item Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={firstItemAmount}
                  onChange={(e) => setFirstItemAmount(e.target.value)}
                  placeholder="0"
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
                  placeholder="e.g. Receipt provided by vendor"
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
                  className="px-4 py-1.5 text-xs rounded bg-[var(--plum-dark)] text-white font-medium hover:bg-[var(--plum)]"
                >
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Opening Misc Modal */}
      {editOpeningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-[var(--rule)] shadow-2xl max-w-sm w-full p-4 sm:p-5">
            <h3 className="font-serif-slab text-lg font-bold text-[var(--ink)] mb-2">
              Opening Misc Balance — {tenant.name}
            </h3>
            <p className="text-xs text-[var(--ink-soft)] mb-3">
              Enter prior pending misc charges (+ for pending due, - for advance paid).
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
                    openingMisc: parseFloat(tempOpening) || 0
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
    </div>
  );
};
