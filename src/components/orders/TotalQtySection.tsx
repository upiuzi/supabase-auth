import { Batch } from '../../type/order';

import { Order } from '../../type/schema';

interface TotalQtySectionProps {
  filteredOrders: Order[];
  batches: Batch[];
}

const TotalQtySection: React.FC<TotalQtySectionProps> = ({ filteredOrders, batches }) => {
  // --- 1. TOTAL PRODUKSI ---
  // Cari batchIdFilter dari URL path param (bukan query param)
  let filteredBatches = batches;
  let batchIdFilter: string | null = null;
  if (typeof window !== 'undefined') {
    const match = window.location.pathname.match(/orderbatch\/?([\w-]+)/);
    batchIdFilter = match && match[1] ? match[1] : null;
    if (batchIdFilter) {
      filteredBatches = batches.filter(b => b.id === batchIdFilter);
    }
  }
  // Key: `${batchId}-${productId}`
  const totalProduksi: Record<string, { productId: string; batchId: string; productName: string; initialQty: number }> = {};
  filteredBatches.forEach((batch) => {
    if (batch.batch_products) {
      batch.batch_products.forEach((bp) => {
        const key = `${batch.id}-${bp.product_id}`;
        totalProduksi[key] = {
          productId: bp.product_id,
          batchId: batch.id,
          productName: bp.product?.name || 'Unknown Product',
          initialQty: bp.initial_qty || 0,
        };
      });
    }
  });

  // --- 2. TOTAL ORDER ---
  // Key: `${batchId}-${productId}`
  const totalOrder: Record<string, number> = {};
  filteredOrders.forEach((order) => {
    if (order.order_items) {
      order.order_items.forEach((item) => {
        // Hanya hitung order yang batch_id-nya sesuai batch filter (atau semua jika tidak ada filter)
        if (!batchIdFilter || order.batch_id === batchIdFilter) {
          const key = `${order.batch_id}-${item.product_id}`;
          if (!totalOrder[key]) totalOrder[key] = 0;
          totalOrder[key] += item.qty;
        }
      });
    }
  });

  // --- AGGREGATE BY PRODUCT NAME ---
  // 1. Total Produksi
  const totalProduksiByProduct: Record<string, number> = {};
  Object.values(totalProduksi).forEach((data) => {
    if (!totalProduksiByProduct[data.productName]) totalProduksiByProduct[data.productName] = 0;
    totalProduksiByProduct[data.productName] += data.initialQty;
  });

  // 2. Total Order
  const totalOrderByProduct: Record<string, number> = {};
  Object.entries(totalProduksi).forEach(([key, data]) => {
    const qty = totalOrder[key] || 0;
    if (!totalOrderByProduct[data.productName]) totalOrderByProduct[data.productName] = 0;
    totalOrderByProduct[data.productName] += qty;
  });

  // 3. Sisa Produksi
  const sisaProduksiByProduct: Record<string, number> = {};
  Object.keys(totalProduksiByProduct).forEach((productName) => {
    const produksi = totalProduksiByProduct[productName] || 0;
    const order = totalOrderByProduct[productName] || 0;
    sisaProduksiByProduct[productName] = produksi - order;
  });

  // Helper untuk format jerigen
  const formatWithJerigen = (qty: number) => {
    const jerigen = Math.floor(qty / 19);
    return `${qty} kg / ${jerigen} jerigen`;
  };

  // --- FIX: Untuk Total Produksi, tampilkan hasil agregasi by product saja (bukan urutan batch) ---
  // Urutkan agar VCO A selalu di atas, lalu VCO B, lalu produk lain (jika ada)
  let productNames = Object.keys(totalProduksiByProduct);
  productNames = productNames.sort((a, b) => {
    if (a === 'VCO A') return -1;
    if (b === 'VCO A') return 1;
    if (a === 'VCO B') return -1;
    if (b === 'VCO B') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* TOTAL PRODUKSI */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-bold text-white mb-2">Total Produksi</h2>
        {productNames.length === 0 ? (
          <p className="text-gray-400">No batch data.</p>
        ) : (
          <ul className="space-y-2" role="list" aria-label="Total production quantities">
            {productNames.map((productName) => (
              <li key={productName} className="text-gray-200">
                <span className="font-medium">{productName}</span>: {formatWithJerigen(totalProduksiByProduct[productName] || 0)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* TOTAL ORDER */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-bold text-white mb-2">Total Order</h2>
        {productNames.length === 0 ? (
          <p className="text-gray-400">No batch data.</p>
        ) : (
          <ul className="space-y-2" role="list" aria-label="Total ordered quantities">
            {productNames.map((productName) => (
              <li key={productName} className="text-gray-200">
                <span className="font-medium">{productName}</span>: {formatWithJerigen(totalOrderByProduct[productName] || 0)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* SISA PRODUKSI */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-bold text-white mb-2">Sisa Produksi</h2>
        {productNames.length === 0 ? (
          <p className="text-gray-400">No batch data.</p>
        ) : (
          <ul className="space-y-2" role="list" aria-label="Remaining production quantities">
            {productNames.map((productName) => (
              <li key={productName} className="text-gray-200">
                <span className="font-medium">{productName}</span>: {formatWithJerigen(sisaProduksiByProduct[productName] || 0)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TotalQtySection;