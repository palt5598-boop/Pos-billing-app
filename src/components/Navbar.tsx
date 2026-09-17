import React from 'react';
import {
  Receipt,
  Package,
  History,
  BarChart3,
  MoreHorizontal,
  Moon,
  Sun,
  Store,
  ShoppingCart,
} from 'lucide-react';
import { useShop, ActiveTab } from '../context/ShopContext';
import { PWAInstallButton } from './PWAInstallButton';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    cart,
    setIsCartOpen,
    settings,
    updateSettings,
    products,
  } = useShop();

  const totalCartUnits = cart.reduce((acc, item) => acc + item.qty, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.sellingPrice * item.qty, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.lowStockThreshold).length;

  // 5 tabs max for mobile-first bottom bar
  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }[] = [
    {
      id: 'billing',
      label: 'Bill',
      icon: Receipt,
      badge: totalCartUnits > 0 ? totalCartUnits : undefined,
    },
    {
      id: 'inventory',
      label: 'Items',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    {
      id: 'bills',
      label: 'Bills',
      icon: History,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
    },
    {
      id: 'settings',
      label: 'More',
      icon: MoreHorizontal,
    },
  ];

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  return (
    <>
      {/* Compact Sticky Mobile Header (Single Row, ~46px height) */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-md mx-auto px-3.5 h-12 flex items-center justify-between">
          {/* Store Brand / Name */}
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Store className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-black tracking-tight text-zinc-900 dark:text-zinc-100 truncate leading-tight">
                {settings.shopName || 'CICADA POS'}
              </h1>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium leading-none">
                Offline Retail POS
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick Cart Indicator (Visible when cart has items) */}
            {totalCartUnits > 0 && (
              <button
                id="btn-header-quick-cart"
                onClick={() => {
                  if (activeTab !== 'billing') {
                    setActiveTab('billing');
                  }
                  setTimeout(() => {
                    document.getElementById('new-bill-cart-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 50);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-transform"
                title="Current Cart"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="font-mono">{settings.currencySymbol}{cartTotal}</span>
                <span className="text-[10px] bg-emerald-700 px-1 rounded-full">
                  {totalCartUnits}
                </span>
              </button>
            )}

            {/* PWA Install Button */}
            <PWAInstallButton variant="nav" />

            {/* Dark/Light Theme Toggle */}
            <button
              id="btn-toggle-theme"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-700" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Fixed Bottom Tab Bar (5 Icons Max, Mobile-First Thumb Friendly) */}
      <nav
        id="mobile-bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/98 dark:bg-zinc-900/98 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 pb-safe"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 h-14 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center h-full w-full select-none active:scale-95 transition-transform ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
                    }`}
                  />
                  {item.badge !== undefined && (
                    <span
                      className={`absolute -top-1.5 -right-2 text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center leading-none ${
                        item.id === 'inventory'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] mt-0.5 tracking-tight ${
                    isActive ? 'font-black' : 'font-medium'
                  }`}
                >
                  {item.label}
                </span>

                {/* Subtle active indicator bar */}
                {isActive && (
                  <span className="absolute bottom-0.5 w-6 h-0.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
