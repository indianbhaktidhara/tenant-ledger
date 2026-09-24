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
  Edit2,
  Table as TableIcon,
  LayoutList,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle
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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editOpeningModal, setEditOpeningModal] = useState(false);
  const [editRateModal, setEditRateModal] = useState(false);
  const [editBaselineModal, setEditBaselineModal] = useState(false);

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
  const [tempRate, setTempRate] = useState(tenant.elecRate?.toString() || '7');
  const [tempBaseline, setTempBaseline] = useState((tenant.initialReading ?? 0).toString());

  const elecRate = tenant.elecRate > 0 ? tenant.elecRate : 7;
  const rows = computeElecLedger(state, tenant.id).slice().reverse();

  // Handle input change in the Add Reading modal
  const handleReadingInputChange = (valStr: string) => {
    setNewReading(valStr);
    const readingNum = parseFloat(valStr);
    if (!isNaN(readingNum)) {
      const units = Math.max(0, Math.round((readingNum - lastReading) * 100) / 100);
      const calculatedAmt = Math.round(units * elecRate);
      setNewAmount(calculatedAmt.toString());
      setNewReceived(calculatedAmt.toString());
    }
  };

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonth) return;
    const key = `${tenant.id}:${newMonth}`;
    const readingNum = parseFloat(newReading) || 0;
    const units = Math.max(0, readingNum - lastReading);
    const defaultAmount = Math.round(units * elecRate);

    const entry: ElecEntry = {
      month: newMonth,
      reading: readingNum,
      amount: newAmount !== '' ? parseFloat(newAmount) || 0 : defaultAmount,
      received: newReceived !== '' ? parseFloat(newReceived) || 0 : 0,
      note: newNote.trim()
    };
    onUpdateEntry(key, entry);
    setIsAddModalOpen(false);
    setNewReading('');
    setNewAmount('');
    setNewReceived('');
    setNewNote('');
  };

  // Handle inline field edits with automatic unit & bill recalculation
  const handleInlineReadingChange = (rowKey: string, existing: ElecEntry, prevReading: number, newReadingVal: number) => {
    const units = Math.max(0, newReadingVal - prevReading);
    const autoAmount = Math.round(units * elecRate);
    const updated: ElecEntry = {
      ...existing,
      reading: newReadingVal,
      amount: autoAmount
    };
    onUpdateEntry(rowKey, updated);
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

  // Overall totals for electricity ledger
  const totalUnitsConsumed = rows.reduce((sum, r) => sum + r.units, 0);
  const totalBillCharged = rows.reduce((sum, r) => sum + r.amount, 0);
  const totalBillPaid = rows.reduce((sum, r) => sum + r.received, 0);
  const latestClosingBalance = rows.length > 0 ? rows[0].balanceAfter : tenant.openingElec;

  return (
    <div className="space-y-4">
      {/* 3-Card Configuration Header Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* 1. Baseline / Initial Meter Reading */}
        <div className="p-3 rounded-lg border border-[var(--rule)] bg-white shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--ink-soft)] flex items-center gap-1">
              <Gauge size={12} className="text-[var(--volt)]" /> Baseline Meter Reading
            </span>
            <button
              onClick={() => {
                setTempBaseline((tenant.initialReading ?? 0).toString());
                setEditBaselineModal(true);
              }}
              className="px-2 py-0.5 text-[11px] font-medium rounded border border-[var(--rule)] text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--paper-subtle)] transition-colors flex items-center gap-1"
            >
              <Edit2 size={11} /> Edit
            </button>
          </div>
          <div className="mt-2">
            <span className="font-mono-plex text-lg font-bold text-[var(--ink)]">
              {tenant.initialReading ?? 0}
            </span>
            <span className="text-xs text-[var(--ink-soft)] ml-1">units</span>
            <p className="text-[10px] text-[var(--ink-muted)] mt-0.5">
              Starting meter reading before Month 1
            </p>
          </div>
        </div>

        {/* 2. Electricity Rate / Unit */}
        <div className="p-3 rounded-lg border border-[var(--volt-dark)]/30 bg-[var(--volt-bg)] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--volt-dark)] flex items-center gap-1">
              <Zap size={12} /> Electricity Rate
            </span>
            <button
              onClick={() => {
                setTempRate((tenant.elecRate || 7).toString());
                setEditRateModal(true);
              }}
              className="px-2 py-0.5 text-[11px] font-medium rounded border border-[var(--volt-dark)]/40 bg-white/70 text-[var(--volt-dark)] hover:bg-white transition-colors flex items-center gap-1"
            >
              <Edit2 size={11} /> Edit
            </button>
          </div>
          <div className="mt-2">
            <span className="font-mono-plex text-lg font-bold text-[var(--volt-dark)]">
              ₹{elecRate}
            </span>
            <span className="text-xs text-[var(--volt-dark)] ml-1">/ unit</span>
            <p className="text-[10px] text-[var(--volt-dark)]/80 mt-0.5">
              Formula: Consumed Units × ₹{elecRate}
            </p>
          </div>
        </div>

        {/* 3. Opening Balance (Prior Arrears/Adv) */}
        <div className="p-3 rounded-lg border border-[var(--rule)] bg-white shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--ink-soft)]">
              Opening Balance (Elec)
            </span>
            <button
              onClick={() => {
                setTempOpening(tenant.openingElec?.toString() || '0');
                setEditOpeningModal(true);
              }}
              className="px-2 py-0.5 text-[11px] font-medium rounded border border-[var(--rule)] text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--paper-subtle)] transition-colors flex items-center gap-1"
            >
              <Edit2 size={11} /> Edit
            </button>
          </div>
          <div className="mt-2">
            <span
              className={`font-mono-plex text-lg font-bold ${
                tenant.openingElec > 0
                  ? 'text-[var(--danger)]'
                  : tenant.openingElec < 0
                  ? 'text-[var(--teal)]'
                  : 'text-[var(--ink)]'
              }`}
            >
              {formatCurrency(tenant.openingElec)}
            </span>
            <span className="text-xs text-[var(--ink-soft)] ml-1">
              {tenant.openingElec > 0 ? '(Due)' : tenant.openingElec < 0 ? '(Adv)' : '(Nil)'}
            </span>
            <p className="text-[10px] text-[var(--ink-muted)] mt-0.5">
              Prior dues before first entry
            </p>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded bg-[var(--paper-subtle)] border border-[var(--rule)] text-[var(--ink-soft)] font-medium flex items-center gap-1.5">
            <Gauge size={13} className="text-[var(--volt)]" />
            Last Meter Reading: <strong className="font-mono-plex text-[var(--ink)]">{lastReading}</strong> units
          </span>
          <span className="hidden sm:inline-flex px-2.5 py-1 rounded bg-[var(--paper-subtle)] border border-[var(--rule)] text-[var(--ink-soft)] font-medium items-center gap-1">
            Total Consumed: <strong className="font-mono-plex text-[var(--ink)]">{totalUnitsConsumed}</strong> units
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle: Cards vs Table */}
          <div className="inline-flex rounded-md border border-[var(--rule)] bg-white p-0.5 shadow-2xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                viewMode === 'cards'
                  ? 'bg-[var(--ink)] text-white shadow-xs'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
              title="Card view with clear meter step breakdown"
            >
              <LayoutList size={13} />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-[var(--ink)] text-white shadow-xs'
                  : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
              title="Full accounting ledger table sheet"
            >
              <TableIcon size={13} />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={() => exportElecLedgerCSV(tenant, computeElecLedger(state, tenant.id))}
            className="px-2.5 py-1.5 rounded-md border border-[var(--rule)] bg-white text-xs font-medium text-[var(--ink)] hover:bg-[var(--paper-subtle)] transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Download CSV report of Electricity Ledger"
          >
            <Download size={13} className="text-[var(--volt)]" />
            <span className="hidden xs:inline">Export CSV</span>
          </button>

          <button
            onClick={() => {
              setNewMonth(curViewMonthKey);
              setNewReading('');
              setNewAmount('');
              setNewReceived('');
              setNewNote('');
              setIsAddModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-md bg-[var(--volt-dark)] text-white text-xs font-semibold hover:bg-[var(--volt)] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={14} />
            <span>Add Reading</span>
          </button>
        </div>
      </div>

      {/* Main Ledger Content */}
      {rows.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-[var(--rule)] rounded-lg bg-white/50 text-[var(--ink-soft)] text-sm">
          <Gauge className="mx-auto mb-2 text-[var(--volt)]" size={32} />
          <p className="font-serif-slab text-base font-bold text-[var(--ink)]">No Electricity Readings Yet</p>
          <p className="text-xs mt-1 text-[var(--ink-soft)] max-w-md mx-auto">
            Click &quot;Add Reading&quot; to enter current meter reading. Consumed units will automatically calculate as <strong className="font-mono-plex">Current Reading − Last Reading</strong> and bill at <strong className="font-mono-plex">₹{elecRate}/unit</strong>.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 px-3.5 py-1.5 rounded-md bg-[var(--volt-dark)] text-white text-xs font-medium hover:bg-[var(--volt)] transition-colors inline-flex items-center gap-1.5"
          >
            <Plus size={13} /> Add First Reading
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* FULL ACCOUNTING LEDGER TABLE VIEW */
        <div className="bg-white border border-[var(--rule)] rounded-lg shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--paper-subtle)] border-b border-[var(--rule)] text-[var(--ink-soft)] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3 whitespace-nowrap">Month</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-right">Opening Last Reading</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-right">Current Meter Reading</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-right bg-[var(--volt-bg)]/40 text-[var(--volt-dark)]">
                    Consumed Units
                  </th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-right">Rate</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-right font-bold text-[var(--ink)]">
                    Amount (Units × ₹{elecRate})
                  </th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-right">Opening Bal</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-right text-[var(--teal-dark)]">Amount Recd</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-right font-bold">Amount Bal</th>
                  <th className="py-2.5 px-3 whitespace-nowrap text-center">Status</th>
                  <th className="py-2.5 px-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule-soft)] font-mono-plex">
                {rows.map((row) => (
                  <tr key={row.key} className="hover:bg-[var(--paper)] transition-colors">
                    {/* Month */}
                    <td className="py-2 px-3 font-sans font-medium text-[var(--ink)] whitespace-nowrap">
                      {formatMonthLabel(row.month)}
                    </td>

                    {/* Opening Last Reading */}
                    <td className="py-2 px-3 text-right text-[var(--ink-soft)]">
                      {row.prevReading}
                    </td>

                    {/* Current Meter Reading (Editable) */}
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        step="any"
                        value={row.reading}
                        onChange={(e) =>
                          handleInlineReadingChange(row.key, row, row.prevReading, parseFloat(e.target.value) || 0)
                        }
                        className="w-20 px-1.5 py-0.5 text-right font-mono-plex bg-white border border-[var(--rule)] rounded text-[var(--ink)] focus:border-[var(--volt)]"
                        title="Edit current meter reading (auto-updates consumed units and bill amount)"
                      />
                    </td>

                    {/* Consumed Units (Curr - Last) */}
                    <td className="py-2 px-3 text-right font-bold text-[var(--volt-dark)] bg-[var(--volt-bg)]/30">
                      {row.units}
                    </td>

                    {/* Rate */}
                    <td className="py-2 px-3 text-right text-[var(--ink-soft)]">
                      ₹{elecRate}
                    </td>

                    {/* Bill Amount */}
                    <td className="py-2 px-3 text-right font-bold text-[var(--ink)]">
                      <input
                        type="number"
                        step="any"
                        value={row.amount}
                        onChange={(e) =>
                          handleFieldChange(row.key, row, 'amount', parseFloat(e.target.value) || 0)
                        }
                        className="w-20 px-1.5 py-0.5 text-right font-mono-plex bg-white border border-[var(--rule)] rounded text-[var(--ink)] focus:border-[var(--volt)] font-bold"
                        title="Electricity Bill Amount (Units × Rate)"
                      />
                    </td>

                    {/* Opening Balance */}
                    <td className="py-2 px-3 text-right text-[var(--ink-soft)]">
                      {formatCurrency(row.opening)}
                    </td>

                    {/* Amount Received (Paid) */}
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        step="any"
                        value={row.received}
                        onChange={(e) =>
                          handleFieldChange(row.key, row, 'received', parseFloat(e.target.value) || 0)
                        }
                        className="w-20 px-1.5 py-0.5 text-right font-mono-plex bg-[var(--teal-bg)] border border-[var(--teal)]/40 rounded text-[var(--teal-dark)] font-bold focus:bg-white"
                        title="Amount received / paid"
                      />
                    </td>

                    {/* Amount Bal (Balance) */}
                    <td
                      className={`py-2 px-3 text-right font-bold ${
                        row.balanceAfter > 0
                          ? 'text-[var(--danger)]'
                          : row.balanceAfter < 0
                          ? 'text-[var(--teal)]'
                          : 'text-[var(--ink)]'
                      }`}
                    >
                      {formatCurrency(row.balanceAfter)}
                    </td>

                    {/* Status */}
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
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
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Delete electricity entry for ${formatMonthLabel(row.month)}?`)) {
                            onDeleteEntry(row.key);
                          }
                        }}
                        className="text-[var(--ink-muted)] hover:text-[var(--danger)] transition-colors p-1"
                        title="Delete entry"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--paper-subtle)] border-t border-[var(--rule)] font-mono-plex font-bold text-xs text-[var(--ink)]">
                  <td className="py-2.5 px-3 font-sans">Summary Totals</td>
                  <td className="py-2.5 px-3 text-right text-[var(--ink-soft)]">-</td>
                  <td className="py-2.5 px-3 text-right text-[var(--ink-soft)]">-</td>
                  <td className="py-2.5 px-3 text-right text-[var(--volt-dark)] bg-[var(--volt-bg)]/40">
                    {totalUnitsConsumed} units
                  </td>
                  <td className="py-2.5 px-3 text-right text-[var(--ink-soft)]">₹{elecRate}</td>
                  <td className="py-2.5 px-3 text-right text-[var(--ink)]">
                    {formatCurrency(totalBillCharged)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-[var(--ink-soft)]">-</td>
                  <td className="py-2.5 px-3 text-right text-[var(--teal-dark)]">
                    {formatCurrency(totalBillPaid)}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right ${
                      latestClosingBalance > 0
                        ? 'text-[var(--danger)]'
                        : latestClosingBalance < 0
                        ? 'text-[var(--teal)]'
                        : 'text-[var(--ink)]'
                    }`}
                  >
                    {formatCurrency(latestClosingBalance)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        /* DETAILED CARDS VIEW WITH CRYSTAL-CLEAR METER PORTION */
        <div className="space-y-3.5">
          {rows.map((row) => (
            <div
              key={row.key}
              className="bg-white border border-[var(--rule)] rounded-lg shadow-2xs overflow-hidden transition-all hover:border-[var(--ink-soft)]"
            >
              {/* Card Header: Month + Status + Summary */}
              <div className="px-3.5 sm:px-4 py-2 bg-[var(--volt-bg)] border-b border-[var(--rule-soft)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={15} className="text-[var(--volt)]" />
                  <span className="font-serif-slab font-bold text-sm text-[var(--ink)]">
                    {formatMonthLabel(row.month)}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[var(--volt)]/40 font-mono-plex font-bold text-[var(--volt-dark)]">
                    {row.units} units consumed
                  </span>
                </div>

                <div className="flex items-center gap-2">
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
              </div>

              <div className="p-3.5 sm:p-4 space-y-3">
                {/* 1. THE METER PORTION (Explicit, High-Contrast) */}
                <div className="p-3 rounded-lg bg-[var(--paper)] border border-[var(--rule)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-1.5">
                      <Gauge size={13} className="text-[var(--volt)]" />
                      1. Meter Reading & Units Consumed
                    </span>
                    <span className="text-[10px] text-[var(--ink-muted)]">
                      Consumed Units = Current − Last Reading
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
                    {/* Last Reading */}
                    <div className="bg-white p-2.5 rounded border border-[var(--rule-soft)]">
                      <span className="block text-[10px] uppercase font-bold text-[var(--ink-soft)] mb-0.5">
                        Opening Last Reading
                      </span>
                      <div className="font-mono-plex text-base font-bold text-[var(--ink)]">
                        {row.prevReading} <span className="text-xs font-normal text-[var(--ink-muted)]">units</span>
                      </div>
                      <span className="text-[10px] text-[var(--ink-muted)]">Previous recorded</span>
                    </div>

                    {/* Current Reading (Editable Input) */}
                    <div className="bg-white p-2.5 rounded border border-[var(--volt-dark)]/40 ring-1 ring-[var(--volt)]/20">
                      <label className="block text-[10px] uppercase font-bold text-[var(--volt-dark)] mb-0.5">
                        Current Meter Reading *
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="any"
                          value={row.reading}
                          onChange={(e) =>
                            handleInlineReadingChange(row.key, row, row.prevReading, parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2 py-1 font-mono-plex text-base font-bold bg-[var(--paper-subtle)] border border-[var(--rule)] rounded text-[var(--ink)] focus:bg-white focus:border-[var(--volt)]"
                          title="Type current reading to auto-calculate consumed units and amount"
                        />
                        <span className="text-xs font-mono-plex text-[var(--ink-soft)]">units</span>
                      </div>
                      <span className="text-[10px] text-[var(--volt-dark)]">Auto-updates bill below</span>
                    </div>

                    {/* Consumed Units Result */}
                    <div className="bg-[var(--volt-bg)] p-2.5 rounded border border-[var(--volt)]/50">
                      <span className="block text-[10px] uppercase font-bold text-[var(--volt-dark)] mb-0.5">
                        Consumed Units
                      </span>
                      <div className="font-mono-plex text-base font-bold text-[var(--volt-dark)] flex items-center gap-1">
                        <span>{row.units}</span>
                        <span className="text-xs font-normal text-[var(--volt-dark)]">units</span>
                      </div>
                      <span className="text-[10px] text-[var(--volt-dark)]/90 font-mono-plex">
                        {row.reading} − {row.prevReading} = {row.units}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. AMOUNT CALCULATION PORTION (Unit × Rate) */}
                <div className="p-2.5 rounded-lg bg-[var(--paper-subtle)] border border-[var(--rule-soft)] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[var(--volt-dark)] text-white text-[11px] font-bold flex items-center justify-center">
                      ₹
                    </span>
                    <div>
                      <span className="text-xs font-bold text-[var(--ink)]">
                        2. Electricity Bill Calculation (Units × Rate)
                      </span>
                      <div className="font-mono-plex text-xs text-[var(--ink-soft)] flex items-center gap-1 mt-0.5">
                        <strong className="text-[var(--volt-dark)]">{row.units} units</strong>
                        <span>×</span>
                        <strong>₹{elecRate}/unit</strong>
                        <span>=</span>
                        <strong className="text-sm font-bold text-[var(--ink)]">{formatCurrency(row.amount)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[var(--ink-soft)] font-medium">Bill Amount:</span>
                    <input
                      type="number"
                      step="any"
                      value={row.amount}
                      onChange={(e) =>
                        handleFieldChange(row.key, row, 'amount', parseFloat(e.target.value) || 0)
                      }
                      className="w-24 px-2 py-1 text-right font-mono-plex text-sm font-bold bg-white border border-[var(--rule)] rounded text-[var(--ink)] focus:border-[var(--volt)]"
                      title="Adjust electricity bill amount if needed"
                    />
                  </div>
                </div>

                {/* 3. AMOUNT RECEIVED & AMOUNT BAL (LEDGER PORTION) */}
                <div className="p-3 rounded-lg border border-[var(--rule)] bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink)]">
                      3. Ledger Balance & Settlement
                    </span>
                    <span className="text-[10px] text-[var(--ink-muted)]">
                      Balance = Opening + Bill − Received
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono-plex text-xs">
                    {/* Opening Bal */}
                    <div className="p-2 rounded bg-[var(--paper)] border border-[var(--rule-soft)]">
                      <span className="block text-[10px] font-sans font-semibold text-[var(--ink-soft)] mb-0.5">
                        Opening Balance
                      </span>
                      <span className="font-bold text-sm text-[var(--ink)]">
                        {formatCurrency(row.opening)}
                      </span>
                    </div>

                    {/* Bill Charged */}
                    <div className="p-2 rounded bg-[var(--paper)] border border-[var(--rule-soft)]">
                      <span className="block text-[10px] font-sans font-semibold text-[var(--ink-soft)] mb-0.5">
                        + Bill Charged
                      </span>
                      <span className="font-bold text-sm text-[var(--ink)]">
                        {formatCurrency(row.amount)}
                      </span>
                    </div>

                    {/* Amount Recd */}
                    <div className="p-2 rounded bg-[var(--teal-bg)]/40 border border-[var(--teal)]/40">
                      <label className="block text-[10px] font-sans font-bold text-[var(--teal-dark)] mb-0.5">
                        − Amount Recd (Paid)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={row.received}
                        onChange={(e) =>
                          handleFieldChange(row.key, row, 'received', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-1.5 py-0.5 font-mono-plex text-sm font-bold bg-white border border-[var(--teal)] rounded text-[var(--teal-dark)]"
                        title="Enter amount received from tenant"
                      />
                    </div>

                    {/* Amount Bal */}
                    <div
                      className={`p-2 rounded border ${
                        row.balanceAfter > 0
                          ? 'bg-[var(--danger-bg)] border-[var(--danger)]/30'
                          : row.balanceAfter < 0
                          ? 'bg-[var(--teal-bg)] border-[var(--teal)]/30'
                          : 'bg-[var(--paper)] border-[var(--rule-soft)]'
                      }`}
                    >
                      <span className="block text-[10px] font-sans font-bold text-[var(--ink-soft)] mb-0.5">
                        = Amount Bal (Outstanding)
                      </span>
                      <div
                        className={`text-sm font-bold ${
                          row.balanceAfter > 0
                            ? 'text-[var(--danger)]'
                            : row.balanceAfter < 0
                            ? 'text-[var(--teal)]'
                            : 'text-[var(--ink)]'
                        }`}
                      >
                        {formatCurrency(row.balanceAfter)}
                        <span className="text-[10px] font-sans font-normal ml-1">
                          {row.balanceAfter > 0 ? '(Due)' : row.balanceAfter < 0 ? '(Adv)' : '(Settled)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Note Field & Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="text"
                      value={row.note || ''}
                      placeholder="Add electricity note (e.g. meter checked, UPI Txn ID, paid on 4th)..."
                      onChange={(e) => handleFieldChange(row.key, row, 'note', e.target.value)}
                      className="w-full px-2.5 py-1 text-xs bg-[var(--paper)] border border-[var(--rule-soft)] focus:border-[var(--rule)] rounded text-[var(--ink)] focus:bg-white"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete electricity entry for ${formatMonthLabel(row.month)}?`)) {
                        onDeleteEntry(row.key);
                      }
                    }}
                    className="text-xs text-[var(--danger)] hover:underline flex items-center gap-1 px-2 py-1"
                  >
                    <Trash2 size={12} /> Delete Entry
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD METER READING MODAL (With Live Interactive Formula Calculation)       */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-[var(--rule)] shadow-2xl max-w-md w-full p-4 sm:p-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--rule-soft)]">
              <div>
                <h3 className="font-serif-slab text-lg font-bold text-[var(--ink)] flex items-center gap-1.5">
                  <Zap size={18} className="text-[var(--volt)]" />
                  Add Electricity Reading
                </h3>
                <p className="text-xs text-[var(--ink-soft)]">
                  Tenant: <strong className="text-[var(--ink)]">{tenant.name}</strong> • Rate: <strong className="font-mono-plex text-[var(--volt-dark)]">₹{elecRate}/unit</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-[var(--ink-muted)] hover:text-[var(--ink)] text-sm px-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="space-y-3.5 mt-3">
              {/* Month */}
              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">Billing Month *</label>
                <input
                  type="month"
                  required
                  value={newMonth}
                  onChange={(e) => setNewMonth(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-[var(--rule)] rounded-md font-mono-plex"
                />
              </div>

              {/* Meter Box Step */}
              <div className="p-3 rounded-lg bg-[var(--volt-bg)]/40 border border-[var(--volt)]/30 space-y-2">
                <span className="text-[11px] font-bold text-[var(--volt-dark)] uppercase tracking-wider block">
                  Meter Reading Step
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white rounded border border-[var(--rule-soft)]">
                    <span className="block text-[10px] text-[var(--ink-muted)]">Opening Last Reading</span>
                    <span className="font-mono-plex font-bold text-sm text-[var(--ink)]">
                      {lastReading} <span className="text-[11px] font-normal">units</span>
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[var(--volt-dark)] mb-1">
                      Current Reading *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newReading}
                      onChange={(e) => handleReadingInputChange(e.target.value)}
                      className="w-full px-2.5 py-1 text-sm border border-[var(--volt)] rounded font-mono-plex font-bold text-[var(--ink)] bg-white focus:ring-1 focus:ring-[var(--volt)]"
                      placeholder={`e.g. ${lastReading + 50}`}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Live Formula Preview */}
                {newReading !== '' && (
                  <div className="p-2 bg-white rounded border border-[var(--volt)]/40 font-mono-plex text-xs space-y-1">
                    <div className="text-[var(--volt-dark)] font-semibold flex items-center justify-between">
                      <span>Consumed Units:</span>
                      <span>
                        {parseFloat(newReading) || 0} − {lastReading} ={' '}
                        <strong>{Math.max(0, Math.round(((parseFloat(newReading) || 0) - lastReading) * 100) / 100)} units</strong>
                      </span>
                    </div>
                    <div className="text-[var(--ink)] flex items-center justify-between pt-1 border-t border-[var(--rule-soft)]">
                      <span>Electricity Bill:</span>
                      <strong className="text-[var(--ink)] text-sm">
                        {Math.max(0, Math.round(((parseFloat(newReading) || 0) - lastReading) * 100) / 100)} × ₹{elecRate} = ₹{newAmount || 0}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Bill Amount */}
              <div>
                <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                  Electricity Bill Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-plex text-sm text-[var(--ink-muted)]">₹</span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-sm border border-[var(--rule)] rounded-md font-mono-plex font-bold"
                  />
                </div>
                <span className="text-[10px] text-[var(--ink-muted)] mt-0.5 block">
                  Automatically calculated from units × rate (can be edited if needed).
                </span>
              </div>

              {/* Amount Received / Paid */}
              <div>
                <label className="block text-xs font-semibold text-[var(--teal-dark)] mb-1">
                  Amount Received / Paid (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-plex text-sm text-[var(--teal-dark)]">₹</span>
                  <input
                    type="number"
                    step="any"
                    value={newReceived}
                    onChange={(e) => setNewReceived(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-sm border border-[var(--teal)] rounded-md font-mono-plex font-bold text-[var(--teal-dark)] bg-[var(--teal-bg)]/30 focus:bg-white"
                    placeholder="Enter amount paid"
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setNewReceived(newAmount)}
                    className="text-[var(--teal-dark)] underline hover:no-underline"
                  >
                    Mark as Full Paid (₹{newAmount || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewReceived('0')}
                    className="text-[var(--ink-soft)] underline hover:no-underline"
                  >
                    Unpaid (₹0)
                  </button>
                </div>
              </div>

              {/* Live Balance Summary */}
              <div className="p-2.5 rounded bg-[var(--paper-subtle)] border border-[var(--rule)] flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--ink-soft)]">Resulting Amount Bal:</span>
                <span className="font-mono-plex font-bold text-sm">
                  {formatCurrency((parseFloat(newAmount) || 0) - (parseFloat(newReceived) || 0))}
                  {((parseFloat(newAmount) || 0) - (parseFloat(newReceived) || 0)) === 0 && ' (Settled)'}
                  {((parseFloat(newAmount) || 0) - (parseFloat(newReceived) || 0)) > 0 && ' (Due)'}
                  {((parseFloat(newAmount) || 0) - (parseFloat(newReceived) || 0)) < 0 && ' (Advance)'}
                </span>
              </div>

              {/* Optional Note */}
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-soft)] mb-1">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="e.g. Meter photo taken, Google Pay"
                  className="w-full px-3 py-1.5 text-sm border border-[var(--rule)] rounded-md"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--rule-soft)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs rounded border border-[var(--rule)] text-[var(--ink-soft)] hover:bg-[var(--paper-subtle)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs rounded bg-[var(--volt-dark)] text-white font-semibold hover:bg-[var(--volt)] shadow-xs flex items-center gap-1"
                >
                  <CheckCircle2 size={13} /> Save Reading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT BASELINE / INITIAL METER READING MODAL                                */}
      {/* ========================================================================= */}
      {editBaselineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-[var(--rule)] shadow-2xl max-w-sm w-full p-4 sm:p-5">
            <h3 className="font-serif-slab text-lg font-bold text-[var(--ink)] mb-1 flex items-center gap-1.5">
              <Gauge size={16} className="text-[var(--volt)]" /> Baseline Meter Reading
            </h3>
            <p className="text-xs text-[var(--ink-soft)] mb-3">
              Starting meter reading before Month 1 for <strong className="text-[var(--ink)]">{tenant.name}</strong>.
            </p>
            <label className="block text-[11px] font-semibold text-[var(--ink)] mb-1">
              Initial Reading (Units)
            </label>
            <input
              type="number"
              step="any"
              value={tempBaseline}
              onChange={(e) => setTempBaseline(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[var(--rule)] rounded-md font-mono-plex mb-4 font-bold"
              placeholder="0"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditBaselineModal(false)}
                className="px-3 py-1.5 text-xs rounded border border-[var(--rule)] text-[var(--ink-soft)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateTenant({
                    ...tenant,
                    initialReading: parseFloat(tempBaseline) || 0
                  });
                  setEditBaselineModal(false);
                }}
                className="px-4 py-1.5 text-xs rounded bg-[var(--ink)] text-white font-medium hover:bg-black"
              >
                Save Baseline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT ELECTRICITY RATE MODAL                                               */}
      {/* ========================================================================= */}
      {editRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-[var(--rule)] shadow-2xl max-w-sm w-full p-4 sm:p-5">
            <h3 className="font-serif-slab text-lg font-bold text-[var(--ink)] mb-1 flex items-center gap-1.5">
              <Zap size={16} className="text-[var(--volt)]" /> Electricity Unit Rate
            </h3>
            <p className="text-xs text-[var(--ink-soft)] mb-3">
              Rate charged per consumed unit (₹/unit) for <strong className="text-[var(--ink)]">{tenant.name}</strong>.
            </p>
            <label className="block text-[11px] font-semibold text-[var(--ink)] mb-1">
              Rate per Unit (₹)
            </label>
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-plex text-sm text-[var(--ink-muted)]">₹</span>
              <input
                type="number"
                step="any"
                value={tempRate}
                onChange={(e) => setTempRate(e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-sm border border-[var(--volt)] rounded-md font-mono-plex font-bold"
                placeholder="7"
                autoFocus
              />
            </div>
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
                Save Rate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT OPENING ELEC BALANCE MODAL                                           */}
      {/* ========================================================================= */}
      {editOpeningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-[var(--rule)] shadow-2xl max-w-sm w-full p-4 sm:p-5">
            <h3 className="font-serif-slab text-lg font-bold text-[var(--ink)] mb-1">
              Opening Electricity Balance
            </h3>
            <p className="text-xs text-[var(--ink-soft)] mb-3">
              Enter prior pending electricity balance (+ for due, − for advance) for <strong className="text-[var(--ink)]">{tenant.name}</strong>.
            </p>
            <label className="block text-[11px] font-semibold text-[var(--ink)] mb-1">
              Opening Balance (₹)
            </label>
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-plex text-sm text-[var(--ink-muted)]">₹</span>
              <input
                type="number"
                step="any"
                value={tempOpening}
                onChange={(e) => setTempOpening(e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-sm border border-[var(--rule)] rounded-md font-mono-plex font-bold"
                placeholder="0"
                autoFocus
              />
            </div>
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
                Save Opening
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
