import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  FileText,
  AlertTriangle,
  Plus,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useShop } from '../context/ShopContext';

export const ReportsScreen: React.FC = () => {
  const { bills, products, settings, updateProduct } = useShop();

  const [periodTab, setPeriodTab] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [restockModalProd, setRestockModalProd] = useState<{ id: string; name: string; stock: number } | null>(null);
  const [restockAddQty, setRestockAddQty] = useState('20');

  // Today calculations
  const todayMetrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayBills = bills.filter((b) => new Date(b.dateTime).getTime() >= startOfToday);

    const sales = todayBills.reduce((acc, b) => acc + b.total, 0);
    const profit = todayBills.reduce((acc, b) => acc + (b.profit || 0), 0);

    return {
      billCount: todayBills.length,
      sales,
      profit,
    };
  }, [bills]);

  // Overall calculations
  const overallMetrics = useMemo(() => {
    const totalRevenue = bills.reduce((acc, b) => acc + b.total, 0);
    const totalProfit = bills.reduce((acc, b) => acc + (b.profit || 0), 0);
    const lowStockCount = products.filter((p) => p.stock <= p.lowStockThreshold).length;

    return {
      totalRevenue,
      totalProfit,
      totalBills: bills.length,
      lowStockCount,
    };
  }, [bills, products]);

  // 7-day breakdown for BarChart
  const weeklyData = useMemo(() => {
    const days: { day: string; dateStr: string; sales: number; profit: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

      const dayBills = bills.filter((b) => b.dateTime.startsWith(dateStr));
      const daySales = dayBills.reduce((sum, b) => sum + b.total, 0);
      const dayProfit = dayBills.reduce((sum, b) => sum + (b.profit || 0), 0);

      days.push({
        day: dayLabel,
        dateStr,
        sales: daySales,
        profit: dayProfit,
      });
    }

    return days;
  }, [bills]);

  // Monthly breakdown for LineChart
  const monthlyData = useMemo(() => {
    const monthsMap: { [key: string]: { sales: number; profit: number } } = {};

    bills.forEach((b) => {
      const d = new Date(b.dateTime);
      const key = d.toLocaleDateString('en-US', { month: 'short' });
      if (!monthsMap[key]) {
        monthsMap[key] = { sales: 0, profit: 0 };
      }
      monthsMap[key].sales += b.total;
      monthsMap[key].profit += b.profit || 0;
    });

    return Object.entries(monthsMap).map(([month, val]) => ({
      month,
      sales: val.sales,
      profit: val.profit,
    }));
  }, [bills]);

  // Low stock products
  const lowStockItems = useMemo(
    () => products.filter((p) => p.stock <= p.lowStockThreshold),
    [products]
  );

  const handleApplyRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalProd) return;
    const addQty = parseInt(restockAddQty) || 0;
    if (addQty <= 0) return;

    updateProduct(restockModalProd.id, {
      stock: restockModalProd.stock + addQty,
    });

    setRestockModalProd(null);
  };

  return (
    <div className="max-w-md mx-auto px-3 pt-2 pb-28 space-y-2.5">
      {/* Period Toggle Chips */}
      <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
        {(['daily', 'weekly', 'monthly'] as const).map((tab) => (
          <button
            key={tab}
            id={`tab-report-${tab}`}
            onClick={() => setPeriodTab(tab)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
              periodTab === tab
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            {tab === 'daily' ? 'Today' : tab === 'weekly' ? '7 Days' : 'Monthly'}
          </button>
        ))}
      </div>

      {/* 2x2 Metric Tiles */}
      <div className="grid grid-cols-2 gap-2">
        {/* Sales */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {periodTab === 'daily' ? "Today's Sales" : 'Gross Sales'}
            </span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-zinc-900 dark:text-zinc-100 font-mono">
            {settings.currencySymbol}
            {periodTab === 'daily' ? todayMetrics.sales : overallMetrics.totalRevenue}
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            {periodTab === 'daily' ? `${todayMetrics.billCount} bills today` : `${overallMetrics.totalBills} bills total`}
          </p>
        </div>

        {/* Net Profit */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {periodTab === 'daily' ? "Today's Profit" : 'Net Profit'}
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
            +{settings.currencySymbol}
            {periodTab === 'daily' ? todayMetrics.profit : overallMetrics.totalProfit}
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5">
            Sell price minus cost
          </p>
        </div>

        {/* Bills Count */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Total Bills
            </span>
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-lg font-black text-zinc-900 dark:text-zinc-100 font-mono">
            {periodTab === 'daily' ? todayMetrics.billCount : overallMetrics.totalBills}
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5">Customer transactions</p>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Low Stock Items
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
            {overallMetrics.lowStockCount}
          </div>
          <p className="text-[10px] text-zinc-400 mt-0.5">Need restock soon</p>
        </div>
      </div>

      {/* Sales & Profit Chart */}
      <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            {periodTab === 'weekly'
              ? 'Last 7 Days: Sales & Profit'
              : periodTab === 'monthly'
              ? 'Monthly Trend'
              : "Today's Sales Breakdown"}
          </h3>
          <span className="text-[10px] text-zinc-400 font-mono">
            {settings.currencySymbol} values
          </span>
        </div>

        <div className="h-44 w-full pt-1">
          {periodTab === 'weekly' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: any) => [`${settings.currencySymbol}${value}`, '']}
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderRadius: '10px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="sales" name="Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData.length > 0 ? monthlyData : [{ month: 'Current', sales: overallMetrics.totalRevenue, profit: overallMetrics.totalProfit }]} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: any) => [`${settings.currencySymbol}${value}`, '']}
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderRadius: '10px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Line type="monotone" dataKey="sales" name="Sales" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="profit" name="Profit" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Low Stock Alerts & Instant Restock Card List */}
      <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              Low Stock Alerts ({lowStockItems.length})
            </h3>
          </div>
          <span className="text-[10px] text-zinc-400">
            Threshold alert
          </span>
        </div>

        {lowStockItems.length === 0 ? (
          <p className="text-xs text-zinc-400 py-3 text-center">
            All inventory levels are healthy!
          </p>
        ) : (
          <div className="space-y-1.5">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs"
              >
                <div className="min-w-0 pr-2">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {item.name}
                  </h4>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold font-mono">
                    {item.stock <= 0 ? 'Out of Stock' : `${item.stock} left in stock`}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setRestockModalProd(item);
                    setRestockAddQty('20');
                  }}
                  className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shrink-0 active:scale-95"
                >
                  <Plus className="w-3 h-3" />
                  <span>Restock</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instant Restock Modal */}
      {restockModalProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-xs w-full p-4 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Restock {restockModalProd.name}
              </h4>
              <button onClick={() => setRestockModalProd(null)} className="text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyRestock} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 mb-1">
                  Units to Add to Stock
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockAddQty}
                  onChange={(e) => setRestockAddQty(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRestockModalProd(null)}
                  className="flex-1 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-emerald-600 text-white text-xs font-black"
                >
                  Add Units
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
