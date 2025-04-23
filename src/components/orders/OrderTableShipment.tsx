import React, { useState } from 'react';
import { Order, Batch, Product } from '../../type/schema';
import { toPng } from 'html-to-image';
import { updateOrder } from '../../services/supabaseService';

interface OrderTableShipmentProps {
  orders: Order[];
  batches: Batch[];
  loading: boolean;
  products?: Product[];
}

const OrderTableShipment: React.FC<OrderTableShipmentProps> = ({ orders, batches, loading, products = [] }) => {
  const getBatchId = (batchId: string) => batches.find(b => b.id === batchId)?.batch_id || '-';
  const getInvoiceId = (order: Order) => order.invoice_no || order.id;
  const getProductName = (productId: string) => products.find(p => p.id === productId)?.name || productId;
  const getProductList = (order: Order) => {
    if (!order.order_items || order.order_items.length === 0) return '-';
    return order.order_items.map(item => {
      const name = getProductName(item.product_id);
      const jerigen = item.qty ? Math.round(item.qty / 19) : 0;
      return `${name} (${jerigen} jerigen)`;
    }).join(', ');
  };

  const [editOrderId, setEditOrderId] = useState<string|null>(null);
  const [editShipment, setEditShipment] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const handleEditClick = (order: Order) => {
    setEditOrderId(order.id);
    setEditShipment(order.expedition || '');
    setEditDescription(order.description || '');
  };

  const handleSave = async (order: Order) => {
    setSaving(true);
    try {
      // Pastikan hanya field valid yang dikirim ke updateOrder
      const cleanOrderItems = (order.order_items || []).map(item => ({
        product_id: item.product_id,
        qty: item.qty,
        price: item.price,
      }));
      await updateOrder(order.id, {
        ...order,
        expedition: editShipment,
        description: editDescription,
      }, cleanOrderItems);
      setEditOrderId(null);
    } catch (e: any) {
      alert('Gagal update order: ' + (e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditOrderId(null);
  };

  // Fungsi download tabel sebagai PNG
  const handleDownloadPng = async () => {
    const table = document.getElementById('shipment-table');
    if (!table) return;
    try {
      const dataUrl = await toPng(table, { backgroundColor: '#fff', cacheBust: true });
      const link = document.createElement('a');
      link.download = 'shipment_table.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting table to PNG:', error);
      alert('Failed to export table to PNG');
    }
  };

  return (
    <div className="overflow-x-auto bg-white text-gray-900 min-h-screen">
      <div className="flex justify-end mb-2">
        <button
          onClick={handleDownloadPng}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold shadow"
        >
          Download PNG
        </button>
      </div>
      <table
        id="shipment-table"
        className="min-w-full text-sm text-left bg-white border border-gray-200"
      >
        <thead className="bg-gray-100 text-gray-700 border-b border-gray-200">
          <tr>
            <th className="px-4 py-2">Invoice ID</th>
            <th className="px-4 py-2">Batch</th>
            <th className="px-4 py-2">Customer</th>
            <th className="px-4 py-2">Customer Phone</th>
            <th className="px-4 py-2">Customer Address</th>
            <th className="px-4 py-2">Shipment</th>
            <th className="px-4 py-2">Products (Qty Jerigen)</th>
            <th className="px-4 py-2">Description</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody className="text-gray-900">
          {loading ? (
            <tr><td colSpan={11} className="text-center py-4 text-gray-600">Loading...</td></tr>
          ) : orders.length === 0 ? (
            <tr><td colSpan={11} className="text-center py-4 text-gray-600">No orders available.</td></tr>
          ) : (
            orders.map(order => (
              <tr key={order.id} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2">{getInvoiceId(order)}</td>
                <td className="px-4 py-2">{getBatchId(order.batch_id)}</td>
                <td className="px-4 py-2">{order.customer?.name || '-'}</td>
                <td className="px-4 py-2">{order.customer?.phone || '-'}</td>
                <td className="px-4 py-2">{order.customer?.address || '-'}</td>
                <td className="px-4 py-2">
                  {editOrderId === order.id ? (
                    <input
                      className="border px-2 py-1 rounded w-full"
                      value={editShipment}
                      onChange={e => setEditShipment(e.target.value)}
                      disabled={saving}
                    />
                  ) : (
                    <span>{order.expedition || '-'}</span>
                  )}
                </td>
                <td className="px-4 py-2">{getProductList(order)}</td>
                <td className="px-4 py-2">
                  {editOrderId === order.id ? (
                    <input
                      className="border px-2 py-1 rounded w-full"
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      disabled={saving}
                    />
                  ) : (
                    <span>{order.description || '-'}</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <span className={`px-3 py-1 rounded font-semibold text-xs ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : order.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                </td>
                <td className="px-4 py-2">
                  {editOrderId === order.id ? (
                    <>
                      <button
                        className="bg-green-500 text-white px-2 py-1 rounded mr-2 disabled:bg-green-200"
                        onClick={() => handleSave(order)}
                        disabled={saving}
                      >Simpan</button>
                      <button
                        className="bg-gray-300 text-gray-800 px-2 py-1 rounded"
                        onClick={handleCancel}
                        disabled={saving}
                      >Batal</button>
                    </>
                  ) : (
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded"
                      onClick={() => handleEditClick(order)}
                    >Edit</button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTableShipment;
