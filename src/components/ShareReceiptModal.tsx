import React, { useState } from 'react';
import { AppState, Tenant } from '../types';
import {
  computeElecLedger,
  computeMiscLedger,
  computeRentLedger,
  formatCurrency,
  formatMonthLabel
} from '../utils/ledgerCalculations';
import { exportTenantConsolidatedCSV } from '../utils/csvExport';
import { X, Copy, Check, Printer, FileSpreadsheet, Share2 } from 'lucide-react';

interface Props {
  state: AppState;
  tenant: Tenant;
  activeMonth: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareReceiptModal: React.FC<Props> = ({
  state,
  tenant,
  activeMonth,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const rentRows = computeRentLedger(state, tenant.id);
  const elecRows = computeElecLedger(state, tenant.id);
  const miscRows = computeMiscLedger(state, tenant.id);

  const curRent = rentRows.find((r) => r.month === activeMonth);
  const curElec = elecRows.find((e) => e.month === activeMonth);
  const curMisc = miscRows.find((m) => m.month === activeMonth);

  const rentDue = curRent ? curRent.rent : 0;
  const rentPaid = curRent ? curRent.paid : 0;
  const rentBal = curRent ? curRent.balanceAfter : tenant.openingRent;

  const elecUnits = curElec ? curElec.units : 0;
  const elecDue = curElec ? curElec.amount : 0;
  const elecPaid = curElec ? curElec.received : 0;
  const elecBal = curElec ? curElec.balanceAfter : tenant.openingElec;

  const miscItems = curMisc ? curMisc.items : [];
  const miscDue = curMisc ? curMisc.add : 0;
  const miscPaid = curMisc ? curMisc.received : 0;
  const miscBal = curMisc ? curMisc.balanceAfter : tenant.openingMisc;

  const totalThisMonth = rentDue + elecDue + miscDue;
  const totalPaidThisMonth = rentPaid + elecPaid + miscPaid;
  const netOutstanding = rentBal + elecBal + miscBal;

  const statementText = `*TENANT STATEMENT / RECEIPT*
Tenant: ${tenant.name} ${tenant.unit ? `(${tenant.unit})` : ''}
Statement Period: ${formatMonthLabel(activeMonth)}
--------------------------------------
*1. Rent Ledger:*
• Fixed Rent: ${formatCurrency(rentDue)}
• Paid: ${formatCurrency(rentPaid)}
• Closing Rent Balance: ${formatCurrency(rentBal)}

*2. Electricity Ledger:*
• Meter Reading: Last ${curElec?.prevReading ?? 0} ➔ Current ${curElec?.reading ?? 0}
• Consumed Units: ${elecUnits} units (${curElec?.reading ?? 0} − ${curElec?.prevReading ?? 0})
• Amount: ${elecUnits} units × ₹${tenant.elecRate || 7}/unit = ${formatCurrency(elecDue)}
• Amount Recd: ${formatCurrency(elecPaid)}
• Amount Bal: ${formatCurrency(elecBal)}

*3. Miscellaneous Expenses:*
${miscItems.length > 0 ? miscItems.map((it) => `• ${it.label}: ${formatCurrency(it.amount)}`).join('\n') : '• None'}
• Total Misc Due: ${formatCurrency(miscDue)}
• Paid: ${formatCurrency(miscPaid)}
• Closing Misc Balance: ${formatCurrency(miscBal)}
--------------------------------------
*Total Charged This Month:* ${formatCurrency(totalThisMonth)}
*Total Received This Month:* ${formatCurrency(totalPaidThisMonth)}
*NET OUTSTANDING BALANCE:* ${formatCurrency(netOutstanding)} ${netOutstanding < 0 ? '(ADVANCE)' : netOutstanding === 0 ? '(CLEARED)' : '(DUE)'}
--------------------------------------
Generated via Tenant Ledger`;

  const handleCopy = () => {
    navigator.clipboard.writeText(statementText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl border border-[var(--rule)] shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[var(--rule)] flex justify-between items-center bg-[var(--paper)]">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-[var(--brass)]" />
            <h3 className="font-serif-slab text-lg font-bold text-[var(--ink)]">
              Statement & Share — {tenant.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--ink-soft)] hover:text-[var(--ink)] rounded-md"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Slip Preview */}
        <div className="p-4 overflow-y-auto flex-1 bg-[var(--paper-subtle)] font-sans">
          <div className="p-4 bg-white border border-[var(--rule)] rounded-lg shadow-xs font-mono-plex text-xs space-y-3 leading-relaxed">
            <div className="text-center pb-2 border-b border-dashed border-[var(--rule)] font-sans">
              <h4 className="font-serif-slab font-bold text-base text-[var(--ink)]">
                TENANT MONTHLY STATEMENT
              </h4>
              <p className="text-xs text-[var(--ink-soft)]">
                {tenant.name} {tenant.unit ? `• ${tenant.unit}` : ''} • {formatMonthLabel(activeMonth)}
              </p>
            </div>

            {/* Rent Section */}
            <div className="space-y-1">
              <div className="font-bold text-[var(--brass-dark)] flex justify-between">
                <span>1. Monthly Rent</span>
                <span>{formatCurrency(rentDue)}</span>
              </div>
              <div className="text-[var(--ink-soft)] flex justify-between text-[11px]">
                <span>Less Paid / Received</span>
                <span className="text-[var(--teal)]">-{formatCurrency(rentPaid)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-0.5 border-t border-[var(--rule-soft)]">
                <span>Rent Closing Balance</span>
                <span>{formatCurrency(rentBal)}</span>
              </div>
            </div>

            {/* Electricity Section */}
            <div className="space-y-1 pt-2 border-t border-dashed border-[var(--rule-soft)]">
              <div className="font-bold text-[var(--volt-dark)] flex justify-between">
                <span>2. Electricity ({elecUnits} units @ ₹{tenant.elecRate || 7}/unit)</span>
                <span>{formatCurrency(elecDue)}</span>
              </div>
              {curElec && (
                <div className="text-[10px] text-[var(--ink-muted)] flex justify-between font-mono-plex">
                  <span>Meter: {curElec.prevReading} ➔ {curElec.reading}</span>
                  <span>{curElec.reading} − {curElec.prevReading} = {elecUnits} units</span>
                </div>
              )}
              <div className="text-[var(--ink-soft)] flex justify-between text-[11px]">
                <span>Less Amount Recd (Paid)</span>
                <span className="text-[var(--teal)] font-mono-plex">-{formatCurrency(elecPaid)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-0.5 border-t border-[var(--rule-soft)]">
                <span>Amount Bal (Elec)</span>
                <span className="font-mono-plex">{formatCurrency(elecBal)}</span>
              </div>
            </div>

            {/* Misc Section */}
            <div className="space-y-1 pt-2 border-t border-dashed border-[var(--rule-soft)]">
              <div className="font-bold text-[var(--plum-dark)] flex justify-between">
                <span>3. Miscellaneous Expenses</span>
                <span>{formatCurrency(miscDue)}</span>
              </div>
              {miscItems.map((it) => (
                <div key={it.id} className="text-[11px] text-[var(--ink-soft)] flex justify-between pl-2">
                  <span>• {it.label}</span>
                  <span>{formatCurrency(it.amount)}</span>
                </div>
              ))}
              <div className="text-[var(--ink-soft)] flex justify-between text-[11px]">
                <span>Less Paid / Received</span>
                <span className="text-[var(--teal)]">-{formatCurrency(miscPaid)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-0.5 border-t border-[var(--rule-soft)]">
                <span>Misc Closing Balance</span>
                <span>{formatCurrency(miscBal)}</span>
              </div>
            </div>

            {/* Net Total Summary */}
            <div className="pt-2 border-t-2 border-[var(--rule)] bg-[var(--brass-bg)] -mx-4 -mb-4 p-3 rounded-b-lg font-sans">
              <div className="flex justify-between text-xs text-[var(--ink-soft)]">
                <span>Total Month Additions:</span>
                <span className="font-mono-plex">{formatCurrency(totalThisMonth)}</span>
              </div>
              <div className="flex justify-between text-xs text-[var(--ink-soft)]">
                <span>Total Month Received:</span>
                <span className="font-mono-plex text-[var(--teal)]">{formatCurrency(totalPaidThisMonth)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[var(--ink)] mt-1 pt-1 border-t border-[var(--rule)]">
                <span>Net Total Outstanding:</span>
                <span
                  className={`font-mono-plex ${
                    netOutstanding > 0
                      ? 'text-[var(--danger)]'
                      : netOutstanding < 0
                      ? 'text-[var(--teal)]'
                      : 'text-[var(--ink)]'
                  }`}
                >
                  {formatCurrency(netOutstanding)}
                  {netOutstanding < 0 ? ' (Adv)' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-3.5 border-t border-[var(--rule)] bg-[var(--paper)] flex flex-wrap justify-between items-center gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => exportTenantConsolidatedCSV(tenant, rentRows, elecRows, miscRows)}
              className="px-2.5 py-1.5 rounded border border-[var(--rule)] bg-white text-xs text-[var(--ink)] hover:bg-[var(--paper-subtle)] flex items-center gap-1.5 shadow-2xs"
              title="Download full CSV report"
            >
              <FileSpreadsheet size={14} className="text-[var(--teal)]" />
              <span>Full CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 rounded border border-[var(--rule)] bg-white text-xs text-[var(--ink)] hover:bg-[var(--paper-subtle)] flex items-center gap-1.5 shadow-2xs"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-4 py-1.5 rounded-lg bg-[var(--ink)] text-white text-xs font-medium hover:bg-black transition-colors flex items-center gap-1.5 shadow-xs"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copied WhatsApp Text!' : 'Copy WhatsApp Text'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
