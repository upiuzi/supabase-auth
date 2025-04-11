import { useState, useEffect } from 'react';
import { getProducts, getBatches, Product, Batch } from '../services/supabaseService';
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

type MonthlyProduction = {
  product_id: string;
  product_name: string;
  monthly_totals: {
    [month: string]: number;
  };
  grand_total: number;
};

const ReportProduction = () => {
  // const [products, setProducts] = useState<Product[]>([]);
  // const [batches, setBatches] = useState<Batch[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyProduction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, batchesData] = await Promise.all([
        getProducts(),
        getBatches()
      ]);
      
      console.log('Fetched products:', productsData);
      console.log('Fetched batches:', batchesData);
      
      // setProducts(productsData);
      // setBatches(batchesData);
      
      const productionData = calculateMonthlyProduction(productsData, batchesData);
      console.log('Calculated production data:', productionData);
      
      setMonthlyData(productionData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyProduction = (products: Product[], batches: Batch[]) => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const productionData: MonthlyProduction[] = products.map(product => {
      const monthlyTotals: {[month: string]: number} = {};
      let grandTotal = 0;

      // Initialize all months to 0
      months.forEach(month => {
        monthlyTotals[month] = 0;
      });

      // Calculate production from batches
      batches.forEach(batch => {
        if (batch.orders && batch.orders.length > 0) {
          batch.orders.forEach(order => {
            const orderDate = new Date(order.created_at);
            if (orderDate.getFullYear() === selectedYear) {
              const month = months[orderDate.getMonth()];
              
              if (order.order_items && order.order_items.length > 0) {
                order.order_items.forEach(item => {
                  if (item.product_id === product.id) {
                    monthlyTotals[month] += item.qty;
                    grandTotal += item.qty;
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
        monthly_totals: monthlyTotals,
        grand_total: grandTotal
      };
    });

    // Filter out products with zero production
    return productionData.filter(product => product.grand_total > 0);
  };


  const getTotalForMonth = (month: string) => {
    return monthlyData.reduce((sum, product) => sum + product.monthly_totals[month], 0);
  };

  const getGrandTotal = () => {
    return monthlyData.reduce((sum, product) => sum + product.grand_total, 0);
  };

  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i);

  return (
    <>
      <Navbar2 />
      <div className="container mx-auto p-6 min-h-screen text-white">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">Production Report</h1>
          <div className="flex gap-4">
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
            >
              <option value="desc">Qty Terbanyak</option>
              <option value="asc">Qty Terendah</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : (
            <div className="space-y-8">
            <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-800 rounded-lg">
              <thead>
                <tr className="text-gray-400 text-left">
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
                  <tr key={product.product_id} className="border-t border-gray-700 hover:bg-gray-700">
                    <td className="py-3 px-4">{product.product_name}</td>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                      <td key={month} className="py-3 px-4 text-center">
                        {product.monthly_totals[month] || 0}
                      </td>
                    ))}
                    <td className="py-3 px-4 text-center font-bold">
                      {product.grand_total}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-600 font-bold">
                  <td className="py-3 px-4">Total</td>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                    <td key={month} className="py-3 px-4 text-center">
                      {getTotalForMonth(month)}
                    </td>
                  ))}
                  <td className="py-3 px-4 text-center">
                    {getGrandTotal()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ReportProduction;
