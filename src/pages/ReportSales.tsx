import { useState, useEffect } from 'react';
import { getProducts, getBatches, Product, Batch } from '../services/supabaseService';
import { getCustomers } from '../services/customerService';
import Navbar2 from '../components/Navbar2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type MonthlySales = {
  product_id: string;
  product_name: string;
  monthly_revenue: {
    [month: string]: number;
  };
  grand_total: number;
};

const ReportSales = () => {
  // const [products, setProducts] = useState<Product[]>([]);
  // const [batches, setBatches] = useState<Batch[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlySales[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, batchesData, customersData] = await Promise.all([
        getProducts(),
        getBatches(),
        getCustomers()
      ]);
      setCustomers(customersData);
      const salesData = calculateMonthlySales(productsData, batchesData);
      setMonthlyData(salesData);
      setDetailData(calculateDetailData(productsData, batchesData, customersData));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlySales = (products: Product[], batches: Batch[]) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const salesData: MonthlySales[] = products.map(product => {
      const monthlyRevenue: {[month: string]: number} = {};
      let grandTotal = 0;

      months.forEach(month => {
        monthlyRevenue[month] = 0;
      });

      batches.forEach(batch => {
        if (batch.orders && batch.orders.length > 0) {
          batch.orders.forEach(order => {
            const orderDate = new Date(order.created_at);
            if (orderDate.getFullYear() === selectedYear) {
              const month = months[orderDate.getMonth()];
              
              if (order.order_items && order.order_items.length > 0) {
                order.order_items.forEach(item => {
                  if (item.product_id === product.id) {
                    const revenue = item.qty * item.price;
                    monthlyRevenue[month] += revenue;
                    grandTotal += revenue;
                  }
                });
              }
            }
          });
        }
      });

      return {
        product_id: product.id,
        product_name: product.name,
        monthly_revenue: monthlyRevenue,
        grand_total: grandTotal
      };
    });

    return salesData.filter(product => product.grand_total > 0);
  };

  const calculateDetailData = (products: Product[], batches: Batch[], customers: any[]) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const map: Record<string, any> = {};
    batches.forEach(batch => {
      if (batch.orders && batch.orders.length > 0) {
        batch.orders.forEach(order => {
          const orderDate = new Date(order.created_at);
          if (orderDate.getFullYear() === selectedYear) {
            const month = months[orderDate.getMonth()];
            const customerObj = customers.find(c => c.id === order.customer_id);
            const customer = customerObj?.name || order.customer_id || '-';
            if (order.order_items && order.order_items.length > 0) {
              order.order_items.forEach(item => {
                const product = products.find(p => p.id === item.product_id);
                if (!product) return;
                const key = `${customer}_${product.name}`;
                if (!map[key]) {
                  map[key] = { customer, product: product.name };
                  months.forEach(m => { map[key][m] = 0; });
                }
                map[key][month] += item.qty;
              });
            }
          }
        });
      }
    });
    return Object.values(map);
  };

  const getTotalForMonth = (month: string) => {
    return monthlyData.reduce((sum, product) => sum + product.monthly_revenue[month], 0);
  };

  const getGrandTotal = () => {
    return monthlyData.reduce((sum, product) => sum + product.grand_total, 0);
  };

  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i);

  return (
    <>
      <Navbar2 />
      <div className="container mx-auto p-6 min-h-screen bg-gray-100 text-gray-900">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">Sales Report</h1>
          <div className="flex gap-4">
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-900"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-900"
            >
              <option value="desc">Qty Terbanyak</option>
              <option value="asc">Qty Terendah</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-600">Loading...</div>
        ) : (
          <div className="space-y-8">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg">
                <thead>
                  <tr className="text-gray-700 text-left">
                    <th className="py-3 px-4">Product</th>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                      <th key={month} className="py-3 px-4">{month}</th>
                    ))}
                    <th className="py-3 px-4">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[...monthlyData]
                    .sort((a, b) =>
                      sortOrder === 'asc'
                        ? a.grand_total - b.grand_total
                        : b.grand_total - a.grand_total
                    )
                    .map((product) => (
                    <tr key={product.product_id} className="border-t border-gray-200 hover:bg-gray-100">
                      <td className="py-3 px-4 text-gray-900">{product.product_name}</td>
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                        <td key={month} className="py-3 px-4 text-center text-gray-700">
                          Rp {product.monthly_revenue[month]?.toLocaleString('id-ID') || 0}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-center font-bold text-gray-900">
                        Rp {product.grand_total.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-300 font-bold">
                    <td className="py-3 px-4 text-gray-900">Total</td>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                      <td key={month} className="py-3 px-4 text-center text-gray-900">
                        Rp {getTotalForMonth(month).toLocaleString('id-ID')}
                      </td>
                    ))}
                    <td className="py-3 px-4 text-center text-gray-900">
                      Rp {getGrandTotal().toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-6">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => setShowDetail(v => !v)}
              >
                {showDetail ? 'Sembunyikan' : 'Lihat'} Detail Qty per Customer/Bulan/Produk
              </button>
              {showDetail && (
                <div className="overflow-x-auto mt-4">
                  <table className="min-w-full bg-white rounded-lg">
                    <thead>
                      <tr className="text-gray-700 text-left">
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Produk</th>
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                          <th key={month} className="py-3 px-4 text-center">{month}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detailData.map((row, idx) => (
                        <tr key={idx} className="border-t border-gray-200 hover:bg-gray-100">
                          <td className="py-3 px-4">{row.customer}</td>
                          <td className="py-3 px-4">{row.product}</td>
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                            <td key={month} className="py-3 px-4 text-center">{row[month] || 0}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ReportSales;