import React, { useState, useMemo } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CheckCircle2,
  User,
  ArrowRight,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Package,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Product, PaymentMode, Bill } from '../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { BillReceiptModal } from './BillReceiptModal';

export const BillingScreen: React.FC = () => {
  const {
    products,
    customers,
    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    completeCheckout,
    addProduct,
    addCustomer,
    settings,
    setActiveTab,
  } = useShop();

  // Search & Scanner
  const [searchQuery, setSearchQuery] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Unknown Barcode Detected Modal State
  const [unknownBarcodePrompt, setUnknownBarcodePrompt] = useState<string | null>(null);
  const [newProdName, setNewProdName] = useState('');
  const [newProdSellPrice, setNewProdSellPrice] = useState('');
  const [newProdCostPrice, setNewProdCostPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('20');

  // Customer & Payment inside Cart
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<PaymentMode>('Cash');
  const [isQuickAddCustomerOpen, setIsQuickAddCustomerOpen] = useState(false);
  const [quickCustName, setQuickCustName] = useState('');
  const [quickCustPhone, setQuickCustPhone] = useState('');

  // Post Checkout Receipt Modal State
  const [completedBill, setCompletedBill] = useState<Bill | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Quick feedback toast
  const [scanToast, setScanToast] = useState<{ message: string; type: 'success' | 'warn' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warn' = 'success') => {
    setScanToast({ message, type });
    setTimeout(() => {
      setScanToast(null);
    }, 2400);
  };

  // Filter products strictly when the user is actively searching
  const matchingProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  // Cart calculations
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.sellingPrice * item.qty, 0);
  }, [cart]);

  const totalUnits = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }, [cart]);

  // Barcode Handler
  const handleBarcodeScanned = (scannedCode: string) => {
    setIsScannerOpen(false);
    const cleanCode = scannedCode.trim();

    // Check inventory for matching barcode
    const match = products.find((p) => p.barcode && p.barcode.trim() === cleanCode);

    if (match) {
      addToCart(match, 1);
      showToast(`Added ${match.name} (+1)`, 'success');
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } catch {
        // audio optional
      }
    } else {
      // Prompt to add product with barcode pre-filled
      setUnknownBarcodePrompt(cleanCode);
      setNewProdName('');
      setNewProdSellPrice('');
      setNewProdCostPrice('');
      setNewProdStock('20');
      showToast(`Unknown code: ${cleanCode}`, 'warn');
    }
  };

  // Add unknown product from scanned barcode
  const handleSaveUnknownProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdSellPrice) return;

    const sellPrice = parseFloat(newProdSellPrice) || 0;
    const costPrice = parseFloat(newProdCostPrice) || Math.round(sellPrice * 0.8);
    const stockQty = parseInt(newProdStock) || 10;

    const created = addProduct({
      name: newProdName.trim(),
      barcode: unknownBarcodePrompt || undefined,
      sellingPrice: sellPrice,
      costPrice: costPrice,
      stock: stockQty,
      lowStockThreshold: 5,
    });

    // Automatically add 1 unit to cart
    addToCart(created, 1);
    setUnknownBarcodePrompt(null);
    showToast(`Added ${created.name} to bill`, 'success');
  };

  // Quick Customer Creation
  const handleSaveQuickCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustName.trim()) return;

    const newCust = addCustomer({
      name: quickCustName.trim(),
      phone: quickCustPhone.trim(),
    });

    setSelectedCustomerId(newCust.id);
    setIsQuickAddCustomerOpen(false);
    setQuickCustName('');
    setQuickCustPhone('');
  };

  // Perform Final Checkout
  const handleFinalCheckout = () => {
    if (cart.length === 0) return;
    const newBill = completeCheckout(selectedCustomerId, selectedPaymentMode);
    setCompletedBill(newBill);
    setIsReceiptOpen(true);
  };

  const isUserSearching = searchQuery.trim().length > 0;

  return (
    <div className="max-w-md mx-auto px-3 pt-2 pb-24 space-y-2.5">
      {/* Toast notification banner */}
      {scanToast && (
        <div
          className={`fixed top-14 left-4 right-4 z-50 max-w-md mx-auto p-2.5 rounded-xl shadow-lg text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all animate-bounce ${
            scanToast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-amber-600 text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{scanToast.message}</span>
        </div>
      )}

      {/* Sticky Compact Search + Scan Bar */}
      <div className="sticky top-12 z-20 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-md pt-1 pb-1">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              id="input-product-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items or barcode..."
              className="w-full h-11 pl-9 pr-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Camera Barcode Scan Button */}
          <button
            id="btn-open-camera-scanner"
            onClick={() => setIsScannerOpen(true)}
            className="h-11 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-transform shrink-0"
            title="Scan Barcode"
          >
            <Barcode className="w-4 h-4" />
            <span>Scan</span>
          </button>
        </div>

        {/* Live Search Results / Empty Match Message (Only appears when user actually types) */}
        {isUserSearching && (
          <div className="mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-lg overflow-hidden max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
            {matchingProducts.length > 0 ? (
              matchingProducts.map((product) => (
                <div
                  key={product.id}
                  id={`search-result-${product.id}`}
                  onClick={() => {
                    addToCart(product, 1);
                    showToast(`Added ${product.name} (+1)`, 'success');
                    setSearchQuery('');
                  }}
                  className="p-2.5 flex items-center justify-between gap-2 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 active:bg-emerald-100/50 cursor-pointer transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {product.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                      <span className="font-mono">
                        {product.barcode ? `#${product.barcode}` : 'No barcode'}
                      </span>
                      <span>•</span>
                      <span>Stock: {product.stock}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs sm:text-sm font-black font-mono text-zinc-900 dark:text-zinc-100">
                      {settings.currencySymbol}{product.sellingPrice}
                    </span>
                    <button
                      id={`btn-add-search-${product.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product, 1);
                        showToast(`Added ${product.name} (+1)`, 'success');
                        setSearchQuery('');
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              ))
            ) : products.length === 0 ? (
              <div className="p-4 text-center space-y-2">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  No products yet — add one from the Products tab
                </p>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold inline-flex items-center gap-1"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Go to Items tab</span>
                </button>
              </div>
            ) : (
              <div className="p-3.5 text-center text-xs text-zinc-400">
                No matching products found for &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cart Container directly below Search & Scan bar */}
      <div
        id="new-bill-cart-section"
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden flex flex-col"
      >
        {/* Cart Header */}
        <div className="px-3.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShoppingCart className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-black text-zinc-900 dark:text-zinc-100 leading-tight">
                Current Bill
              </h2>
              <span className="text-[10px] text-zinc-400 leading-none">
                {totalUnits === 0 ? '0 items' : `${totalUnits} item${totalUnits > 1 ? 's' : ''}`}
              </span>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              id="btn-clear-cart"
              onClick={() => {
                if (confirm('Clear all items from this bill?')) {
                  clearCart();
                }
              }}
              className="text-xs text-rose-500 hover:text-rose-600 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1 active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Cart Items List or Compact Empty State */}
        <div className="p-3">
          {cart.length === 0 ? (
            <div className="py-7 px-4 text-center text-zinc-400 space-y-1.5">
              <ShoppingCart className="w-7 h-7 mx-auto opacity-30 text-zinc-400" />
              <p className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                Cart is empty
              </p>
              <p className="text-[11px] text-zinc-400">
                Scan a barcode or type in the search bar to add items
              </p>
            </div>
          ) : (
            <div className="space-y-2 divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {cart.map((item) => (
                <div
                  key={item.productId}
                  id={`cart-item-${item.productId}`}
                  className="pt-2 first:pt-0 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      {settings.currencySymbol}{item.sellingPrice} each
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Stepper with thumb-friendly targets */}
                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <button
                        onClick={() => updateCartQty(item.productId, item.qty - 1)}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center font-bold active:scale-90"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-xs">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.productId, item.qty + 1)}
                        className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold active:scale-90"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right font-mono font-black text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 w-14">
                      {settings.currencySymbol}{item.sellingPrice * item.qty}
                    </div>

                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="p-1 text-zinc-300 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg active:scale-90"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer & Checkout Controls (shown when cart has items) */}
        {cart.length > 0 && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5">
            {/* Customer Tagging */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 flex-1 min-w-0">
                <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <select
                  id="select-customer-cart"
                  value={selectedCustomerId || ''}
                  onChange={(e) => setSelectedCustomerId(e.target.value || null)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl py-1.5 px-2 text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                id="btn-quick-new-customer"
                onClick={() => setIsQuickAddCustomerOpen(true)}
                className="px-2.5 py-1.5 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold shrink-0 hover:bg-emerald-50 active:scale-95"
              >
                + New
              </button>
            </div>

            {/* Payment Mode Selector */}
            <div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Payment Mode
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Cash', 'UPI', 'Card'] as const).map((mode) => {
                  const isSelected = selectedPaymentMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      id={`btn-payment-${mode.toLowerCase()}`}
                      onClick={() => setSelectedPaymentMode(mode)}
                      className={`h-10 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all active:scale-95 ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-400/40'
                          : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {mode === 'Cash' && <Banknote className="w-3.5 h-3.5" />}
                      {mode === 'UPI' && <Smartphone className="w-3.5 h-3.5" />}
                      {mode === 'Card' && <CreditCard className="w-3.5 h-3.5" />}
                      <span>{mode}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Total and Big Thumb Checkout Button */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-zinc-500">Total Amount</span>
                <span className="text-lg sm:text-xl font-black font-mono text-zinc-900 dark:text-zinc-100">
                  {settings.currencySymbol}{cartTotal}
                </span>
              </div>

              <button
                id="btn-confirm-checkout-charge"
                onClick={handleFinalCheckout}
                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 transition-transform"
              >
                <span>COMPLETE BILL • {settings.currencySymbol}{cartTotal}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Customer Modal */}
      {isQuickAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-xs w-full p-4 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Add New Customer
            </h4>
            <form onSubmit={handleSaveQuickCustomer} className="space-y-3">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Customer Name *"
                  value={quickCustName}
                  onChange={(e) => setQuickCustName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                  autoFocus
                />
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={quickCustPhone}
                  onChange={(e) => setQuickCustPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickAddCustomerOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unknown Barcode Detected Modal */}
      {unknownBarcodePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-sm w-full p-4 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Barcode className="w-5 h-5" />
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                New Barcode Scanned
              </h4>
            </div>
            <p className="text-xs text-zinc-500">
              Barcode <strong className="font-mono text-zinc-800 dark:text-zinc-200">#{unknownBarcodePrompt}</strong> is not in your inventory. Add it below:
            </p>

            <form onSubmit={handleSaveUnknownProduct} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Product name"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-300 mb-1">
                    Selling Price *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={newProdSellPrice}
                    onChange={(e) => setNewProdSellPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-300 mb-1">
                    Cost Price
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={newProdCostPrice}
                    onChange={(e) => setNewProdCostPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-300 mb-1">
                  Initial Stock
                </label>
                <input
                  type="number"
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setUnknownBarcodePrompt(null)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Save & Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hardware / Camera Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onScanSuccess={handleBarcodeScanned}
        onClose={() => setIsScannerOpen(false)}
        existingProducts={products}
      />

      {/* Thermal Receipt & WhatsApp Modal */}
      <BillReceiptModal
        isOpen={isReceiptOpen}
        bill={completedBill}
        settings={settings}
        onClose={() => setIsReceiptOpen(false)}
      />
    </div>
  );
};
