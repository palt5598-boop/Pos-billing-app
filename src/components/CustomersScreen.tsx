import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Edit2,
  Trash2,
  X,
  History,
  ArrowLeft,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Customer, Bill } from '../types';
import { BillReceiptModal } from './BillReceiptModal';

export const CustomersScreen: React.FC = () => {
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    bills,
    settings,
    setActiveTab,
  } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [custFormName, setCustFormName] = useState('');
  const [custFormPhone, setCustFormPhone] = useState('');

  // Delete Customer state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Customer bill history modal
  const [viewCustomerBills, setViewCustomerBills] = useState<Customer | null>(null);
  const [activeReceiptBill, setActiveReceiptBill] = useState<Bill | null>(null);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [customers, searchQuery]);

  const handleOpenAdd = () => {
    setEditingCustomerId(null);
    setCustFormName('');
    setCustFormPhone('');
    setIsCustomerModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomerId(customer.id);
    setCustFormName(customer.name);
    setCustFormPhone(customer.phone);
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custFormName.trim()) return;

    if (editingCustomerId) {
      updateCustomer(editingCustomerId, {
        name: custFormName.trim(),
        phone: custFormPhone.trim(),
      });
    } else {
      addCustomer({
        name: custFormName.trim(),
        phone: custFormPhone.trim(),
      });
    }
    setIsCustomerModalOpen(false);
  };

  const customerBillsList = useMemo(() => {
    if (!viewCustomerBills) return [];
    return bills.filter((b) => b.customerId === viewCustomerBills.id);
  }, [bills, viewCustomerBills]);

  return (
    <div className="max-w-md mx-auto px-3 pt-2 pb-28 space-y-2.5">
      {/* Top Header Row with Back Button */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setActiveTab('settings')}
          className="h-9 px-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>More</span>
        </button>

        <h2 className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100">
          Customers ({customers.length})
        </h2>

        <button
          id="btn-open-add-customer"
          onClick={handleOpenAdd}
          className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        <input
          id="input-customer-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customer name or phone..."
          className="w-full h-11 pl-9 pr-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
        />
      </div>

      {/* Customer Single Column Cards */}
      <div className="space-y-2">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center text-zinc-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              No customers found
            </p>
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const customerBills = bills.filter((b) => b.customerId === customer.id);
            const totalSpent = customerBills.reduce((sum, b) => sum + b.total, 0);

            return (
              <div
                key={customer.id}
                id={`customer-card-${customer.id}`}
                className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center shrink-0">
                      {customer.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {customer.name}
                      </h4>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                        <Phone className="w-3 h-3 text-zinc-400" />
                        <span>{customer.phone || 'No phone'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(customer)}
                      className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center active:scale-95"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(customer.id)}
                      className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-rose-500 flex items-center justify-center active:scale-95"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-400 text-[11px]">
                    {customerBills.length} bills • Total:{' '}
                    <strong className="text-emerald-600 font-mono">
                      {settings.currencySymbol}{totalSpent}
                    </strong>
                  </span>

                  {customerBills.length > 0 && (
                    <button
                      onClick={() => setViewCustomerBills(customer)}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5"
                    >
                      <History className="w-3 h-3" />
                      <span>Past Bills</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-xs rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {editingCustomerId ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Name *
                </label>
                <input
                  id="input-cust-form-name"
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={custFormName}
                  onChange={(e) => setCustFormName(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Phone (for WhatsApp)
                </label>
                <input
                  id="input-cust-form-phone"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={custFormPhone}
                  onChange={(e) => setCustFormPhone(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-customer-submit"
                  type="submit"
                  className="flex-2 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs active:scale-95"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Past Bills Modal */}
      {viewCustomerBills && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Bills for {viewCustomerBills.name}
                </h3>
              </div>
              <button
                onClick={() => setViewCustomerBills(null)}
                className="text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
              {customerBillsList.map((bill) => (
                <div
                  key={bill.id}
                  className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-emerald-600">
                      #{bill.billNumber}
                    </span>
                    <p className="text-[10px] text-zinc-400">
                      {new Date(bill.dateTime).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">
                      {settings.currencySymbol}{bill.total}
                    </span>
                    <button
                      onClick={() => setActiveReceiptBill(bill)}
                      className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold"
                    >
                      Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-xs w-full p-4 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Delete Contact?
            </h4>
            <p className="text-xs text-zinc-500">
              Customer contact will be removed. Past bills remain untouched.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-customer"
                onClick={() => {
                  deleteCustomer(deleteConfirmId);
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
