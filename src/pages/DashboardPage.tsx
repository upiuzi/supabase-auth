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
    <>
      <Navbar2 />
      <div className="container mx-auto p-6 min-h-screen text-white">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400 mb-6">Overview of your order management system</p>

        {loading && <p className="text-gray-400">Loading data...</p>}

        {/* Overview Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg shadow flex items-center">
            <div className="bg-blue-900 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400">Customers</p>
              <p className="text-2xl font-bold">{customerCount} <span className="text-green-400">↑</span></p>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow flex items-center">
            <div className="bg-green-900 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400">Products</p>
              <p className="text-2xl font-bold">{productCount} <span className="text-green-400">↑</span></p>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow flex items-center">
            <div className="bg-yellow-900 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a8 8 0 01-8 8 8 8 0 01-8-8 8 8 0 018-8 8 8 0 018 8zm-7 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400">Batches</p>
              <p className="text-2xl font-bold">{batchCount} <span className="text-green-400">↑</span></p>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg shadow flex items-center">
            <div className="bg-purple-900 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h18M3 9h18m-9 6h9m-9-6h9m-9 12h9m-9-6h9" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400">Orders</p>
              <p className="text-2xl font-bold">{orderCount} <span className="text-green-400">↑</span></p>
            </div>
          </div>
        </div>


        {/* Batch Status Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Batch Status</h2>
            <Link to="/batches" className="text-blue-400 hover:underline">View All →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow text-center">
              <p className="text-3xl font-bold text-green-400">{batchStatus.available}</p>
              <p className="text-gray-400">Available</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow text-center">
              <p className="text-3xl font-bold text-yellow-400">{batchStatus.partiallySold}</p>
              <p className="text-gray-400">Partially Sold</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow text-center">
              <p className="text-3xl font-bold text-red-400">{batchStatus.soldOut}</p>
              <p className="text-gray-400">Sold Out</p>
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
            //   const progress = totalInitialQty ? (totalRemainingQty / totalInitialQty) * 100 : 0;

              return (
                <div key={batch.id} className="bg-gray-800 p-6 rounded-lg shadow">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold">Batch #{batch.batch_id}</h3>
                    <span className={`text-sm px-3 py-1 rounded-full ${getBatchStatusColor(batch)}`}>
                      {totalRemainingQty === 0 ? 'Sold Out' : totalRemainingQty === totalInitialQty ? 'Available' : 'Partially Sold'}
                    </span>
                  </div>
                  {batch.batch_products?.map((bp) => (
                    <div key={bp.id} className="mb-2">
                      <p className="text-gray-400">{bp.product?.name || 'Unknown Product'}</p>
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-blue-500 h-2.5 rounded-full"
                          style={{ width: `${(bp.remaining_qty / bp.initial_qty) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-400">
                        {bp.remaining_qty} / {bp.initial_qty}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
        <a href="/broadcast" className="block py-2 px-4 hover:bg-gray-100">Broadcast</a>
      </div>
    </>
  );
};

export default DashboardPage;
