import { Product, Customer, Bill, VendorPurchase, ShopSettings, AppDataBackup } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'cicada_products_v2',
  CUSTOMERS: 'cicada_customers_v1',
  BILLS: 'cicada_bills_v2',
  PURCHASES: 'cicada_purchases_v2',
  SETTINGS: 'cicada_settings_v1',
};

export const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'Green Valley Kirana & General Store',
  shopPhone: '+91 98765 43210',
  shopAddress: 'Shop #4, Main Market Road',
  currencySymbol: '₹',
  theme: 'light',
};

// Clean slate: No demo/seed products
export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Ramesh Sharma',
    phone: '9876543210',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cust-2',
    name: 'Pooja Verma',
    phone: '9812345678',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_PURCHASES: VendorPurchase[] = [];

export function loadStoredProducts(): Product[] {
  try {
    // Clear legacy v1 data if present so demo products do not persist
    if (typeof window !== 'undefined' && window.localStorage) {
      if (localStorage.getItem('cicada_products_v1')) {
        localStorage.removeItem('cicada_products_v1');
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      saveProducts([]);
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveProducts(products: Product[]): void {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

export function loadStoredCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!raw) {
      saveCustomers(INITIAL_CUSTOMERS);
      return INITIAL_CUSTOMERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CUSTOMERS;
  }
}

export function saveCustomers(customers: Customer[]): void {
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
}

export function loadStoredBills(): Bill[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (localStorage.getItem('cicada_bills_v1')) {
        localStorage.removeItem('cicada_bills_v1');
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.BILLS);
    if (!raw) {
      saveBills([]);
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveBills(bills: Bill[]): void {
  localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
}

export function loadStoredPurchases(): VendorPurchase[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (localStorage.getItem('cicada_purchases_v1')) {
        localStorage.removeItem('cicada_purchases_v1');
      }
    }
    const raw = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    if (!raw) {
      savePurchases([]);
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function savePurchases(purchases: VendorPurchase[]): void {
  localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
}

export function loadStoredSettings(): ShopSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: ShopSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function exportFullBackup(): void {
  const data: AppDataBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    products: loadStoredProducts(),
    customers: loadStoredCustomers(),
    bills: loadStoredBills(),
    purchases: loadStoredPurchases(),
    settings: loadStoredSettings(),
  };

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateTag = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `cicada-pos-backup-${dateTag}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function restoreBackupData(backupData: AppDataBackup): boolean {
  if (!backupData || !Array.isArray(backupData.products) || !Array.isArray(backupData.bills)) {
    throw new Error('Invalid backup file format.');
  }

  saveProducts(backupData.products);
  saveCustomers(backupData.customers || []);
  saveBills(backupData.bills);
  savePurchases(backupData.purchases || []);
  if (backupData.settings) {
    saveSettings(backupData.settings);
  }
  return true;
}

export function clearAllAppData(): void {
  localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
  localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
  localStorage.removeItem(STORAGE_KEYS.BILLS);
  localStorage.removeItem(STORAGE_KEYS.PURCHASES);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem('cicada_products_v1');
  localStorage.removeItem('cicada_bills_v1');
  localStorage.removeItem('cicada_purchases_v1');
}
