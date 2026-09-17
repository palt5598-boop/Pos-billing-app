import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Store,
  Moon,
  Sun,
  HardDrive,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Users,
  Package,
  Truck,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { exportFullBackup, restoreBackupData } from '../utils/storage';
import { PWAInstallButton } from './PWAInstallButton';

export const SettingsScreen: React.FC = () => {
  const {
    products,
    customers,
    bills,
    purchases,
    settings,
    updateSettings,
    resetData,
    reseedData,
    setActiveTab,
  } = useShop();

  const [shopName, setShopName] = useState(settings.shopName);
  const [shopPhone, setShopPhone] = useState(settings.shopPhone || '');
  const [shopAddress, setShopAddress] = useState(settings.shopAddress || '');
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '₹');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Erase Confirm
  const [isEraseConfirmOpen, setIsEraseConfirmOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      shopName: shopName.trim() || 'My Shop',
      shopPhone: shopPhone.trim(),
      shopAddress: shopAddress.trim(),
      currencySymbol: currencySymbol.trim() || '₹',
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2400);
  };

  const handleExportBackup = () => {
    exportFullBackup();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        restoreBackupData(parsed);
        window.location.reload();
      } catch (err: any) {
        setImportStatus('Invalid or corrupted backup file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-md mx-auto px-3 pt-2 pb-28 space-y-3">
      {/* Customer Directory Navigation Card */}
      <div
        id="card-open-customers"
        onClick={() => setActiveTab('customers')}
        className="p-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between cursor-pointer active:scale-98 transition-transform"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Customer Directory
            </h3>
            <p className="text-[11px] text-zinc-400">
              {customers.length} saved customer contacts
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-400" />
      </div>

      {/* PWA Home Screen Install Card */}
      <PWAInstallButton variant="card" />

      {/* Store Statistics Mini-Pills */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
          <span className="text-[10px] text-zinc-400 font-bold uppercase block">Bills</span>
          <span className="text-xs font-black font-mono text-zinc-900 dark:text-zinc-100">
            {bills.length}
          </span>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
          <span className="text-[10px] text-zinc-400 font-bold uppercase block">Items</span>
          <span className="text-xs font-black font-mono text-zinc-900 dark:text-zinc-100">
            {products.length}
          </span>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
          <span className="text-[10px] text-zinc-400 font-bold uppercase block">Clients</span>
          <span className="text-xs font-black font-mono text-zinc-900 dark:text-zinc-100">
            {customers.length}
          </span>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
          <span className="text-[10px] text-zinc-400 font-bold uppercase block">Vendors</span>
          <span className="text-xs font-black font-mono text-zinc-900 dark:text-zinc-100">
            {purchases.length}
          </span>
        </div>
      </div>

      {/* Theme Switcher */}
      <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
            App Theme
          </span>
          <span className="text-[11px] text-zinc-400 capitalize">
            {settings.theme} Mode
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            id="btn-theme-light"
            onClick={() => updateSettings({ theme: 'light' })}
            className={`h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
              settings.theme === 'light'
                ? 'bg-zinc-100 border-zinc-400 text-zinc-900 shadow-xs ring-2 ring-emerald-500'
                : 'border-zinc-200 text-zinc-500'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Light</span>
          </button>

          <button
            id="btn-theme-dark"
            onClick={() => updateSettings({ theme: 'dark' })}
            className={`h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
              settings.theme === 'dark'
                ? 'bg-zinc-800 border-zinc-600 text-white shadow-xs ring-2 ring-emerald-500'
                : 'border-zinc-800 text-zinc-500'
            }`}
          >
            <Moon className="w-4 h-4 text-indigo-400" />
            <span>Dark</span>
          </button>
        </div>
      </div>

      {/* Shop Profile Form */}
      <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b border-zinc-100 dark:border-zinc-800">
          <Store className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            Shop Details (On Receipts)
          </h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-2.5">
          <div>
            <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
              Shop Name *
            </label>
            <input
              id="input-settings-shop-name"
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                Phone Number
              </label>
              <input
                id="input-settings-shop-phone"
                type="text"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                Currency
              </label>
              <input
                id="input-settings-currency-symbol"
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
              Shop Address
            </label>
            <input
              id="input-settings-shop-address"
              type="text"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
              className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              id="btn-save-shop-settings"
              type="submit"
              className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Save Details</span>
            </button>
            {savedSuccess && (
              <span className="text-xs text-emerald-600 font-bold">
                Saved!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Offline Storage & Backup Management */}
      <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2 pb-1 border-b border-zinc-100 dark:border-zinc-800">
          <HardDrive className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            Offline Storage & Backups
          </h3>
        </div>

        <div className="flex items-start gap-2 p-2.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl text-[11px] text-zinc-600 dark:text-zinc-300">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>
            100% offline & stored locally on this phone. No internet needed to bill customers.
          </span>
        </div>

        {importStatus && (
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
            {importStatus}
          </div>
        )}

        {/* Full-width Thumb-friendly Backup Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            id="btn-export-backup-json"
            onClick={handleExportBackup}
            className="h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Backup</span>
          </button>

          <div>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileImport}
              className="hidden"
            />
            <button
              id="btn-trigger-import-json"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <Upload className="w-4 h-4 text-teal-600" />
              <span>Import Backup</span>
            </button>
          </div>
        </div>

        {/* Wipe & Reset */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
          <button
            id="btn-reseed-sample-data"
            onClick={() => {
              if (confirm('Clear and reset all app data to start fresh?')) {
                resetData();
              }
            }}
            className="flex-1 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1 active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset to Blank</span>
          </button>

          <button
            id="btn-open-erase-data-confirm"
            onClick={() => setIsEraseConfirmOpen(true)}
            className="h-10 px-3 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1 active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Erase All</span>
          </button>
        </div>
      </div>

      {/* Erase All Confirmation Modal */}
      {isEraseConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-xs w-full p-4 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-center text-zinc-900 dark:text-zinc-100">
              Erase All Data?
            </h4>
            <p className="text-xs text-center text-zinc-500">
              Permanently delete all products, bills, and customers from this device.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setIsEraseConfirmOpen(false)}
                className="flex-1 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-erase-all"
                onClick={() => {
                  resetData();
                  setIsEraseConfirmOpen(false);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Yes, Erase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
