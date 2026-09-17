import React from 'react';
import { ShopProvider, useShop } from './context/ShopContext';
import { Navbar } from './components/Navbar';
import { BillingScreen } from './components/BillingScreen';
import { ProductsScreen } from './components/ProductsScreen';
import { BillsScreen } from './components/BillsScreen';
import { CustomersScreen } from './components/CustomersScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { SettingsScreen } from './components/SettingsScreen';

const MainLayout: React.FC = () => {
  const { activeTab } = useShop();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1">
        {activeTab === 'billing' && <BillingScreen />}
        {activeTab === 'inventory' && <ProductsScreen />}
        {activeTab === 'bills' && <BillsScreen />}
        {activeTab === 'customers' && <CustomersScreen />}
        {activeTab === 'reports' && <ReportsScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <ShopProvider>
      <MainLayout />
    </ShopProvider>
  );
}
