import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Customer, getCustomerById, getOrders } from '../services/supabaseService';
import Navbar2 from '../components/Navbar2';
import { getWASessions } from '../services/waService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

  const handleDownloadPDF = async () => {
    // Ambil elemen utama yang ingin di-export (tanpa WhatsApp follow up)
    const mainContent = document.getElementById('customer-detail-pdf');
    if (!mainContent) return;
    // Sembunyikan section WA follow up jika ada
    const waSection = document.getElementById('wa-followup-section');
    if (waSection) waSection.style.display = 'none';
    // Screenshot area
    const canvas = await html2canvas(mainContent, { backgroundColor: '#fff', useCORS: true, scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // Hitung skala biar muat di A4
    const imgProps = { width: canvas.width, height: canvas.height };
    const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);
    const imgWidth = imgProps.width * ratio;
    const imgHeight = imgProps.height * ratio;
    pdf.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, 20, imgWidth, imgHeight, undefined, 'FAST');
    pdf.save(`customer_detail_${customer?.name || 'data'}.pdf`);
    if (waSection) waSection.style.display = '';
  };

  if (loading) {
    return (
      <div style={{ background: '#fff', color: '#222', minHeight: '100vh' }}>
        <Navbar2 />
        <div className="max-w-3xl mx-auto py-8 px-4">
          <p>Loading customer data...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{ background: '#fff', color: '#222', minHeight: '100vh' }}>
        <Navbar2 />
        <div className="max-w-3xl mx-auto py-8 px-4">
          <p>Customer not found.</p>
          <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-blue-600 rounded">Kembali</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', color: '#222', minHeight: '100vh' }}>
      <Navbar2 />
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#222' }}>Detail Customer</h1>
          <button
            onClick={handleDownloadPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold shadow"
          >
            Download PDF
          </button>
        </div>
        <div id="customer-detail-pdf" style={{ background: '#fff', color: '#222', borderRadius: 12, boxShadow: '0 2px 12px #eee', padding: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#222' }}>Detail Customer</h1>
          <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 20, marginBottom: 24 }}>
            <table style={{ width: '100%', color: '#222' }}>
              <tbody>
                <tr><td style={{ fontWeight: 600, paddingRight: 12 }}>Nama</td><td>{customer.name}</td></tr>
                <tr><td style={{ fontWeight: 600, paddingRight: 12 }}>Brand</td><td>{customer.brand}</td></tr>
                <tr><td style={{ fontWeight: 600, paddingRight: 12 }}>Telepon</td><td>{customer.phone}</td></tr>
                <tr><td style={{ fontWeight: 600, paddingRight: 12 }}>Email</td><td>{customer.email}</td></tr>
                <tr><td style={{ fontWeight: 600, paddingRight: 12 }}>Alamat</td><td>{customer.address}</td></tr>
                <tr><td style={{ fontWeight: 600, paddingRight: 12 }}>Kota</td><td>{customer.city}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Order History Section */}
          <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#222' }}>Riwayat Pesanan</h2>
            {orders.length === 0 ? (
              <p style={{ color: '#666' }}>Belum ada pesanan untuk customer ini.</p>
            ) : (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, marginBottom: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#666', fontSize: 13 }}>Total Kuantitas</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#2563eb' }}>{orderStats.totalQty.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#666', fontSize: 13 }}>Total Revenue</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#059669' }}>Rp {orderStats.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#666', fontSize: 13 }}>Order Pertama</span>
                    <span style={{ fontWeight: 600 }}>{orderStats.firstOrderDate ? new Date(orderStats.firstOrderDate).toLocaleDateString() : '-'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#666', fontSize: 13 }}>Order Terakhir</span>
                    <span style={{ fontWeight: 600 }}>{orderStats.lastOrderDate ? new Date(orderStats.lastOrderDate).toLocaleDateString() : '-'}</span>
                  </div>
                </div>
                <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <table style={{ width: '100%', background: '#fff', color: '#222', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ color: '#666', background: '#e5e7eb', textAlign: 'left' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tanggal</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>No. Invoice</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>Kuantitas</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>Total (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const qty = order.order_items?.reduce((sum: number, item: any) => sum + (item.qty || 0), 0) || 0;
                        const total = order.order_items?.reduce((sum: number, item: any) => sum + ((item.qty || 0) * (item.price || 0)), 0) || 0;
                        return (
                          <tr key={order.id} style={{ borderTop: '1px solid #e5e7eb', background: '#fff' }}>
                            <td style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>{order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</td>
                            <td style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>{order.invoice_no || '-'}</td>
                            <td style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>{qty.toLocaleString()}</td>
                            <td style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>Rp {total.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
        {/* WhatsApp Follow Up Section */}
        <div id="wa-followup-section" style={{ background: '#232b36', borderRadius: 12, padding: 24, marginTop: 24, color: '#222', boxShadow: '0 2px 12px #eee', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#232b36', opacity: 0.8 }}>Follow Up WhatsApp</h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #444', background: '#232b36', color: '#fff', outline: 'none' }}
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
                  style={{ background: '#22c55e', color: '#fff', padding: '8px 16px', borderRadius: 6, fontWeight: 600, boxShadow: '0 1px 4px #0002', border: 'none', cursor: 'pointer', opacity: sending || !selectedSession ? 0.6 : 1 }}
                  disabled={sending || !selectedSession}
                >
                  {sending ? 'Mengirim...' : 'Kirim via WhatsApp'}
                </button>
              )}
            </div>
          </div>
          {waStatus !== 'idle' && (
            <div style={{ fontSize: 14, color: waStatus==='sent' ? '#22c55e' : waStatus==='failed' ? '#ef4444' : '#eab308' }}>{waStatusMsg}</div>
          )}
          <textarea
            style={{ width: '100%', background: '#18202b', color: '#fff', borderRadius: 8, padding: 12, border: '1px solid #444', outline: 'none', fontSize: 16, marginTop: 8, minHeight: 90 }}
            rows={4}
            value={waMessage}
            onChange={e => setWaMessage(e.target.value)}
          />
        </div>

        <button onClick={() => navigate(-1)} style={{ marginTop: 24, padding: '10px 24px', background: '#2563eb', color: '#fff', borderRadius: 8, fontWeight: 600, border: 'none', fontSize: 16, cursor: 'pointer', boxShadow: '0 1px 4px #0001' }}>Kembali</button>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
