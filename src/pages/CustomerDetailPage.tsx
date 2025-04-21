import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Customer, getCustomerById, getOrders } from '../services/supabaseService';
import Navbar2 from '../components/Navbar2';
import { getWASessions } from '../services/waService';

const CustomerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderStats, setOrderStats] = useState<{
    totalQty: number;
    totalRevenue: number;
    firstOrderDate: string | null;
    lastOrderDate: string | null;
  }>({ totalQty: 0, totalRevenue: 0, firstOrderDate: null, lastOrderDate: null });
  const [waMessage, setWaMessage] = useState('');
  const [sessions, setSessions] = useState<{ session_id: string; status: string }[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [waStatus, setWaStatus] = useState<'idle'|'sending'|'sent'|'failed'>('idle');
  const [waStatusMsg, setWaStatusMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getWASessions()
      .then(data => {
        setSessions(data);
        if (data.length > 0) setSelectedSession(data[0].session_id);
      })
      .catch(() => setSessions([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getCustomerById(id)
      .then((data) => setCustomer(data))
      .catch(() => setCustomer(null))
      .finally(() => setLoading(false));

    // Fetch orders for this customer
    getOrders().then((allOrders) => {
      const custOrders = allOrders.filter((o: any) => o.customer_id === id);
      setOrders(custOrders);
      if (custOrders.length > 0) {
        let totalQty = 0;
        let totalRevenue = 0;
        let firstOrderDate = custOrders[0].created_at;
        let lastOrderDate = custOrders[0].created_at;
        custOrders.forEach((order: any) => {
          // Sum all order_items quantities and revenues
          if (order.order_items) {
            order.order_items.forEach((item: any) => {
              totalQty += item.qty || 0;
              totalRevenue += (item.qty || 0) * (item.price || 0);
            });
          }
          if (order.created_at < firstOrderDate) firstOrderDate = order.created_at;
          if (order.created_at > lastOrderDate) lastOrderDate = order.created_at;
        });
        setOrderStats({
          totalQty,
          totalRevenue,
          firstOrderDate,
          lastOrderDate,
        });

        // Generate WhatsApp follow-up message
        const lastOrderDateStr = lastOrderDate ? new Date(lastOrderDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-';
        const name = (customer && customer.name) ? customer.name.split(' ')[0] : 'Kak';
        const message = `Hallo ${name}, apa kabar?\n\nKak ${name}, sudah lama ya tidak order dari kami. Terakhir order kakak tercatat pada tanggal ${lastOrderDateStr}.\n\nApakah kakak ingin order lagi? Jika ada kebutuhan atau pertanyaan, silakan hubungi kami. Terima kasih!`;
        setWaMessage(message);
      } else {
        setOrderStats({ totalQty: 0, totalRevenue: 0, firstOrderDate: null, lastOrderDate: null });

        // Default message if never ordered
        const name = (customer && customer.name) ? customer.name.split(' ')[0] : 'Kak';
        setWaMessage(`Hallo ${name}, apa kabar?\n\nKami dari Sat Coconut ingin mengingatkan jika ada kebutuhan produk, jangan ragu untuk order atau konsultasi dengan kami ya! Terima kasih.`);
      }
    });
  }, [id]);

  const handleSendWA = async () => {
    if (!customer?.phone || !waMessage || !selectedSession) return;
    setSending(true);
    setWaStatus('sending');
    setWaStatusMsg('');
    try {
      // Use the backend service to send WhatsApp message
      const payload = {
        to: customer.phone,
        message: waMessage,
        session: selectedSession,
      };
      const res = await import('../services/waService').then(mod => mod.sendOrderConfirmBroadcast(payload));
      if (res.status === 200 || res.status === 201) {
        setWaStatus('sent');
        setWaStatusMsg('Pesan WhatsApp berhasil dikirim!');
      } else {
        setWaStatus('failed');
        setWaStatusMsg('Gagal mengirim pesan WhatsApp.');
      }
    } catch (e: any) {
      setWaStatus('failed');
      setWaStatusMsg(e?.message || 'Gagal mengirim pesan WhatsApp.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <Navbar2 />
        <div className="container mx-auto p-8">
          <p>Loading customer data...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <Navbar2 />
        <div className="container mx-auto p-8">
          <p>Customer not found.</p>
          <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-blue-600 rounded">Kembali</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <Navbar2 />
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">Detail Customer</h1>
        <div className="bg-gray-800 rounded-lg p-6 shadow-md">
          <table className="w-full text-left">
            <tbody>
              <tr><td className="font-semibold pr-4">Nama</td><td>{customer.name}</td></tr>
              <tr><td className="font-semibold pr-4">Brand</td><td>{customer.brand}</td></tr>
              <tr><td className="font-semibold pr-4">Telepon</td><td>{customer.phone}</td></tr>
              <tr><td className="font-semibold pr-4">Email</td><td>{customer.email}</td></tr>
              <tr><td className="font-semibold pr-4">Alamat</td><td>{customer.address}</td></tr>
              <tr><td className="font-semibold pr-4">Kota</td><td>{customer.city}</td></tr>
              {/* Tambahkan field lain jika ada di schema Customer */}
            </tbody>
          </table>
        </div>

        {/* Order History Section */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-md mt-6">
          <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Riwayat Pesanan</h2>
          {orders.length === 0 ? (
            <p className="text-gray-400">Belum ada pesanan untuk customer ini.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-8 mb-6">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm">Total Kuantitas</span>
                  <span className="text-2xl font-bold text-blue-400">{orderStats.totalQty.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm">Total Revenue</span>
                  <span className="text-2xl font-bold text-green-400">Rp {orderStats.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm">Order Pertama</span>
                  <span className="font-semibold">{orderStats.firstOrderDate ? new Date(orderStats.firstOrderDate).toLocaleDateString() : '-'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm">Order Terakhir</span>
                  <span className="font-semibold">{orderStats.lastOrderDate ? new Date(orderStats.lastOrderDate).toLocaleDateString() : '-'}</span>
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="min-w-full bg-gray-900">
                  <thead>
                    <tr className="text-gray-400 text-left bg-gray-800">
                      <th className="py-3 px-4 font-semibold">Tanggal</th>
                      <th className="py-3 px-4 font-semibold">No. Invoice</th>
                      <th className="py-3 px-4 font-semibold">Kuantitas</th>
                      <th className="py-3 px-4 font-semibold">Total (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const qty = order.order_items?.reduce((sum: number, item: any) => sum + (item.qty || 0), 0) || 0;
                      const total = order.order_items?.reduce((sum: number, item: any) => sum + ((item.qty || 0) * (item.price || 0)), 0) || 0;
                      return (
                        <tr key={order.id} className="border-t border-gray-700 hover:bg-gray-800 transition-colors">
                          <td className="py-2 px-4 whitespace-nowrap">{order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</td>
                          <td className="py-2 px-4 whitespace-nowrap">{order.invoice_no || '-'}</td>
                          <td className="py-2 px-4 whitespace-nowrap">{qty.toLocaleString()}</td>
                          <td className="py-2 px-4 whitespace-nowrap">Rp {total.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* WhatsApp Follow Up Section */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-md mt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Follow Up WhatsApp</h2>
            <div className="flex gap-2 items-center">
              <select
                className="px-2 py-1 rounded border border-gray-700 bg-gray-900 text-white focus:outline-none"
                value={selectedSession}
                onChange={e => setSelectedSession(e.target.value)}
                disabled={sending || sessions.length === 0}
              >
                {sessions.length === 0 ? (
                  <option value="">Tidak ada session</option>
                ) : (
                  sessions.map(s => (
                    <option key={s.session_id} value={s.session_id}>
                      {s.session_id} ({s.status})
                    </option>
                  ))
                )}
              </select>
              {customer?.phone && (
                <button
                  onClick={handleSendWA}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold shadow disabled:bg-green-300"
                  disabled={sending || !selectedSession}
                >
                  {sending ? 'Mengirim...' : 'Kirim via WhatsApp'}
                </button>
              )}
            </div>
          </div>
          {waStatus !== 'idle' && (
            <div className={`text-sm ${waStatus==='sent' ? 'text-green-400' : waStatus==='failed' ? 'text-red-400' : 'text-yellow-400'}`}>{waStatusMsg}</div>
          )}
          <textarea
            className="w-full bg-gray-900 text-white rounded p-3 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={4}
            value={waMessage}
            onChange={e => setWaMessage(e.target.value)}
          />
        </div>

        <button onClick={() => navigate(-1)} className="mt-6 px-4 py-2 bg-blue-600 rounded">Kembali</button>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
