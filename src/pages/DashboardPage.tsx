// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getCustomers, 
  getProducts, 
  getBatches, 
  getOrders, 
  Batch 
} from '../services/supabaseService'; // Sesuaikan path dengan struktur proyek Anda
import Navbar2 from '../components/Navbar2';
import ProductionQtyChart from '../components/ProductionQtyChart';

interface BatchStatus {
  available: number;
  partiallySold: number;
  soldOut: number;
}

interface YearlySales {
  [year: string]: number;
}

interface MonthlySales {
  [month: string]: number;
}

const DashboardPage = () => {
  const [customerCount, setCustomerCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [batchCount, setBatchCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [batchStatus, setBatchStatus] = useState<BatchStatus>({
    available: 0,
    partiallySold: 0,
    soldOut: 0,
  });
  const [latestBatches, setLatestBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [monthlyQtyTotals, setMonthlyQtyTotals] = useState<{ month: string; total: number }[]>([]);
  const [monthlyOmzetTotals, setMonthlyOmzetTotals] = useState<{ month: string; total: number }[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch all data
      const [customers, products, batches, orders] = await Promise.all([
        getCustomers(), // Hapus parameter customer_id karena fungsi tidak menerimanya
        getProducts(),
        getBatches(),
        getOrders(),
      ]);

      console.log('Orders:', orders); // Debugging: cek data orders
      console.log('Customers:', customers); // Debugging: cek data customers

      // Set counts
      setCustomerCount(customers.length);
      setProductCount(products.length);
      setBatchCount(batches.length);
      setOrderCount(orders.length);

      // Calculate batch status
      const statusCounts: BatchStatus = {
        available: 0,
        partiallySold: 0,
        soldOut: 0,
      };

      batches.forEach((batch) => {
        const totalInitialQty = batch.batch_products?.reduce(
          (sum, bp) => sum + (bp.initial_qty || 0),
          0
        ) || 0;
        const totalRemainingQty = batch.batch_products?.reduce(
          (sum, bp) => sum + (bp.remaining_qty || 0),
          0
        ) || 0;

        if (totalRemainingQty === 0) {
          statusCounts.soldOut += 1;
        } else if (totalRemainingQty === totalInitialQty) {
          statusCounts.available += 1;
        } else {
          statusCounts.partiallySold += 1;
        }
      });

      setBatchStatus(statusCounts);

      // Calculate sales per year and per month
      const yearly: YearlySales = {};
      const monthly: MonthlySales = {};

      orders.forEach((order) => {
        const orderDate = new Date(order.created_at);
        const year = orderDate.getFullYear().toString();
        const month = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;

        // Hitung total_amount dari order_items karena field total_amount mungkin tidak ada
        const amount = order.order_items?.reduce(
          (sum, item) => sum + (item.qty * item.price),
          0
        ) || 0;

        yearly[year] = (yearly[year] || 0) + amount;
        monthly[month] = (monthly[month] || 0) + amount;
      });

      console.log('Yearly Sales:', yearly); // Debugging: cek hasil perhitungan
      console.log('Monthly Sales:', monthly); // Debugging: cek hasil perhitungan

      // --- Monthly Qty & Omzet Calculation with Year ---
      // Build a sorted list of unique months in format 'Jan24', 'Feb24', ...
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthYearSet = new Set<string>();
      orders.forEach(order => {
        const date = new Date(order.created_at);
        const label = `${monthNames[date.getMonth()]}${String(date.getFullYear()).slice(-2)}`;
        monthYearSet.add(label);
      });
      const sortedMonthYears = Array.from(monthYearSet).sort((a, b) => {
        // Sort by year then month
        const getVal = (str: string) => {
          const m = monthNames.indexOf(str.slice(0, 3));
          const y = parseInt('20' + str.slice(3));
          return y * 12 + m;
        };
        return getVal(a) - getVal(b);
      });

      // Qty
      const qtyByMonthYear: { [k: string]: number } = {};
      sortedMonthYears.forEach(m => qtyByMonthYear[m] = 0);
      // Omzet
      const omzetByMonthYear: { [k: string]: number } = {};
      sortedMonthYears.forEach(m => omzetByMonthYear[m] = 0);

      orders.forEach(order => {
        const date = new Date(order.created_at);
        const label = `${monthNames[date.getMonth()]}${String(date.getFullYear()).slice(-2)}`;
        if (order.order_items) {
          order.order_items.forEach(item => {
            qtyByMonthYear[label] = (qtyByMonthYear[label] || 0) + (item.qty || 0);
            omzetByMonthYear[label] = (omzetByMonthYear[label] || 0) + ((item.qty || 0) * (item.price || 0));
          });
        }
      });
      const monthlyTotals = sortedMonthYears.map(month => ({ month, total: qtyByMonthYear[month] }));
      setMonthlyQtyTotals(monthlyTotals);
      const monthlyOmzet = sortedMonthYears.map(month => ({ month, total: omzetByMonthYear[month] }));
      setMonthlyOmzetTotals(monthlyOmzet);

      // Get latest batches (sort by created_at and take top 2)
      const sortedBatches = batches
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 4);
      setLatestBatches(sortedBatches);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBatchStatusColor = (batch: Batch) => {
    const totalInitialQty = batch.batch_products?.reduce(
      (sum, bp) => sum + (bp.initial_qty || 0),
      0
    ) || 0;
    const totalRemainingQty = batch.batch_products?.reduce(
      (sum, bp) => sum + (bp.remaining_qty || 0),
      0
    ) || 0;

    if (totalRemainingQty === 0) {
      return 'bg-red-900 text-red-200';
    } else if (totalRemainingQty === totalInitialQty) {
      return 'bg-green-900 text-green-200';
    } else {
      return 'bg-yellow-900 text-yellow-200';
    }
  };

  return (
    <main className="bg-gray-100 min-h-screen text-gray-900">
      <Navbar2 />
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 dark:bg-white p-6 rounded-lg shadow flex items-center">
            <div className="bg-blue-900 dark:bg-blue-100 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-blue-400 dark:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M12 12a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 dark:text-gray-600">Customers</p>
              <p className="text-2xl font-bold">{customerCount} <span className="text-green-400">↑</span></p>
            </div>
          </div>
          <div className="bg-gray-800 dark:bg-white p-6 rounded-lg shadow flex items-center">
            <div className="bg-green-900 dark:bg-green-100 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-green-400 dark:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 21V7a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 dark:text-gray-600">Products</p>
              <p className="text-2xl font-bold">{productCount} <span className="text-green-400">↑</span></p>
            </div>
          </div>
          <div className="bg-gray-800 dark:bg-white p-6 rounded-lg shadow flex items-center">
            <div className="bg-yellow-900 dark:bg-yellow-100 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-yellow-400 dark:text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h18M3 9h18m-9 6h9m-9-6h9m-9 12h9m-9-6h9" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 dark:text-gray-600">Batches</p>
              <p className="text-2xl font-bold">{batchCount} <span className="text-green-400">↑</span></p>
            </div>
          </div>
          <div className="bg-gray-800 dark:bg-white p-6 rounded-lg shadow flex items-center">
            <div className="bg-purple-900 dark:bg-purple-100 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-purple-400 dark:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h18M3 9h18m-9 6h9m-9-6h9m-9 12h9m-9-6h9" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 dark:text-gray-600">Orders</p>
              <p className="text-2xl font-bold">{orderCount} <span className="text-green-400">↑</span></p>
            </div>
          </div>
        </div>

        {/* Monthly Charts: Qty & Omset */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <ProductionQtyChart monthlyTotals={monthlyQtyTotals} showAll={true} height={160} label="Total Qty per Bulan" color="#2563eb" />
          </div>
          <div>
            <ProductionQtyChart monthlyTotals={monthlyOmzetTotals} showAll={true} height={160} label="Total Omset per Bulan" color="#059669" prefix="Rp " />
          </div>
        </div>

        {/* Batch Status Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Batch Status</h2>
            <Link to="/batches" className="text-blue-400 hover:underline">View All →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-gray-800 dark:bg-white p-6 rounded-lg shadow text-center">
              <p className="text-3xl font-bold text-green-400">{batchStatus.available}</p>
              <p className="text-gray-400 dark:text-gray-600">Available</p>
            </div>
            <div className="bg-gray-800 dark:bg-white p-6 rounded-lg shadow text-center">
              <p className="text-3xl font-bold text-yellow-400">{batchStatus.partiallySold}</p>
              <p className="text-gray-400 dark:text-gray-600">Partially Sold</p>
            </div>
            <div className="bg-gray-800 dark:bg-white p-6 rounded-lg shadow text-center">
              <p className="text-3xl font-bold text-red-400">{batchStatus.soldOut}</p>
              <p className="text-gray-400 dark:text-gray-600">Sold Out</p>
            </div>
          </div>
        </div>

        {/* Latest Batches Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">Latest Batches</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {latestBatches.map((batch) => {
              const totalInitialQty = batch.batch_products?.reduce(
                (sum, bp) => sum + (bp.initial_qty || 0),
                0
              ) || 0;
              const totalRemainingQty = batch.batch_products?.reduce(
                (sum, bp) => sum + (bp.remaining_qty || 0),
                0
              ) || 0;
              return (
                <div key={batch.id} className="bg-gray-800 dark:bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold">Batch #{batch.batch_id}</h3>
                    <span className={`text-sm px-3 py-1 rounded-full ${getBatchStatusColor(batch)}`}>{
                      totalRemainingQty === 0 ? 'Sold Out' : totalRemainingQty === totalInitialQty ? 'Available' : 'Partially Sold'
                    }</span>
                  </div>
                  {batch.batch_products?.map((bp) => (
                    <div key={bp.id} className="mb-2">
                      <p className="text-gray-400 dark:text-gray-600">{bp.product?.name || 'Unknown Product'}</p>
                      <div className="w-full bg-gray-700 dark:bg-gray-300 rounded-full h-2.5">
                        <div
                          className="bg-blue-500 dark:bg-blue-400 h-2.5 rounded-full"
                          style={{ width: `${(bp.remaining_qty / bp.initial_qty) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-400 dark:text-gray-600">
                        {bp.remaining_qty} / {bp.initial_qty}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
};

export default DashboardPage;
