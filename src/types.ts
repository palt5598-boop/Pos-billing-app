export interface Product {
  id: string;
  name: string;
  barcode?: string | null;
  sellingPrice: number;
  costPrice: number;
  stock: number;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

export type PaymentMode = 'Cash' | 'UPI' | 'Card';

export interface CartItem {
  productId: string;
  name: string;
  barcode?: string | null;
  sellingPrice: number;
  costPrice: number;
  qty: number;
  currentStock: number;
}

export interface BillItem {
  productId: string;
  name: string;
  priceAtSale: number;
  costPrice: number;
  qty: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  dateTime: string;
  customerId?: string | null;
  customerName?: string;
  customerPhone?: string;
  paymentMode: PaymentMode;
  items: BillItem[];
  total: number;
  totalCost: number;
  profit: number;
}

export interface VendorPurchaseItem {
  productId: string;
  productName: string;
  qty: number;
  costPerUnit: number;
}

export interface VendorPurchase {
  id: string;
  vendorName: string;
  vendorContact?: string;
  dateTime: string;
  items: VendorPurchaseItem[];
  totalCost: number;
}

export interface ShopSettings {
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
  currencySymbol: string;
  theme: 'light' | 'dark';
}

export interface AppDataBackup {
  version: number;
  exportedAt: string;
  products: Product[];
  customers: Customer[];
  bills: Bill[];
  purchases: VendorPurchase[];
  settings: ShopSettings;
}
