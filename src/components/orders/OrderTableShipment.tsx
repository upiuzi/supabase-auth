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
      backgroundColor: '#222',
      useCORS: true,
    });
    const link = document.createElement('a');
    link.download = 'shipment_table.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="overflow-x-auto" style={{ background: '#222', color: '#fff', minHeight: '100vh' }}>
      <div className="flex justify-end mb-2">
        <button
          onClick={handleDownloadPng}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold shadow"
        >
          Download PNG
        </button>
      </div>
      <table
        id="shipment-table"
        style={{ background: '#222', color: '#fff', borderColor: '#444' }}
        className="min-w-full text-sm text-left"
      >
        <thead style={{ background: '#222', color: '#fff' }}>
          <tr>
            <th style={{ color: '#fff', background: '#222' }} className="px-4 py-2">Invoice ID</th>
            <th style={{ color: '#fff', background: '#222' }} className="px-4 py-2">Customer</th>
            <th style={{ color: '#fff', background: '#222' }} className="px-4 py-2">Batch</th>
            <th style={{ color: '#fff', background: '#222' }} className="px-4 py-2">Shipment</th>
            <th style={{ color: '#fff', background: '#222' }} className="px-4 py-2">Customer Phone</th>
            <th style={{ color: '#fff', background: '#222' }} className="px-4 py-2">Customer Address</th>
            <th style={{ color: '#fff', background: '#222' }} className="px-4 py-2">Products (Qty Jerigen)</th>
            <th style={{ color: '#fff', background: '#222' }} className="px-4 py-2">Description</th>
            <th style={{ color: '#fff', background: '#222' }} className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody style={{ color: '#fff' }}>
          {loading ? (
            <tr><td colSpan={9} className="text-center py-4">Loading...</td></tr>
          ) : orders.length === 0 ? (
            <tr><td colSpan={9} className="text-center py-4">No orders available.</td></tr>
          ) : (
            orders.map(order => (
              <tr key={order.id} style={{ color: '#fff', background: '#222', borderBottom: '1px solid #444' }}>
                <td className="px-4 py-2">{getInvoiceId(order)}</td>
                <td className="px-4 py-2">{getCustomerName(order.customer_id)}</td>
                <td className="px-4 py-2">{getBatchId(order.batch_id)}</td>
                <td className="px-4 py-2">{order.expedition || '-'}</td>
                <td className="px-4 py-2">{getCustomerPhone(order.customer_id)}</td>
                <td className="px-4 py-2">{getCustomerAddress(order.customer_id)}</td>
                <td className="px-4 py-2">{getProductList(order)}</td>
                <td className="px-4 py-2">{order.description || '-'}</td>
                <td className="px-4 py-2">
                  <span style={{ color: '#fff', background: order.status === 'pending' ? '#b45309' : order.status === 'confirmed' ? '#166534' : '#991b1b', padding: '2px 12px', borderRadius: 8, fontWeight: 700, fontSize: 12, display: 'inline-block' }}>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
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
