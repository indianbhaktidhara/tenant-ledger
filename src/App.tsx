import React, { useEffect, useState } from 'react';
import { AppState, ElecEntry, MiscEntry, RentEntry, Tenant } from './types';
import { loadAppState, saveAppState, createInitialState } from './utils/storage';
import {
  computeMonthSummary,
  formatCurrency,
  formatMonthLabel,
  monthKey,
  TENANT_COLORS
} from './utils/ledgerCalculations';
import { exportMonthlyReportCSV } from './utils/csvExport';
import { RentTab } from './components/RentTab';
import { ElectricityTab } from './components/ElectricityTab';
import { MiscTab } from './components/MiscTab';
import { YearlyTab } from './components/YearlyTab';
import { OpeningBalancesModal } from './components/OpeningBalancesModal';
import { ClosingLedgerModal } from './components/ClosingLedgerModal';
import { ShareReceiptModal } from './components/ShareReceiptModal';
import { TenantSettingsModal } from './components/TenantSettingsModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { usePWA } from './hooks/usePWA';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Share2,
  Layers,
  Settings,
  Download,
  RotateCcw,
  Sparkles,
  Edit3,
  Calendar,
  Wallet,
  WifiOff
} from 'lucide-react';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [activeTenantId, setActiveTenantId] = useState<string>(() => {
    return state.tenants[0]?.id || 't_vedprakash';
  });
  const [activeTab, setActiveTab] = useState<'monthly' | 'electricity' | 'misc' | 'yearly'>('monthly');

  // Month navigation
  const [viewDate, setViewDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  // Modals state
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [tenantSettingsModal, setTenantSettingsModal] = useState<{
    isOpen: boolean;
    tenant: Tenant | null;
  }>({ isOpen: false, tenant: null });

  // PWA mobile installation & offline hook
  const { isInstallable, isInstalled, isIOS, isOnline, triggerInstall } = usePWA();

  // Persist state changes automatically
  useEffect(() => {
    saveAppState(state);
  }, [state]);

  const activeTenant =
    state.tenants.find((t) => t.id === activeTenantId) || state.tenants[0];

  const currentMonthKey = monthKey(viewDate);
  const monthSummary = computeMonthSummary(state, currentMonthKey);

  const prevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const jumpToToday = () => {
    const d = new Date();
    d.setDate(1);
    setViewDate(d);
  };

  // State Update Helpers
  const handleUpdateTenant = (updated: Tenant) => {
    setState((prev) => ({
      ...prev,
      tenants: prev.tenants.map((t) => (t.id === updated.id ? updated : t))
    }));
  };

  const handleSaveAllTenants = (updatedList: Tenant[]) => {
    setState((prev) => ({
      ...prev,
      tenants: updatedList
    }));
  };

  const handleSaveTenantProfile = (tenantData: Tenant) => {
    setState((prev) => {
      const exists = prev.tenants.some((t) => t.id === tenantData.id);
      if (exists) {
        return {
          ...prev,
          tenants: prev.tenants.map((t) => (t.id === tenantData.id ? tenantData : t))
        };
      }
      return {
        ...prev,
        tenants: [...prev.tenants, tenantData]
      };
    });
    setActiveTenantId(tenantData.id);
  };

  const handleDeleteTenant = (tenantId: string) => {
    setState((prev) => {
      const newTenants = prev.tenants.filter((t) => t.id !== tenantId);
      const newEntries = { ...prev.entries };
      const newElecEntries = { ...prev.elecEntries };
      const newMiscEntries = { ...prev.miscEntries };

      Object.keys(newEntries).forEach((k) => {
        if (k.startsWith(`${tenantId}:`)) delete newEntries[k];
      });
      Object.keys(newElecEntries).forEach((k) => {
        if (k.startsWith(`${tenantId}:`)) delete newElecEntries[k];
      });
      Object.keys(newMiscEntries).forEach((k) => {
        if (k.startsWith(`${tenantId}:`)) delete newMiscEntries[k];
      });

      return {
        tenants: newTenants,
        entries: newEntries,
        elecEntries: newElecEntries,
        miscEntries: newMiscEntries
      };
    });
    const remaining = state.tenants.filter((t) => t.id !== tenantId);
    if (remaining.length > 0) {
      setActiveTenantId(remaining[0].id);
    }
  };

  const handleUpdateRentEntry = (key: string, entry: RentEntry) => {
    setState((prev) => ({
      ...prev,
      entries: {
        ...prev.entries,
        [key]: entry
      }
    }));
  };

  const handleDeleteRentEntry = (key: string) => {
    setState((prev) => {
      const copy = { ...prev.entries };
      delete copy[key];
      return { ...prev, entries: copy };
    });
  };

  const handleUpdateElecEntry = (key: string, entry: ElecEntry) => {
    setState((prev) => ({
      ...prev,
      elecEntries: {
        ...prev.elecEntries,
        [key]: entry
      }
    }));
  };

  const handleDeleteElecEntry = (key: string) => {
    setState((prev) => {
      const copy = { ...prev.elecEntries };
      delete copy[key];
      return { ...prev, elecEntries: copy };
    });
  };

  const handleUpdateMiscEntry = (key: string, entry: MiscEntry) => {
    setState((prev) => ({
      ...prev,
      miscEntries: {
        ...prev.miscEntries,
        [key]: entry
      }
    }));
  };

  const handleDeleteMiscEntry = (key: string) => {
    setState((prev) => {
      const copy = { ...prev.miscEntries };
      delete copy[key];
      return { ...prev, miscEntries: copy };
    });
  };

  const handleResetData = () => {
    if (confirm('Reset all ledger data to zero for Narmadeshwar Mishra, Vedprakash, Beena, Anita, and Neeraj?')) {
      const init = createInitialState();
      setState(init);
      saveAppState(init);
      setActiveTenantId(init.tenants[0]?.id || '');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans antialiased pb-16">
      {/* Top Main Navigation Container */}
      <div className="max-w-2xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
        {/* App Header */}
        <header className="pb-3 border-b border-[var(--rule)] flex flex-wrap justify-between items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif-slab font-bold text-2xl tracking-tight text-[var(--ink)]">
                Tenant Ledger
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--brass-bg)] text-[var(--brass-dark)] border border-[var(--rule)]">
                5 Tenants Ready
              </span>
            </div>
            <p className="text-xs text-[var(--ink-soft)] mt-0.5">
              Rent, electricity, and miscellaneous expenses with opening amounts & CSV reports
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Direct Opening Balances Entry Button (explicitly requested) */}
            <button
              onClick={() => setIsOpeningModalOpen(true)}
              className="px-2.5 py-1.5 rounded-md border border-[var(--brass)] bg-[var(--brass-bg)] text-xs font-semibold text-[var(--brass-dark)] hover:bg-white transition-colors flex items-center gap-1 shadow-2xs"
              title="Open Opening Balances Entry Section for All Tenants"
            >
              <Wallet size={14} className="text-[var(--brass)]" />
              <span>Opening Balances</span>
            </button>

            {/* Closing Ledger Button */}
            <button
              onClick={() => setIsClosingModalOpen(true)}
              className="px-2.5 py-1.5 rounded-md border border-[var(--rule)] bg-white text-xs font-semibold text-[var(--ink)] hover:bg-[var(--paper-subtle)] transition-colors flex items-center gap-1 shadow-2xs"
              title="All Tenants Closing Net Balances"
            >
              <Layers size={14} className="text-[var(--volt)]" />
              <span>Closing Ledger</span>
            </button>

            {/* Share / Receipt */}
            {activeTenant && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="px-2.5 py-1.5 rounded-md border border-[var(--rule)] bg-white text-xs font-semibold text-[var(--ink)] hover:bg-[var(--paper-subtle)] transition-colors flex items-center gap-1 shadow-2xs"
                title="Share statement or print receipt slip"
              >
                <Share2 size={13} className="text-[var(--teal)]" />
                <span className="hidden sm:inline">Statement</span>
              </button>
            )}

            {/* PWA Mobile Installation Trigger */}
            <PWAInstallBanner
              isInstallable={isInstallable}
              isInstalled={isInstalled}
              isIOS={isIOS}
              onInstall={triggerInstall}
            />
          </div>
        </header>

        {/* Offline Notice (if connection drops) */}
        {!isOnline && (
          <div className="mt-2 py-1.5 px-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-xs flex items-center gap-2 font-medium">
            <WifiOff size={14} className="text-amber-700" />
            <span>Offline Mode Active — You can continue adding and editing records; everything is saved on this phone.</span>
          </div>
        )}

        {/* Month Navigation Strip */}
        <div className="py-2.5 flex items-center justify-between border-b border-[var(--rule)]">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded border border-[var(--rule)] bg-white flex items-center justify-center hover:bg-[var(--paper-subtle)] transition-colors text-[var(--ink)]"
            title="Previous month"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-2">
            <span className="font-serif-slab font-bold text-base sm:text-lg text-[var(--ink)]">
              {formatMonthLabel(currentMonthKey)}
            </span>
            <button
              onClick={jumpToToday}
              className="text-[10px] uppercase font-bold text-[var(--ink-soft)] hover:text-[var(--ink)] px-1.5 py-0.5 rounded bg-[var(--paper-subtle)] border border-[var(--rule-soft)]"
              title="Jump to current month"
            >
              Current
            </button>
          </div>

          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded border border-[var(--rule)] bg-white flex items-center justify-center hover:bg-[var(--paper-subtle)] transition-colors text-[var(--ink)]"
            title="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Month Financial Summary Card (Due, Received, Outstanding) */}
        <div className="grid grid-cols-3 border-b border-[var(--rule)] bg-[var(--rule)] gap-[1px]">
          <div className="bg-[var(--paper)] py-2.5 px-2 text-center">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-[var(--ink-soft)] mb-0.5">
              Due This Month
            </span>
            <span className="font-mono-plex font-bold text-sm sm:text-base text-[var(--brass)]">
              {formatCurrency(monthSummary.due)}
            </span>
          </div>

          <div className="bg-[var(--paper)] py-2.5 px-2 text-center">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-[var(--ink-soft)] mb-0.5">
              Received
            </span>
            <span className="font-mono-plex font-bold text-sm sm:text-base text-[var(--teal)]">
              {formatCurrency(monthSummary.collected)}
            </span>
          </div>

          <div className="bg-[var(--paper)] py-2.5 px-2 text-center">
            <span className="block text-[10px] uppercase font-bold tracking-wider text-[var(--ink-soft)] mb-0.5">
              Outstanding
            </span>
            <span
              className={`font-mono-plex font-bold text-sm sm:text-base ${
                monthSummary.outstanding > 0
                  ? 'text-[var(--danger)]'
                  : monthSummary.outstanding < 0
                  ? 'text-[var(--teal)]'
                  : 'text-[var(--ink)]'
              }`}
            >
              {formatCurrency(monthSummary.outstanding)}
            </span>
          </div>
        </div>

        {/* Tenant Horizontal Strip */}
        <div className="py-2.5 border-b border-[var(--rule)] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {state.tenants.map((t) => {
            const isActive = t.id === activeTenantId;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTenantId(t.id);
                  if (activeTab === 'yearly') setActiveTab('monthly');
                }}
                className={`flex-none px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--ink)] text-white shadow-xs'
                    : 'bg-white text-[var(--ink)] border border-[var(--rule)] hover:border-[var(--ink-soft)]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                <span>{t.name}</span>
                {t.unit && (
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded font-normal ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[var(--paper)] text-[var(--ink-muted)]'
                    }`}
                  >
                    {t.unit}
                  </span>
                )}
              </button>
            );
          })}

          {/* Add Tenant Chip */}
          <button
            onClick={() => setTenantSettingsModal({ isOpen: true, tenant: null })}
            className="flex-none px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-[var(--rule)] text-[var(--ink-soft)] hover:text-[var(--ink)] hover:border-[var(--ink)] bg-transparent transition-colors flex items-center gap-1"
          >
            <Plus size={13} />
            <span>Add Tenant</span>
          </button>
        </div>

        {/* Active Tenant View */}
        {activeTenant ? (
          <main className="pt-4">
            {/* Tenant Title & Profile Banner */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-xs"
                  style={{ backgroundColor: activeTenant.color }}
                />
                <h2 className="font-serif-slab text-xl font-bold text-[var(--ink)]">
                  {activeTenant.name}
                </h2>
                {activeTenant.unit && (
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--paper-subtle)] border border-[var(--rule)] text-[var(--ink-soft)] font-medium">
                    {activeTenant.unit}
                  </span>
                )}
              </div>

              <button
                onClick={() =>
                  setTenantSettingsModal({ isOpen: true, tenant: activeTenant })
                }
                className="text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] underline hover:no-underline flex items-center gap-1 p-1"
                title="Edit tenant rates, phone, room, or opening amounts"
              >
                <Edit3 size={13} />
                <span>Edit Profile</span>
              </button>
            </div>

            <p className="text-xs text-[var(--ink-soft)] mb-3">
              Fixed Rent: <strong className="font-mono-plex">{formatCurrency(activeTenant.fixedRent)}</strong> • Electricity Rate: <strong className="font-mono-plex">₹{activeTenant.elecRate}/unit</strong>
              {activeTenant.phone && <span> • Phone: {activeTenant.phone}</span>}
            </p>

            {/* Navigation Tabs (Rent, Electricity, Misc, Yearly) */}
            <div className="flex border-b border-[var(--rule)] mb-4 overflow-x-auto">
              <button
                onClick={() => setActiveTab('monthly')}
                className={`py-2.5 px-3.5 text-xs sm:text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'monthly'
                    ? 'border-[var(--ink)] text-[var(--ink)] font-bold'
                    : 'border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[var(--brass)]" />
                <span>Rent Ledger</span>
              </button>

              <button
                onClick={() => setActiveTab('electricity')}
                className={`py-2.5 px-3.5 text-xs sm:text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'electricity'
                    ? 'border-[var(--volt-dark)] text-[var(--volt-dark)] font-bold'
                    : 'border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[var(--volt)]" />
                <span>Electricity Ledger</span>
              </button>

              <button
                onClick={() => setActiveTab('misc')}
                className={`py-2.5 px-3.5 text-xs sm:text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'misc'
                    ? 'border-[var(--plum-dark)] text-[var(--plum-dark)] font-bold'
                    : 'border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[var(--plum)]" />
                <span>Misc Ledger</span>
              </button>

              <button
                onClick={() => setActiveTab('yearly')}
                className={`py-2.5 px-3.5 text-xs sm:text-sm font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'yearly'
                    ? 'border-[var(--ink)] text-[var(--ink)] font-bold'
                    : 'border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)]'
                }`}
              >
                <Calendar size={13} />
                <span>Yearly View</span>
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'monthly' && (
              <RentTab
                state={state}
                tenant={activeTenant}
                viewMonth={viewDate}
                onUpdateTenant={handleUpdateTenant}
                onUpdateEntry={handleUpdateRentEntry}
                onDeleteEntry={handleDeleteRentEntry}
              />
            )}

            {activeTab === 'electricity' && (
              <ElectricityTab
                state={state}
                tenant={activeTenant}
                viewMonth={viewDate}
                onUpdateTenant={handleUpdateTenant}
                onUpdateEntry={handleUpdateElecEntry}
                onDeleteEntry={handleDeleteElecEntry}
              />
            )}

            {activeTab === 'misc' && (
              <MiscTab
                state={state}
                tenant={activeTenant}
                viewMonth={viewDate}
                onUpdateTenant={handleUpdateTenant}
                onUpdateEntry={handleUpdateMiscEntry}
                onDeleteEntry={handleDeleteMiscEntry}
              />
            )}

            {activeTab === 'yearly' && (
              <YearlyTab state={state} tenant={activeTenant} />
            )}
          </main>
        ) : (
          <div className="py-16 text-center text-[var(--ink-soft)]">
            <p className="font-serif-slab text-lg">No Tenants Found</p>
            <button
              onClick={() => setTenantSettingsModal({ isOpen: true, tenant: null })}
              className="mt-3 px-4 py-2 rounded bg-[var(--ink)] text-white text-xs font-medium"
            >
              Add Your First Tenant
            </button>
          </div>
        )}

        {/* Footer & App Options (Mobile App Upgrade Readiness & Backup) */}
        <footer className="mt-10 pt-4 border-t border-[var(--rule)] text-center text-xs text-[var(--ink-soft)] space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => exportMonthlyReportCSV(state, currentMonthKey)}
              className="hover:underline text-[var(--ink)] flex items-center gap-1 font-medium"
            >
              <Download size={12} /> Export Current Month Report (CSV)
            </button>
            <span>•</span>
            <button
              onClick={() => setIsOpeningModalOpen(true)}
              className="hover:underline text-[var(--brass-dark)] flex items-center gap-1 font-medium"
            >
              <Wallet size={12} /> Opening Amount Entry Section
            </button>
            <span>•</span>
            <button
              onClick={handleResetData}
              className="hover:underline text-[var(--danger)] flex items-center gap-1"
            >
              <RotateCcw size={12} /> Reset All to Zero
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-[var(--ink-muted)] max-w-md mx-auto">
            All data persists locally on your device. Designed with mobile responsiveness, touch optimization, and portable schema ready to upgrade directly to native Android or iOS.
          </p>
        </footer>
      </div>

      {/* Modals */}
      <OpeningBalancesModal
        state={state}
        isOpen={isOpeningModalOpen}
        onClose={() => setIsOpeningModalOpen(false)}
        onSaveAll={handleSaveAllTenants}
      />

      <ClosingLedgerModal
        state={state}
        activeMonth={currentMonthKey}
        isOpen={isClosingModalOpen}
        onClose={() => setIsClosingModalOpen(false)}
        onSelectTenant={(id) => {
          setActiveTenantId(id);
          setActiveTab('monthly');
        }}
      />

      {activeTenant && (
        <ShareReceiptModal
          state={state}
          tenant={activeTenant}
          activeMonth={currentMonthKey}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      <TenantSettingsModal
        tenant={tenantSettingsModal.tenant}
        isOpen={tenantSettingsModal.isOpen}
        onClose={() => setTenantSettingsModal({ isOpen: false, tenant: null })}
        onSave={handleSaveTenantProfile}
        onDelete={handleDeleteTenant}
      />
    </div>
  );
}
