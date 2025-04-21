import React from 'react';
import { Order, Customer, Batch, Product } from '../../type/schema';
import html2canvas from 'html2canvas';

interface OrderTableShipmentProps {
  orders: Order[];
  customers: Customer[];
  batches: Batch[];
  loading: boolean;
  products?: Product[];
}

const OrderTableShipment: React.FC<OrderTableShipmentProps> = ({ orders, customers, batches, loading, products = [] }) => {
  const getCustomerName = (customerId: string) => customers.find(c => c.id === customerId)?.name || '-';
  const getCustomerPhone = (customerId: string) => customers.find(c => c.id === customerId)?.phone || '-';
  const getCustomerAddress = (customerId: string) => customers.find(c => c.id === customerId)?.address || '-';
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

  // Fungsi download tabel sebagai PNG
  const handleDownloadPng = async () => {
    const table = document.getElementById('shipment-table');
    if (!table) return;
    const canvas = await html2canvas(table, {
      backgroundColor: '#fff', // light mode
      useCORS: true,
    });
    const link = document.createElement('a');
    link.download = 'shipment_table.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
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
            <th className="px-4 py-2">Customer</th>
            <th className="px-4 py-2">Batch</th>
            <th className="px-4 py-2">Shipment</th>
            <th className="px-4 py-2">Customer Phone</th>
            <th className="px-4 py-2">Customer Address</th>
            <th className="px-4 py-2">Products (Qty Jerigen)</th>
            <th className="px-4 py-2">Description</th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="text-gray-900">
          {loading ? (
            <tr><td colSpan={9} className="text-center py-4 text-gray-600">Loading...</td></tr>
          ) : orders.length === 0 ? (
            <tr><td colSpan={9} className="text-center py-4 text-gray-600">No orders available.</td></tr>
          ) : (
            orders.map(order => (
              <tr key={order.id} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2">{getInvoiceId(order)}</td>
                <td className="px-4 py-2">{getCustomerName(order.customer_id)}</td>
                <td className="px-4 py-2">{getBatchId(order.batch_id)}</td>
                <td className="px-4 py-2">{order.expedition || '-'}</td>
                <td className="px-4 py-2">{getCustomerPhone(order.customer_id)}</td>
                <td className="px-4 py-2">{getCustomerAddress(order.customer_id)}</td>
                <td className="px-4 py-2">{getProductList(order)}</td>
                <td className="px-4 py-2">{order.description || '-'}</td>
                <td className="px-4 py-2">
                  <span className={`px-3 py-1 rounded font-semibold text-xs ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : order.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
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
