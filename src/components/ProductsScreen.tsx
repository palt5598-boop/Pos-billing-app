import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Barcode,
  Edit2,
  Trash2,
  AlertTriangle,
  Truck,
  X,
  Camera,
  Calendar,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Product } from '../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';

export const ProductsScreen: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    purchases,
    addVendorPurchase,
    settings,
  } = useShop();

  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'purchases'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');

  // Add / Edit Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodFormName, setProdFormName] = useState('');
  const [prodFormBarcode, setProdFormBarcode] = useState('');
  const [prodFormSellPrice, setProdFormSellPrice] = useState('');
  const [prodFormCostPrice, setProdFormCostPrice] = useState('');
  const [prodFormStock, setProdFormStock] = useState('10');
  const [prodFormLowThreshold, setProdFormLowThreshold] = useState('5');

  // Scanner Modal for Product Form barcode
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Vendor Purchase Modal State
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseVendorName, setPurchaseVendorName] = useState('');
  const [purchaseVendorContact, setPurchaseVendorContact] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<
    { productId: string; productName: string; qty: number; costPerUnit: number }[]
  >([]);
  const [selectedAddPurchaseProdId, setSelectedAddPurchaseProdId] = useState('');
  const [selectedAddPurchaseQty, setSelectedAddPurchaseQty] = useState('10');
  const [selectedAddPurchaseCost, setSelectedAddPurchaseCost] = useState('');

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    let list = products;

    if (filterStock === 'low') {
      list = list.filter((p) => p.stock <= p.lowStockThreshold && p.stock > 0);
    } else if (filterStock === 'out') {
      list = list.filter((p) => p.stock <= 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }

    return list;
  }, [products, filterStock, searchQuery]);

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= p.lowStockThreshold && p.stock > 0).length,
    [products]
  );
  const outOfStockCount = useMemo(
    () => products.filter((p) => p.stock <= 0).length,
    [products]
  );

  // Handle open add modal
  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    setProdFormName('');
    setProdFormBarcode('');
    setProdFormSellPrice('');
    setProdFormCostPrice('');
    setProdFormStock('10');
    setProdFormLowThreshold('5');
    setIsProductModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setProdFormName(prod.name);
    setProdFormBarcode(prod.barcode || '');
    setProdFormSellPrice(prod.sellingPrice.toString());
    setProdFormCostPrice(prod.costPrice.toString());
    setProdFormStock(prod.stock.toString());
    setProdFormLowThreshold(prod.lowStockThreshold.toString());
    setIsProductModalOpen(true);
  };

  // Save Product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodFormName.trim() || !prodFormSellPrice) return;

    const sell = parseFloat(prodFormSellPrice) || 0;
    const cost = parseFloat(prodFormCostPrice) || Math.round(sell * 0.8);
    const stock = parseInt(prodFormStock) || 0;
    const threshold = parseInt(prodFormLowThreshold) || 5;
    const barcode = prodFormBarcode.trim() || undefined;

    if (editingProductId) {
      updateProduct(editingProductId, {
        name: prodFormName.trim(),
        barcode,
        sellingPrice: sell,
        costPrice: cost,
        stock,
        lowStockThreshold: threshold,
      });
    } else {
      addProduct({
        name: prodFormName.trim(),
        barcode,
        sellingPrice: sell,
        costPrice: cost,
        stock,
        lowStockThreshold: threshold,
      });
    }

    setIsProductModalOpen(false);
  };

  // Vendor Purchase line addition
  const handleAddPurchaseLine = () => {
    if (!selectedAddPurchaseProdId) return;
    const targetProduct = products.find((p) => p.id === selectedAddPurchaseProdId);
    if (!targetProduct) return;

    const qty = parseInt(selectedAddPurchaseQty) || 1;
    const cost = parseFloat(selectedAddPurchaseCost) || targetProduct.costPrice;

    setPurchaseItems((prev) => [
      ...prev,
      {
        productId: targetProduct.id,
        productName: targetProduct.name,
        qty,
        costPerUnit: cost,
      },
    ]);

    setSelectedAddPurchaseProdId('');
    setSelectedAddPurchaseQty('10');
    setSelectedAddPurchaseCost('');
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseVendorName.trim() || purchaseItems.length === 0) return;

    addVendorPurchase({
      vendorName: purchaseVendorName.trim(),
      vendorContact: purchaseVendorContact.trim() || undefined,
      items: purchaseItems,
    });

    setIsPurchaseModalOpen(false);
    setPurchaseVendorName('');
    setPurchaseVendorContact('');
    setPurchaseItems([]);
  };

  return (
    <div className="max-w-md mx-auto px-3 pt-2 pb-28 space-y-2.5">
      {/* SubTab Toggle & Add Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          <button
            id="subtab-inventory"
            onClick={() => setActiveSubTab('inventory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'inventory'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Items ({products.length})
          </button>
          <button
            id="subtab-purchases"
            onClick={() => setActiveSubTab('purchases')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'purchases'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Vendor ({purchases.length})
          </button>
        </div>

        {activeSubTab === 'inventory' ? (
          <button
            id="btn-open-add-product"
            onClick={handleOpenAddProduct}
            className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        ) : (
          <button
            id="btn-open-add-purchase"
            onClick={() => {
              setPurchaseItems([]);
              setPurchaseVendorName('');
              setIsPurchaseModalOpen(true);
            }}
            className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Log Stock</span>
          </button>
        )}
      </div>

      {activeSubTab === 'inventory' ? (
        <>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              id="input-product-search-inventory"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or barcode..."
              className="w-full h-11 pl-9 pr-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFilterStock('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                filterStock === 'all'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setFilterStock('low')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                filterStock === 'low'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low ({lowStockCount})</span>
            </button>
            <button
              onClick={() => setFilterStock('out')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                filterStock === 'out'
                  ? 'bg-rose-600 text-white'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-rose-600 dark:text-rose-400'
              }`}
            >
              Out ({outOfStockCount})
            </button>
          </div>

          {/* Single-Column Mobile Product Card List */}
          <div className="space-y-2">
            {filteredProducts.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center text-zinc-400">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  No products found
                </p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isLow = p.stock <= p.lowStockThreshold && p.stock > 0;
                const isOut = p.stock <= 0;
                const margin = p.sellingPrice - p.costPrice;

                return (
                  <div
                    key={p.id}
                    id={`product-card-${p.id}`}
                    className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {p.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono mt-0.5">
                        <span>{p.barcode ? `#${p.barcode}` : 'No barcode'}</span>
                        <span>•</span>
                        <span
                          className={`font-bold ${
                            isOut
                              ? 'text-rose-600 dark:text-rose-400'
                              : isLow
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : `Stock: ${p.stock}`}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-2">
                        <span>
                          Cost: <strong className="font-mono">{settings.currencySymbol}{p.costPrice}</strong>
                        </span>
                        <span>
                          Profit: <strong className="text-emerald-600 font-mono">+{settings.currencySymbol}{margin}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-base font-black font-mono text-zinc-900 dark:text-zinc-100">
                          {settings.currencySymbol}{p.sellingPrice}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          id={`btn-edit-prod-${p.id}`}
                          onClick={() => handleOpenEditProduct(p)}
                          className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center active:scale-90 transition-transform"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          id={`btn-delete-prod-${p.id}`}
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-rose-500 flex items-center justify-center active:scale-90 transition-transform"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Vendor Purchases Log View */
        <div className="space-y-2">
          {purchases.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center text-zinc-400">
              <Truck className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-bold">No purchase logs yet</p>
              <p className="text-[11px] mt-1">
                Tap &quot;Log Stock&quot; to record deliveries from suppliers.
              </p>
            </div>
          ) : (
            purchases.map((purchase) => {
              const totalItemsCount = purchase.items.reduce((acc, i) => acc + i.qty, 0);
              return (
                <div
                  key={purchase.id}
                  className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {purchase.vendorName}
                      </h4>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        {new Date(purchase.date).toLocaleDateString('en-IN')}
                        {purchase.vendorContact ? ` • ${purchase.vendorContact}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-black font-mono text-zinc-900 dark:text-zinc-100">
                      {settings.currencySymbol}{purchase.totalCost}
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-500 bg-zinc-50 dark:bg-zinc-800/60 p-2 rounded-xl">
                    <span className="font-semibold">{totalItemsCount} units total:</span>{' '}
                    {purchase.items.map((i) => `${i.productName} (${i.qty})`).join(', ')}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {editingProductId ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Product Name *
                </label>
                <input
                  id="input-prod-form-name"
                  type="text"
                  required
                  placeholder="Enter product name"
                  value={prodFormName}
                  onChange={(e) => setProdFormName(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Barcode (Optional)
                </label>
                <div className="flex gap-1.5">
                  <input
                    id="input-prod-form-barcode"
                    type="text"
                    placeholder="Type or scan barcode..."
                    value={prodFormBarcode}
                    onChange={(e) => setProdFormBarcode(e.target.value)}
                    className="flex-1 h-10 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="h-10 px-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Scan</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Selling Price *
                  </label>
                  <input
                    id="input-prod-form-sell-price"
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 140"
                    value={prodFormSellPrice}
                    onChange={(e) => setProdFormSellPrice(e.target.value)}
                    className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Cost Price *
                  </label>
                  <input
                    id="input-prod-form-cost-price"
                    type="number"
                    step="any"
                    placeholder="e.g. 115"
                    value={prodFormCostPrice}
                    onChange={(e) => setProdFormCostPrice(e.target.value)}
                    className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Initial Stock
                  </label>
                  <input
                    id="input-prod-form-stock"
                    type="number"
                    value={prodFormStock}
                    onChange={(e) => setProdFormStock(e.target.value)}
                    className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Alert Threshold
                  </label>
                  <input
                    id="input-prod-form-threshold"
                    type="number"
                    value={prodFormLowThreshold}
                    onChange={(e) => setProdFormLowThreshold(e.target.value)}
                    className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-product-submit"
                  type="submit"
                  className="flex-2 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs active:scale-95 transition-transform"
                >
                  {editingProductId ? 'Update Item' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Purchase Modal */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Log Stock Purchase
              </h3>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Vendor Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahavir Trading Agency"
                  value={purchaseVendorName}
                  onChange={(e) => setPurchaseVendorName(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Vendor Contact (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9822012345"
                  value={purchaseVendorContact}
                  onChange={(e) => setPurchaseVendorContact(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
                />
              </div>

              {/* Add item to purchase */}
              <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2">
                <span className="text-[10px] font-bold uppercase text-zinc-400">
                  Select Item to Add
                </span>
                <select
                  value={selectedAddPurchaseProdId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedAddPurchaseProdId(id);
                    const p = products.find((x) => x.id === id);
                    if (p) setSelectedAddPurchaseCost(p.costPrice.toString());
                  }}
                  className="w-full h-9 px-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                >
                  <option value="">Select product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stock})
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={selectedAddPurchaseQty}
                    onChange={(e) => setSelectedAddPurchaseQty(e.target.value)}
                    className="h-9 px-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-mono"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Cost per unit"
                    value={selectedAddPurchaseCost}
                    onChange={(e) => setSelectedAddPurchaseCost(e.target.value)}
                    className="h-9 px-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-mono"
                  />
                </div>

                <button
                  type="button"
                  disabled={!selectedAddPurchaseProdId}
                  onClick={handleAddPurchaseLine}
                  className="w-full h-8 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold rounded-lg disabled:opacity-40"
                >
                  + Add to Delivery
                </button>
              </div>

              {/* Items List in Delivery */}
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {purchaseItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                  >
                    <div>
                      <div className="font-bold">{item.productName}</div>
                      <div className="text-[10px] text-zinc-400">
                        {item.qty} units @ {settings.currencySymbol}{item.costPerUnit}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPurchaseItems((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={purchaseItems.length === 0}
                  className="flex-2 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black disabled:opacity-50"
                >
                  Save & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-xs w-full p-4 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Delete Product?
            </h4>
            <p className="text-xs text-zinc-500">
              This product will be removed from your catalog.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteProduct(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal for Product Form */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onScanSuccess={(code) => {
          setProdFormBarcode(code);
          setIsScannerOpen(false);
        }}
        onClose={() => setIsScannerOpen(false)}
        existingProducts={products}
      />
    </div>
  );
};
