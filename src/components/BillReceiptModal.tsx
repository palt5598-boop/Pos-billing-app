import React, { useState } from 'react';
import {
  X,
  Share2,
  Download,
  Printer,
  CheckCircle,
  Phone,
  Calendar,
  CreditCard,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { Bill, ShopSettings } from '../types';
import { openWhatsAppShare, shareOrDownloadReceiptImage } from '../utils/receiptGenerator';

interface BillReceiptModalProps {
  isOpen: boolean;
  bill: Bill | null;
  settings: ShopSettings;
  onClose: () => void;
  isNewBill?: boolean;
}

export const BillReceiptModal: React.FC<BillReceiptModalProps> = ({
  isOpen,
  bill,
  settings,
  onClose,
  isNewBill = false,
}) => {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen || !bill) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await shareOrDownloadReceiptImage(bill, settings);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(bill.dateTime).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div
      id="bill-receipt-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
    >
      <div
        id="bill-receipt-modal-container"
        className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col my-auto"
      >
        {/* Header / Success Banner if newly created */}
        {isNewBill && (
          <div className="bg-emerald-600 text-white px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-200" />
              <span className="text-sm font-bold">Bill Created Successfully</span>
            </div>
            <span className="text-xs bg-emerald-700/70 px-2 py-0.5 rounded font-mono font-medium">
              #{bill.billNumber}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              POS
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Receipt #{bill.billNumber}
              </h3>
              <p className="text-[11px] text-zinc-500">{formattedDate}</p>
            </div>
          </div>
          <button
            id="btn-close-receipt-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Receipt Paper Card */}
        <div className="p-4 sm:p-5 bg-zinc-100/70 dark:bg-zinc-950/60 overflow-y-auto max-h-[58vh]">
          <div
            id="thermal-receipt-preview"
            className="bg-white text-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-200 font-sans relative"
          >
            {/* Serrated top decorative edge */}
            <div className="text-center pb-3 border-b border-dashed border-zinc-300">
              <h2 className="text-base font-extrabold uppercase tracking-tight text-zinc-900">
                {settings.shopName}
              </h2>
              {settings.shopAddress && (
                <p className="text-xs text-zinc-500 mt-0.5">{settings.shopAddress}</p>
              )}
              {settings.shopPhone && (
                <p className="text-xs text-zinc-500">Phone: {settings.shopPhone}</p>
              )}
            </div>

            {/* Bill Details */}
            <div className="py-2.5 border-b border-dashed border-zinc-300 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Bill No:</span>
                <span className="font-bold font-mono">#{bill.billNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Date:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Customer:</span>
                <span className="font-medium">{bill.customerName || 'Walk-in customer'}</span>
              </div>
              {bill.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Phone:</span>
                  <span className="font-mono">{bill.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-zinc-500">Payment:</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                  {bill.paymentMode}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="py-3 border-b border-dashed border-zinc-300">
              <div className="grid grid-cols-12 text-[11px] font-bold text-zinc-400 uppercase tracking-wider pb-1.5">
                <span className="col-span-6">Item</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-4 text-right">Total</span>
              </div>
              <div className="space-y-2">
                {bill.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-xs items-center">
                    <div className="col-span-6 pr-1">
                      <p className="font-medium text-zinc-900 truncate">{item.name}</p>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        @{settings.currencySymbol}{item.priceAtSale}
                      </p>
                    </div>
                    <div className="col-span-2 text-center text-zinc-600 font-mono font-medium">
                      {item.qty}
                    </div>
                    <div className="col-span-4 text-right font-bold text-zinc-900 font-mono">
                      {settings.currencySymbol}{item.priceAtSale * item.qty}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="pt-3 pb-2 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-zinc-800">Total Amount:</span>
                <span className="text-lg font-black text-emerald-700 font-mono">
                  {settings.currencySymbol}{bill.total}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-zinc-500">
                <span>Items count:</span>
                <span>{bill.items.reduce((s, i) => s + i.qty, 0)} units</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 text-center border-t border-dashed border-zinc-300 text-[11px] text-zinc-400">
              <p>Thank you for shopping with us!</p>
              <p className="text-[9px] mt-0.5">Powered by CICADA</p>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
          {/* Primary Action: WhatsApp Share */}
          <button
            id="btn-share-whatsapp"
            onClick={() => openWhatsAppShare(bill, settings)}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Share to WhatsApp</span>
            {bill.customerPhone && (
              <span className="text-[11px] bg-emerald-700/80 px-2 py-0.5 rounded-full">
                {bill.customerPhone}
              </span>
            )}
          </button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-download-receipt-img"
              onClick={handleDownload}
              disabled={downloading}
              className="py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span>{downloading ? 'Saving...' : 'Save Receipt Image'}</span>
            </button>
            <button
              id="btn-print-receipt"
              onClick={handlePrint}
              className="py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-zinc-500" />
              <span>Print Bill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
