import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getCustomers, getOrders, Customer } from '../services/supabaseService';
import Navbar2 from '../components/Navbar2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

// Default icon fix for leaflet in React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Cek dan perbaiki koordinat kota besar Indonesia
const CITY_COORDS: Record<string, [number, number]> = {
  "Jakarta": [-6.2088, 106.8456],      // DKI Jakarta
  "Bandung": [-6.9175, 107.6191],      // Jawa Barat
  "Surabaya": [-7.2575, 112.7521],     // Jawa Timur
  "Medan": [3.5952, 98.6722],          // Sumatera Utara
  "Semarang": [-6.9667, 110.4167],     // Jawa Tengah
  "Palembang": [-2.9909, 104.7566],    // Sumatera Selatan
  "Makassar": [-5.1477, 119.4327],     // Sulawesi Selatan
  "Depok": [-6.4025, 106.7942],        // Jawa Barat
  "Tangerang": [-6.1702, 106.6319],    // Banten
  "Bekasi": [-6.2383, 106.9756],       // Jawa Barat
  "Bogor": [-6.5944, 106.7892],        // Jawa Barat
  "Padang": [-0.9471, 100.4172],       // Sumatera Barat
  "Denpasar": [-8.6705, 115.2126],     // Bali
  "Solo": [-7.5333, 110.4000],         // Jawa Tengah
  "Yogyakarta": [-7.7956, 110.3695],   // DI Yogyakarta
  "Balikpapan": [-1.2654, 116.8312],   // Kalimantan Timur
  "Malang": [-7.9797, 112.6304],       // Jawa Timur
  "Pontianak": [-0.0263, 109.3425],    // Kalimantan Barat
  "Samarinda": [-0.5022, 117.1537],    // Kalimantan Timur
  "Pekanbaru": [0.5071, 101.4478],     // Riau
  "Manado": [1.4748, 124.8421],        // Sulawesi Utara
  "Banjarmasin": [-3.3285, 114.5949],  // Kalimantan Selatan
  "Cimahi": [-6.8722, 107.5425],       // Jawa Barat
  "Batam": [1.1347, 104.0305],         // Kepulauan Riau
  "Jambi": [-1.6100, 103.6131],        // Jambi
  "Cilegon": [-6.0167, 106.0534]       // Banten
};

interface CustomerWithQty extends Customer {
  totalQty: number;
}

const shortId = (id: string) => id.length > 6 ? id.slice(0, 6) + '...' : id;

const CustomerMapPage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerWithQty[]>([]);
  const [cityFilter, setCityFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    // Fetch customers and orders, then rekap totalQty per customer
    const fetchData = async () => {
      const customerData = await getCustomers();
      // Rekap totalQty per customer
      const qtyMap: Record<string, number> = {};
      const orderData = await getOrders();
      orderData.forEach(order => {
        if (!order.customer_id) return;
        if (!qtyMap[order.customer_id]) qtyMap[order.customer_id] = 0;
        if (order.order_items) {
          qtyMap[order.customer_id] += order.order_items.reduce((sum, item) => sum + (item.qty || 0), 0);
        }
      });
      // Gabungkan ke customer
      const merged: CustomerWithQty[] = customerData.map(c => ({ ...c, totalQty: qtyMap[c.id] || 0 }));
      // Urutkan dari qty terbesar ke terkecil
      merged.sort((a, b) => b.totalQty - a.totalQty);
      setCustomers(merged);
    };
    fetchData();
  }, []);

  // Ambil daftar kota unik hasil normalisasi dari seluruh data customer
  const allNormalizedCities = Array.from(new Set(customers.map(c => normalizeCityName(c.city)).filter(Boolean))).sort();

  // Filter data berdasarkan cityFilter (dari dropdown di map)
  const filtered = customers.filter((c) => {
    const normCity = normalizeCityName(c.city);
    if (!cityFilter) return true; // jika tidak ada filter, tampilkan semua
    return normCity === cityFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => { setCurrentPage(1); }, [cityFilter]);

  // --- Export PDF ---
  const handleExportPDF = async () => {
    const input = document.getElementById('customer-table-section');
    if (!input) return;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' });
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);
    const imgWidth = imgProps.width * ratio;
    const imgHeight = imgProps.height * ratio;
    pdf.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, 20, imgWidth, imgHeight);
    pdf.save('customer-order-volume.pdf');
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar2 />
      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Peta Lokasi Customer</h1>
        {/* Dropdown filter city */}
        <div className="mb-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="cityFilter" className="text-gray-700 font-medium">Filter kota:</label>
            <select
              id="cityFilter"
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              className="border rounded px-2 py-1 bg-white text-gray-900"
            >
              <option value="">Semua Kota</option>
              {allNormalizedCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          {/* Dropdown filter jumlah data tampil */}
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="text-gray-700 font-medium">Tampilkan:</label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              className="border rounded px-2 py-1 bg-white text-gray-900"
            >
              {[10, 20, 50, 500, 1000].map(size => (
                <option key={size} value={size}>{size} data</option>
              ))}
            </select>
          </div>
        </div>
        <div className="border rounded mb-6" style={{ height: '350px', width: '100%', minHeight: 200, background: 'white' }}>
          <MapContainer center={filtered[0] ? (CITY_COORDS[normalizeCityName(filtered[0].city)] || CITY_COORDS['Jakarta']) : [-2.5, 118.0]} zoom={6} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Tampilkan marker hanya untuk hasil filter city */}
            {filtered.map(c => {
              const normalizedCity = normalizeCityName(c.city);
              const coords = CITY_COORDS[normalizedCity] || CITY_COORDS['Jakarta'];
              return (
                <Marker key={c.id} position={coords}>
                  <Popup>
                    <div>
                      <div><b>ID:</b> {shortId(c.id)}</div>
                      <div><b>Nama:</b> {c.name}</div>
                      <div><b>Alamat:</b> {c.address || '-'}</div>
                      <div><b>Kota:</b> {normalizedCity || '-'}</div>
                      <div><b>Total Qty:</b> <span className="font-semibold text-blue-700">{c.totalQty?.toLocaleString() || 0}</span></div>
                      <div className="mt-2 inline-block px-2 py-1 rounded bg-yellow-200 text-yellow-800 text-xs font-bold">TOP BUYER</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
        {/* Table customer */}
        <div className="overflow-x-auto mt-4" id="customer-table-section">
          {/* Tombol Export PDF */}
          <div className="flex justify-end mt-2">
            <button
              onClick={handleExportPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold shadow"
            >
              Export PDF
            </button>
          </div>
          <table className="min-w-full bg-white rounded-lg">
            <thead>
              <tr className="text-gray-600 text-left">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Nama</th>
                <th className="py-3 px-4">Alamat</th>
                <th className="py-3 px-4">Kota</th>
                <th className="py-3 px-4 text-right">Total Qty</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(c => (
                <tr key={c.id} className="border-t border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-4 text-gray-700">{shortId(c.id)}</td>
                  <td className="py-3 px-4 text-gray-900">{c.name}</td>
                  <td className="py-3 px-4 text-gray-900">{c.address || '-'}</td>
                  <td className="py-3 px-4 text-gray-900">{normalizeCityName(c.city) || '-'}</td>
                  <td className="py-3 px-4 text-right font-semibold text-blue-700">{c.totalQty?.toLocaleString() || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 mt-4">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="px-2 py-1 rounded bg-gray-200 disabled:bg-gray-100">First</button>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-2 py-1 rounded bg-gray-200 disabled:bg-gray-100">Prev</button>
          <span className="mx-2 text-gray-700">Halaman {currentPage} dari {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-2 py-1 rounded bg-gray-200 disabled:bg-gray-100">Next</button>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="px-2 py-1 rounded bg-gray-200 disabled:bg-gray-100">Last</button>
        </div>
      </main>
    </div>
  );
};

// Fungsi normalisasi nama kota ke bentuk baku (key CITY_COORDS)
function normalizeCityName(city: string | null | undefined): string {
  if (!city) return '';
  const c = city.trim().toLowerCase();
  if (["jakarta", "jakarta selatan", "jakarta barat", "jakarta timur", "jakpus", "jaktim", "jakarta pusat"].includes(c)) return "Jakarta";
  if (["bekasi timur", "kabupaten bekas", "kalog bekasi"].includes(c)) return "Bekasi";
  if (["tanggerang", "tangerang, banten", "tangsel"].includes(c)) return "Tangerang";
  if (["denpasar, bali"].includes(c)) return "Denpasar";
  if (["jogja"].includes(c)) return "Yogyakarta";
  if (["surakarta"].includes(c)) return "Solo";
  if (["sumatera"].includes(c)) return "Medan";
  if (["bali"].includes(c)) return "Denpasar";
  if (["banten"].includes(c)) return "Tangerang";
  if (["riau"].includes(c)) return "Pekanbaru";
  if (["indonesia", "ok", "thailand", "malaysia", "murotai", "martapura", "ternate, maluku utara"].includes(c)) return '';
  // fallback: kapitalisasi kata pertama
  return city.charAt(0).toUpperCase() + city.slice(1);
}

export default CustomerMapPage;
