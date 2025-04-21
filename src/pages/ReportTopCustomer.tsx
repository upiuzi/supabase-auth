import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Navbar2 from '../components/Navbar2';

interface ReportRow {
  customer_name: string;
  month: string;
  product_name: string;
  total_qty: number;
  year?: number;
}

interface CustomerMonthData {
  [customerName: string]: {
    [month: string]: number; // total_qty
  };
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export default function ReportTopCustomer() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [rawData, setRawData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('top_customer_report', { year });
      if (error) {
        console.error('Error fetching report:', error);
        setRawData([]);
      } else {
        setRawData(data);
      }
      setLoading(false);
    };

    fetchReport();
  }, [year]);

  const groupedData: CustomerMonthData = {};

  rawData.forEach((row) => {
    const monthShort = row.month.slice(0, 3);
    if (!groupedData[row.customer_name]) {
      groupedData[row.customer_name] = {};
    }
    if (!groupedData[row.customer_name][monthShort]) {
      groupedData[row.customer_name][monthShort] = 0;
    }
    groupedData[row.customer_name][monthShort] += row.total_qty;
  });

  const uniqueCustomers = Object.keys(groupedData).sort((a, b) => {
    const totalA = MONTHS.reduce(
      (sum, month) => sum + (groupedData[a][month] ?? 0),
      0
    );
    const totalB = MONTHS.reduce(
      (sum, month) => sum + (groupedData[b][month] ?? 0),
      0
    );
    return sortOrder === 'asc' ? totalA - totalB : totalB - totalA;
  });

  const getTotalForCustomer = (customer: string) => {
    return MONTHS.reduce(
      (sum, month) => sum + (groupedData[customer][month] ?? 0),
      0
    );
  };

  const getTotalForMonth = (month: string) => {
    return uniqueCustomers.reduce(
      (sum, customer) => sum + (groupedData[customer][month] ?? 0),
      0
    );
  };

  const getGrandTotal = () => {
    return uniqueCustomers.reduce(
      (sum, customer) => sum + getTotalForCustomer(customer),
      0
    );
  };

  return (
    <>
      <Navbar2 />
      <div className="container mx-auto p-6 min-h-screen bg-gray-100 text-gray-900">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">Top Customer Report</h1>
          <div className="flex gap-4">
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-900"
            >
              {Array.from({ length: 5 }, (_, idx) => currentYear - 2 + idx).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
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
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg">
              <thead>
                <tr className="text-gray-700 text-left">
                  <th className="py-3 px-4">Customer</th>
                  {MONTHS.map((month) => (
                    <th key={month} className="py-3 px-4">
                      {month}
                    </th>
                  ))}
                  <th className="py-3 px-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {uniqueCustomers.map((customer) => (
                  <tr
                    key={customer}
                    className="border-t border-gray-200 hover:bg-gray-100"
                  >
                    <td className="py-3 px-4 text-gray-900">{customer}</td>
                    {MONTHS.map((month) => (
                      <td key={month} className="py-3 px-4 text-center text-gray-700">
                        {groupedData[customer][month] ?? 0}
                      </td>
                    ))}
                    <td className="py-3 px-4 text-center font-bold text-gray-900">
                      {getTotalForCustomer(customer)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 font-bold">
                  <td className="py-3 px-4 text-gray-900">Total</td>
                  {MONTHS.map((month) => (
                    <td key={month} className="py-3 px-4 text-center text-gray-900">
                      {getTotalForMonth(month)}
                    </td>
                  ))}
                  <td className="py-3 px-4 text-center text-gray-900">
                    {getGrandTotal()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
