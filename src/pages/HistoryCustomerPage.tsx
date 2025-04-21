import React, { useEffect, useState } from 'react';
import supabase from "../supabase";
interface BCLog {
  id: string;
  customer_id: string;
  message: string;
  session: string;
  log_date: string;
  customer_name?: string;
  phone?: string;
}

const HistoryCustomerPage: React.FC = () => {
  const [logs, setLogs] = useState<BCLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      // Join ke customer untuk dapat nama & phone
      const { data, error } = await supabase
        .from('bclogs')
        .select('id,customer_id,message,session,log_date,customer:customer_id(name,phone)')
        .order('log_date', { ascending: false });
      if (!error && data) {
        setLogs(data.map((log: any) => ({
          ...log,
          customer_name: log.customer?.name || '',
          phone: log.customer?.phone || '',
        })));
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
    <div className="container mx-auto p-6 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-4">History Kontak Customer</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Cari nama/nomor customer atau isi pesan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-900 rounded-lg">
          <thead>
            <tr>
              <th className="px-4 py-2">Tanggal</th>
              <th className="px-4 py-2">Nama Customer</th>
              <th className="px-4 py-2">No. HP</th>
              <th className="px-4 py-2">Session</th>
              <th className="px-4 py-2">Pesan</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-6">Loading...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-6">Tidak ada log kontak.</td></tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-700">
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
  );
};

export default HistoryCustomerPage;
