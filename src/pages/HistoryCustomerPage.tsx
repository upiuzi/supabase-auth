import React, { useEffect, useState } from 'react';
import supabase from "../supabase";
import Navbar2 from '../components/Navbar2'; // tambahkan import Navbar2
interface Log {
  id: string;
  customer_id: string;
  message: string;
  session: string;
  log_date: string;
  customer_name?: string;
  phone?: string;
}

const HistoryCustomerPage: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      // Join ke customer untuk dapat nama & phone
      const { data, error } = await supabase
        .from('bclogs')
        .select('id,customer_id,message,session,log_date')
        .order('log_date', { ascending: false });
      if (!error && data) {
        setLogs(data);
      }
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (log) =>
      log.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.phone?.includes(search) ||
      log.message.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Navbar2 />
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">History Kontak Customer</h1>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Cari nama/nomor customer atau isi pesan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg border border-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b border-gray-200">Tanggal</th>
                <th className="px-4 py-2 border-b border-gray-200">Nama Customer</th>
                <th className="px-4 py-2 border-b border-gray-200">No. HP</th>
                <th className="px-4 py-2 border-b border-gray-200">Session</th>
                <th className="px-4 py-2 border-b border-gray-200">Pesan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-6">Loading...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6">Tidak ada log kontak.</td></tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">{new Date(log.log_date).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{log.customer_name || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{log.phone || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{log.session}</td>
                    <td className="px-4 py-2 max-w-xs break-words">{log.message}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryCustomerPage;
