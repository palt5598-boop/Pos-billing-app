import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Customer,
  Bill,
  CartItem,
  VendorPurchase,
  ShopSettings,
  PaymentMode,
  AppDataBackup,
} from '../types';
import {
  loadStoredProducts,
  saveProducts,
  loadStoredCustomers,
  saveCustomers,
  loadStoredBills,
  saveBills,
  loadStoredPurchases,
  savePurchases,
  loadStoredSettings,
  saveSettings,
  clearAllAppData,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  DEFAULT_SETTINGS,
} from '../utils/storage';

export type ActiveTab = 'billing' | 'inventory' | 'bills' | 'customers' | 'reports' | 'settings';

interface ShopContextType {
  products: Product[];
  customers: Customer[];
  bills: Bill[];
  purchases: VendorPurchase[];
  settings: ShopSettings;
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  // Product actions
  addProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  // Customer actions
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  // Cart & Billing actions
  addToCart: (product: Product, quantity?: number) => boolean;
  updateCartQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  completeCheckout: (customerId: string | null, paymentMode: PaymentMode) => Bill;
  // Bill management & Stock Reconciliation
  updateBill: (bill: Bill) => void;
  deleteBill: (billId: string) => void;
  // Purchases
  addVendorPurchase: (purchaseData: {
    vendorName: string;
    vendorContact?: string;
    items: { productId: string; productName: string; qty: number; costPerUnit: number }[];
  }) => VendorPurchase;
  // Settings & Storage
  updateSettings: (newSettings: Partial<ShopSettings>) => void;
  reloadFromBackup: (backup: AppDataBackup) => void;
  resetData: () => void;
  reseedData: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => loadStoredProducts());
  const [customers, setCustomers] = useState<Customer[]>(() => loadStoredCustomers());
  const [bills, setBills] = useState<Bill[]>(() => loadStoredBills());
  const [purchases, setPurchases] = useState<VendorPurchase[]>(() => loadStoredPurchases());
  const [settings, setSettings] = useState<ShopSettings>(() => loadStoredSettings());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('billing');

  // Synchronize theme to document element
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Save changes to localStorage
  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    saveCustomers(customers);
  }, [customers]);

  useEffect(() => {
    saveBills(bills);
  }, [bills]);

  useEffect(() => {
    savePurchases(purchases);
  }, [purchases]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Product Methods
  const addProduct = (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [newProduct, ...products];
    setProducts(updated);
    saveProducts(updated);
    return newProduct;
  };

  const updateProduct = (id: string, data: Partial<Product>) => {
    const updated = products.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          ...data,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    setProducts(updated);
    saveProducts(updated);

    // Also update in cart if present
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === id) {
          return {
            ...item,
            name: data.name ?? item.name,
            sellingPrice: data.sellingPrice ?? item.sellingPrice,
            costPrice: data.costPrice ?? item.costPrice,
            currentStock: data.stock ?? item.currentStock,
          };
        }
        return item;
      })
    );
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    saveProducts(updated);
    setCart((prev) => prev.filter((item) => item.productId !== id));
  };

  // Customer Methods
  const addCustomer = (data: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const newCustomer: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    saveCustomers(updated);
    return newCustomer;
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    const updated = customers.map((c) => (c.id === id ? { ...c, ...data } : c));
    setCustomers(updated);
    saveCustomers(updated);
  };

  const deleteCustomer = (id: string) => {
    const updated = customers.filter((c) => c.id !== id);
    setCustomers(updated);
    saveCustomers(updated);
  };

  // Cart Methods
  const addToCart = (product: Product, quantity: number = 1): boolean => {
    let added = false;
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.productId === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].qty += quantity;
        added = true;
        return next;
      } else {
        added = true;
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            barcode: product.barcode,
            sellingPrice: product.sellingPrice,
            costPrice: product.costPrice,
            qty: quantity,
            currentStock: product.stock,
          },
        ];
      }
    });
    return added;
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, qty } : item))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Complete Checkout & Stock Reduction
  const completeCheckout = (customerId: string | null, paymentMode: PaymentMode): Bill => {
    if (cart.length === 0) {
      throw new Error('Cart is empty');
    }

    // Determine customer info
    const customer = customerId ? customers.find((c) => c.id === customerId) : null;
    const customerName = customer ? customer.name : 'Walk-in customer';
    const customerPhone = customer ? customer.phone : '';

    // Calculate totals & profit
    let total = 0;
    let totalCost = 0;
    const billItems = cart.map((item) => {
      const lineTotal = item.sellingPrice * item.qty;
      const lineCost = item.costPrice * item.qty;
      total += lineTotal;
      totalCost += lineCost;
      return {
        productId: item.productId,
        name: item.name,
        priceAtSale: item.sellingPrice,
        costPrice: item.costPrice,
        qty: item.qty,
      };
    });

    const profit = total - totalCost;

    // Create next bill number
    const nextNum = bills.length > 0 ? 1000 + bills.length + 1 : 1001;
    const billNumber = `BILL-${nextNum}`;

    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      billNumber,
      dateTime: new Date().toISOString(),
      customerId: customerId || null,
      customerName,
      customerPhone,
      paymentMode,
      items: billItems,
      total,
      totalCost,
      profit,
    };

    // Deduct stock for sold items
    const updatedProducts = products.map((p) => {
      const soldItem = cart.find((item) => item.productId === p.id);
      if (soldItem) {
        return {
          ...p,
          stock: Math.max(0, p.stock - soldItem.qty),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    const updatedBills = [newBill, ...bills];
    setBills(updatedBills);
    saveBills(updatedBills);

    // Clear cart
    clearCart();

    return newBill;
  };

  // Stock Reconciliation for Bill Editing
  const updateBill = (updatedBill: Bill) => {
    const oldBill = bills.find((b) => b.id === updatedBill.id);
    if (!oldBill) return;

    // Reconcile stock
    // 1. Return old quantities back to stock
    // 2. Deduct new quantities from stock
    const productStockDeltas: Record<string, number> = {};

    // Old items returned (+qty)
    oldBill.items.forEach((item) => {
      productStockDeltas[item.productId] = (productStockDeltas[item.productId] || 0) + item.qty;
    });

    // New items deducted (-qty)
    updatedBill.items.forEach((item) => {
      productStockDeltas[item.productId] = (productStockDeltas[item.productId] || 0) - item.qty;
    });

    const updatedProducts = products.map((p) => {
      const delta = productStockDeltas[p.id];
      if (delta !== undefined && delta !== 0) {
        return {
          ...p,
          stock: Math.max(0, p.stock + delta),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    // Recalculate bill total, totalCost, and profit
    let total = 0;
    let totalCost = 0;
    updatedBill.items.forEach((item) => {
      total += item.priceAtSale * item.qty;
      totalCost += (item.costPrice || 0) * item.qty;
    });
    const finalBill: Bill = {
      ...updatedBill,
      total,
      totalCost,
      profit: total - totalCost,
    };

    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    const updatedBills = bills.map((b) => (b.id === finalBill.id ? finalBill : b));
    setBills(updatedBills);
    saveBills(updatedBills);
  };

  // Delete Bill & Revert Stock
  const deleteBill = (billId: string) => {
    const targetBill = bills.find((b) => b.id === billId);
    if (!targetBill) return;

    // Return sold items to stock
    const updatedProducts = products.map((p) => {
      const soldItem = targetBill.items.find((item) => item.productId === p.id);
      if (soldItem) {
        return {
          ...p,
          stock: p.stock + soldItem.qty,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    const updatedBills = bills.filter((b) => b.id !== billId);
    setBills(updatedBills);
    saveBills(updatedBills);
  };

  // Vendor Purchases & Automatic Stock Addition
  const addVendorPurchase = (purchaseData: {
    vendorName: string;
    vendorContact?: string;
    items: { productId: string; productName: string; qty: number; costPerUnit: number }[];
  }): VendorPurchase => {
    let totalCost = 0;
    purchaseData.items.forEach((item) => {
      totalCost += item.costPerUnit * item.qty;
    });

    const newPurchase: VendorPurchase = {
      id: `purch-${Date.now()}`,
      vendorName: purchaseData.vendorName,
      vendorContact: purchaseData.vendorContact,
      dateTime: new Date().toISOString(),
      items: purchaseData.items,
      totalCost,
    };

    // Increase product stock automatically
    const stockAdditions: Record<string, { qty: number; cost: number }> = {};
    purchaseData.items.forEach((item) => {
      stockAdditions[item.productId] = {
        qty: (stockAdditions[item.productId]?.qty || 0) + item.qty,
        cost: item.costPerUnit,
      };
    });

    const updatedProducts = products.map((p) => {
      const added = stockAdditions[p.id];
      if (added) {
        return {
          ...p,
          stock: p.stock + added.qty,
          costPrice: added.cost > 0 ? added.cost : p.costPrice,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    const updatedPurchases = [newPurchase, ...purchases];
    setPurchases(updatedPurchases);
    savePurchases(updatedPurchases);

    return newPurchase;
  };

  // Settings & Theme
  const updateSettings = (newSettings: Partial<ShopSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...newSettings };
      saveSettings(merged);
      return merged;
    });
  };

  const reloadFromBackup = (backup: AppDataBackup) => {
    setProducts(backup.products);
    setCustomers(backup.customers || []);
    setBills(backup.bills || []);
    setPurchases(backup.purchases || []);
    if (backup.settings) {
      setSettings(backup.settings);
    }
  };

  const resetData = () => {
    clearAllAppData();
    setProducts([]);
    setCustomers([]);
    setBills([]);
    setPurchases([]);
    setCart([]);
  };

  const reseedData = () => {
    clearAllAppData();
    setProducts(INITIAL_PRODUCTS);
    saveProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    saveCustomers(INITIAL_CUSTOMERS);
    const initialBills = loadStoredBills();
    setBills(initialBills);
    setPurchases([]);
    setCart([]);
  };

  return (
    <ShopContext.Provider
      value={{
        products,
        customers,
        bills,
        purchases,
        settings,
        cart,
        isCartOpen,
        setIsCartOpen,
        activeTab,
        setActiveTab,
        addProduct,
        updateProduct,
        deleteProduct,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        completeCheckout,
        updateBill,
        deleteBill,
        addVendorPurchase,
        updateSettings,
        reloadFromBackup,
        resetData,
        reseedData,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
