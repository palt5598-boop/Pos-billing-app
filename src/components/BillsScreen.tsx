import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Eye,
  Edit,
  Trash2,
  Share2,
  Plus,
  Minus,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Bill, BillItem, PaymentMode } from '../types';
import { BillReceiptModal } from './BillReceiptModal';

export const BillsScreen: React.FC = () => {
  const { bills, deleteBill, updateBill, products, customers, settings } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Receipt Modal State
  const [activeReceiptBill, setActiveReceiptBill] = useState<Bill | null>(null);

  // Edit Bill Modal State
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [editItems, setEditItems] = useState<BillItem[]>([]);
  const [editPaymentMode, setEditPaymentMode] = useState<PaymentMode>('Cash');
  const [editCustomerId, setEditCustomerId] = useState<string | null>(null);
  const [addProdIdToBill, setAddProdIdToBill] = useState('');

  // Delete Confirmation State
  const [deleteConfirmBillId, setDeleteConfirmBillId] = useState<string | null>(null);

  // Filter bills
  const filteredBills = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 86400000;
    const thirtyDaysAgo = now.getTime() - 30 * 86400000;

    let result = bills;

    if (selectedDateFilter === 'today') {
      result = result.filter((b) => new Date(b.dateTime).getTime() >= startOfToday);
    } else if (selectedDateFilter === 'week') {
      result = result.filter((b) => new Date(b.dateTime).getTime() >= sevenDaysAgo);
    } else if (selectedDateFilter === 'month') {
      result = result.filter((b) => new Date(b.dateTime).getTime() >= thirtyDaysAgo);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.billNumber.toLowerCase().includes(q) ||
          (b.customerName && b.customerName.toLowerCase().includes(q)) ||
          (b.customerPhone && b.customerPhone.includes(q)) ||
          b.paymentMode.toLowerCase().includes(q)
      );
    }

    return [...result].sort(
      (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
    );
  }, [bills, selectedDateFilter, searchQuery]);

  // Open Edit Bill Modal
  const handleOpenEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setEditItems([...bill.items]);
    setEditPaymentMode(bill.paymentMode);
    setEditCustomerId(bill.customerId || null);
    setAddProdIdToBill('');
  };

  const handleUpdateEditItemQty = (productId: string, delta: number) => {
    setEditItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (!existing) return prev;
      const nextQty = existing.qty + delta;
      if (nextQty <= 0) {
        return prev.filter((i) => i.productId !== productId);
      }
      return prev.map((i) => (i.productId === productId ? { ...i, qty: nextQty } : i));
    });
  };

  const handleAddProductToExistingBill = () => {
    if (!addProdIdToBill) return;
    const prod = products.find((p) => p.id === addProdIdToBill);
    if (!prod) return;

    setEditItems((prev) => {
      const existing = prev.find((i) => i.productId === prod.id);
      if (existing) {
        return prev.map((i) => (i.productId === prod.id ? { ...i, qty: i.qty + 1 } : i));
      } else {
        return [
          ...prev,
          {
            productId: prod.id,
            name: prod.name,
            priceAtSale: prod.sellingPrice,
            costPrice: prod.costPrice,
            qty: 1,
          },
        ];
      }
    });

    setAddProdIdToBill('');
  };

  const handleSaveEditedBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill || editItems.length === 0) return;

    const cust = editCustomerId ? customers.find((c) => c.id === editCustomerId) : null;

    const updated: Bill = {
      ...editingBill,
      customerId: editCustomerId,
      customerName: cust ? cust.name : 'Walk-in customer',
      customerPhone: cust ? cust.phone : '',
      paymentMode: editPaymentMode,
      items: editItems,
    };

    updateBill(updated);
    setEditingBill(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmBillId) return;
    deleteBill(deleteConfirmBillId);
    setDeleteConfirmBillId(null);
    if (activeReceiptBill?.id === deleteConfirmBillId) {
      setActiveReceiptBill(null);
    }
  };

  return (
    <div className="max-w-md mx-auto px-3 pt-2 pb-28 space-y-2.5">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        <input
          id="input-bills-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Bill #, customer or mode..."
          className="w-full h-11 pl-9 pr-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
        />
      </div>

      {/* Date Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {(['all', 'today', 'week', 'month'] as const).map((filterKey) => (
          <button
            key={filterKey}
            onClick={() => setSelectedDateFilter(filterKey)}
            className={`px-3 py-1.5 rounded-xl font-bold capitalize whitespace-nowrap transition-all ${
              selectedDateFilter === filterKey
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            {filterKey === 'all'
              ? `All Bills (${bills.length})`
              : filterKey === 'today'
              ? 'Today'
              : filterKey === 'week'
              ? 'Last 7 Days'
              : 'Last 30 Days'}
          </button>
        ))}
      </div>

      {/* Single-Column Mobile Bill Cards */}
      <div className="space-y-2">
        {filteredBills.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center text-zinc-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              No bills found
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              Create a bill on the Bill tab.
            </p>
          </div>
        ) : (
          filteredBills.map((bill) => {
            const dateFormatted = new Date(bill.dateTime).toLocaleString('en-IN', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });
            const totalUnits = bill.items.reduce((s, i) => s + i.qty, 0);

            return (
              <div
                key={bill.id}
                id={`bill-card-${bill.id}`}
                className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2"
              >
                {/* Top Row: Bill # & Total */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
                      #{bill.billNumber}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {dateFormatted}
                    </span>
                  </div>
                  <span className="font-mono font-black text-base text-zinc-900 dark:text-zinc-100">
                    {settings.currencySymbol}{bill.total}
                  </span>
                </div>

                {/* Middle Row: Customer + Items + Payment Mode */}
                <div className="flex items-center justify-between text-xs text-zinc-500 pt-0.5">
                  <div className="truncate pr-2">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      {bill.customerName || 'Walk-in customer'}
                    </span>
                    <span className="text-[11px] text-zinc-400 ml-1.5">
                      ({totalUnits} items)
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shrink-0 ${
                      bill.paymentMode === 'Cash'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : bill.paymentMode === 'UPI'
                        ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
                        : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
                    }`}
                  >
                    {bill.paymentMode}
                  </span>
                </div>

                {/* Bottom Row: Full-width Thumb-friendly Action Buttons */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    id={`btn-view-receipt-${bill.id}`}
                    onClick={() => setActiveReceiptBill(bill)}
                    className="flex-1 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Receipt & Share</span>
                  </button>

                  <button
                    id={`btn-edit-bill-${bill.id}`}
                    onClick={() => handleOpenEditBill(bill)}
                    className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center active:scale-95 transition-transform"
                    title="Edit Bill"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id={`btn-delete-bill-${bill.id}`}
                    onClick={() => setDeleteConfirmBillId(bill.id)}
                    className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-rose-500 flex items-center justify-center active:scale-95 transition-transform"
                    title="Delete Bill"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Bill Modal */}
      {editingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Edit Bill #{editingBill.billNumber}
              </h3>
              <button
                onClick={() => setEditingBill(null)}
                className="text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedBill} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1">
                    Customer
                  </label>
                  <select
                    value={editCustomerId || ''}
                    onChange={(e) => setEditCustomerId(e.target.value || null)}
                    className="w-full h-9 px-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                  >
                    <option value="">Walk-in</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={editPaymentMode}
                    onChange={(e) => setEditPaymentMode(e.target.value as PaymentMode)}
                    className="w-full h-9 px-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>

              {/* Items List in Bill */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {editItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-1">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {item.name}
                      </p>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {settings.currencySymbol}{item.priceAtSale}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateEditItemQty(item.productId, -1)}
                        className="w-6 h-6 flex items-center justify-center text-zinc-500"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-mono font-bold text-xs">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateEditItemQty(item.productId, 1)}
                        className="w-6 h-6 flex items-center justify-center text-zinc-500"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-xs font-bold text-zinc-500">Total:</span>
                <span className="text-lg font-black text-emerald-600 font-mono">
                  {settings.currencySymbol}
                  {editItems.reduce((acc, i) => acc + i.priceAtSale * i.qty, 0)}
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingBill(null)}
                  className="flex-1 h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editItems.length === 0}
                  className="flex-2 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs"
                >
                  Save & Adjust Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmBillId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-xs w-full p-4 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Delete Bill & Revert Stock?
            </h4>
            <p className="text-xs text-zinc-500">
              Items in this bill will be returned to your inventory stock.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setDeleteConfirmBillId(null)}
                className="flex-1 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <BillReceiptModal
        isOpen={!!activeReceiptBill}
        bill={activeReceiptBill}
        settings={settings}
        onClose={() => setActiveReceiptBill(null)}
      />
    </div>
  );
};
