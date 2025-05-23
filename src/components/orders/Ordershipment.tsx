import { useState } from 'react';
import { toPng } from 'html-to-image';
import { Customer, Batch } from '../../type/order';
import { Order, Company, BankAccount } from '../../type/schema';
import { updateOrderExpeditionDescription } from '../../services/orderShipmentService';

interface OrderShipment {
  key?: 'orders' | 'shipment'; // Optional key prop
  orders: Order[]; // Added missing orders prop
  filteredOrders: Order[];
  customers: Customer[];
  batches: Batch[];
  companies: Company[];
  bankAccounts: BankAccount[];
  loading: boolean;
  selectedOrders: string[];
  itemsPerPage: number;
  currentPage: number;
  tableType: 'orders' | 'shipment';
  onPageChange: (page: number) => void;
  onSelectOrder: (orderId: string) => void;
  batchTitle?: string; // Added batchTitle prop
}

const OrderTable: React.FC<OrderShipment> = ({
  filteredOrders,
  customers,
  batches,
  loading,
  selectedOrders,
  itemsPerPage,
  currentPage,
  tableType,
  onPageChange,
  onSelectOrder,
  batchTitle, // Added batchTitle prop
}) => {
  console.log('OrderTable rendered with tableType:', tableType);

  // const tableRef = useRef<HTMLDivElement>(null); // Removed: unused variable
  const [sortByExpedition, setSortByExpedition] = useState(true);
  const [editedOrders, setEditedOrders] = useState<Record<string, Partial<Order>>>({});
  const [loadingSave, setLoadingSave] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const handleExportToPNG = async () => {
    const tableElement = document.getElementById('order-table');
    if (!tableElement) {
      alert('Table element not found!');
      return;
    }
    try {
      const dataUrl = await toPng(tableElement, { backgroundColor: '#1F2937', cacheBust: true });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `order-table-${tableType}-${new Date().toISOString()}.png`;
      link.click();
    } catch (error) {
      console.error('Error exporting table to PNG:', error);
      alert('Failed to export table to PNG');
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer ? customer.name : '-';
  };

  const getCustomerAddress = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer ? customer.address ?? '-' : '-';
  };

  const getProductName = (productId: string, batchId: string) => {
    const batch = batches.find((b) => b.id === batchId);
    if (batch && batch.batch_products) {
      const batchProduct = batch.batch_products.find((bp) => bp.product_id === productId);
      if (batchProduct && batchProduct.product) {
        return batchProduct.product.name || 'Unknown Product';
      }
    }
    return 'Unknown Product';
  };

  // Removed unused function to fix TS6133 lint error
  // const getTotalAmount = (order: Order) => {
  //   if (!order.order_items) return 0;
  //   return order.order_items.reduce((total, item) => total + item.price * item.qty, 0);
  // };

  const handleSortByExpedition = () => {
    setSortByExpedition(!sortByExpedition);
  };

  const handleExpeditionChange = (orderId: string, value: string) => {
    setEditedOrders((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], expedition: value },
    }));
    // Optionally, update to backend here
  };

  const handleDescriptionChange = (orderId: string, value: string) => {
    setEditedOrders((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], description: value },
    }));
    // Optionally, update to backend here
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  let currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  if (sortByExpedition && tableType === 'shipment') {
    currentItems = [...currentItems].sort((a, b) => {
      const expeditionA = a.expedition || '-';
      const expeditionB = b.expedition || '-';
      return expeditionA.localeCompare(expeditionB);
    });
  }

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const getPaginationButtons = () => {
    const maxVisibleButtons = 5;
    const buttons: (number | string)[] = [];
    let startPage: number;
    let endPage: number;

    if (totalPages <= maxVisibleButtons) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const halfVisible = Math.floor(maxVisibleButtons / 2);
      startPage = Math.max(1, currentPage - halfVisible);
      endPage = Math.min(totalPages, currentPage + halfVisible);

      if (endPage - startPage + 1 < maxVisibleButtons) {
        if (currentPage <= halfVisible + 1) {
          endPage = maxVisibleButtons;
        } else {
          startPage = totalPages - maxVisibleButtons + 1;
        }
      }
    }

    if (startPage > 1) {
      buttons.push(1);
      if (startPage > 2) buttons.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) buttons.push('...');
      buttons.push(totalPages);
    }

    return buttons;
  };

  const getInvoiceNo = (order: Order) => order.invoice_no || order.id;

  const handleEditButtonClick = async () => {
    if (!editMode) {
      setEditMode(true);
    } else {
      setLoadingSave(true);
      try {
        for (const orderId in editedOrders) {
          const changes = editedOrders[orderId];
          await updateOrderExpeditionDescription(orderId, {
            expedition: changes.expedition,
            description: changes.description,
          });
        }
        setEditedOrders({});
        setEditMode(false);
        alert('Perubahan berhasil disimpan!');
      } catch (e) {
        alert('Gagal menyimpan perubahan!');
      } finally {
        setLoadingSave(false);
      }
    }
  };

  return (
    <>
      
      <div className="flex flex-wrap gap-2 items-center justify-end mb-4">
        <button
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm font-semibold"
          onClick={handleEditButtonClick}
          disabled={loadingSave}
          style={{ minWidth: 170 }}
        >
          <span className="text-lg">+</span> Edit Data
        </button>
        <button
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm font-semibold"
          onClick={handleSortByExpedition}
          style={{ minWidth: 170 }}
        >
          <span className="text-lg">≡</span> Sort by Expedition
        </button>
        <button
          className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-semibold"
          onClick={handleExportToPNG}
          style={{ minWidth: 170 }}
        >
          <span className="text-lg">▢</span> Export to PNG
        </button>
      </div>

      {/* --- BATCH TITLE --- */}
      {tableType === 'orders' && batchTitle && (
        <div className="mb-2 text-lg font-semibold text-blue-400">Batch: {batchTitle}</div>
      )}

      <div className="overflow-x-auto export-compatible rounded-lg border border-gray-200">
        <table id="order-table" className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="text-gray-700 text-left border-b border-gray-300 bg-gray-50">
              <th className="py-3 px-4 w-16 font-semibold text-gray-700 border-r border-gray-300"> </th>
              <th className="py-3 px-4 font-semibold text-gray-700 border-r border-gray-300">Invoice No</th>
              <th className="py-3 px-4 font-semibold text-gray-700 border-r border-gray-300">Customer</th>
              <th className="py-3 px-4 font-semibold text-gray-700 border-r border-gray-300">Customer Address</th>
              <th className="py-3 px-4 font-semibold text-gray-700 border-r border-gray-300">Expedition</th>
              <th className="py-3 px-4 font-semibold text-gray-700 border-r border-gray-300">Product</th>
              <th className="py-3 px-4 font-semibold text-gray-700 border-r border-gray-300">Jerigen</th>
              <th className="py-3 px-4 font-semibold text-gray-700 border-r border-gray-300">Description</th>
              <th className="py-3 px-4 font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-10 text-gray-400 bg-white">No orders found.</td>
              </tr>
            ) : (
              currentItems.map((order) => {
                const orderItems = order.order_items || [];
                const rowSpan = orderItems.length > 0 ? orderItems.length : 1;
                return orderItems.length === 0 ? (
                  <tr key={order.id} className="border-b border-gray-300 bg-white">
                    <td className="py-4 px-4 border-r border-gray-300" rowSpan={1}>
                      <input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => onSelectOrder(order.id)} disabled={loading} className="rounded w-4 h-4 text-blue-500 focus:ring-blue-500" />
                    </td>
                    <td className="py-4 px-4 text-gray-900 border-r border-gray-300" rowSpan={1}>{getInvoiceNo(order)}</td>
                    <td className="py-4 px-4 text-gray-900 border-r border-gray-300" rowSpan={1}>{getCustomerName(order.customer_id)}</td>
                    <td className="py-4 px-4 text-gray-900 border-r border-gray-300" rowSpan={1}>{getCustomerAddress(order.customer_id)}</td>
                    <td className="py-4 px-4 text-gray-900 border-r border-gray-300" rowSpan={1}>
                      <input
                        className="w-full px-2 py-1 rounded border border-gray-300 text-gray-900 bg-white"
                        value={editedOrders[order.id]?.expedition ?? order.expedition ?? ''}
                        onChange={(e) => handleExpeditionChange(order.id, e.target.value)}
                        disabled={!editMode}
                      />
                    </td>
                    <td className="py-4 px-4 text-right border-r border-gray-300">-</td>
                    <td className="py-4 px-4 border-r border-gray-300">
                      <input
                        className="w-full px-2 py-1 rounded border border-gray-300 text-gray-900 bg-white"
                        value={editedOrders[order.id]?.description ?? order.description ?? ''}
                        onChange={(e) => handleDescriptionChange(order.id, e.target.value)}
                        disabled={!editMode}
                      />
                    </td>
                    <td className="py-4 px-4">{order.status}</td>
                  </tr>
                ) : (
                  orderItems.map((item) => (
                    <tr key={order.id + '-' + item.product_id} className="bg-white border-b border-gray-300">
                      {item.product_id === orderItems[0].product_id && (
                        <>
                          <td className="py-4 px-4 border-r border-gray-300" rowSpan={rowSpan}>
                            <input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => onSelectOrder(order.id)} disabled={loading} className="rounded w-4 h-4 text-blue-500 focus:ring-blue-500" />
                          </td>
                          <td className="py-4 px-4 text-gray-900 border-r border-gray-300" rowSpan={rowSpan}>{getInvoiceNo(order)}</td>
                          <td className="py-4 px-4 text-gray-900 border-r border-gray-300" rowSpan={rowSpan}>{getCustomerName(order.customer_id)}</td>
                          <td className="py-4 px-4 text-gray-900 border-r border-gray-300" rowSpan={rowSpan}>{getCustomerAddress(order.customer_id)}</td>
                          <td className="py-4 px-4 text-gray-900 border-r border-gray-300" rowSpan={rowSpan}>
                            <input
                              className="w-full px-2 py-1 rounded border border-gray-300 text-gray-900 bg-white"
                              value={editedOrders[order.id]?.expedition ?? order.expedition ?? ''}
                              onChange={(e) => handleExpeditionChange(order.id, e.target.value)}
                              disabled={!editMode}
                            />
                          </td>
                        </>
                      )}
                      <td className="py-4 px-4 text-gray-900 align-top border-r border-gray-300">{getProductName(item.product_id, order.batch_id)}</td>
                      <td className="py-4 px-4 text-right align-top border-r border-gray-300">{Math.floor(item.qty / 19)}</td>
                      {item.product_id === orderItems[0].product_id && (
                        <td className="py-4 px-4 text-gray-900 border-r border-gray-300" rowSpan={rowSpan}>
                          <input
                            className="w-full px-2 py-1 rounded border border-gray-300 text-gray-900 bg-white"
                            value={editedOrders[order.id]?.description ?? order.description ?? ''}
                            onChange={(e) => handleDescriptionChange(order.id, e.target.value)}
                            disabled={!editMode}
                          />
                        </td>
                      )}
                      <td className="py-4 px-4" rowSpan={rowSpan}>{order.status}</td>
                    </tr>
                  ))
                );
              })
            )}
            <tr className="border-t border-gray-200 font-bold bg-gray-50">
              <td colSpan={6} className="py-4 px-4 text-right border-r border-gray-300">Total</td>
              <td colSpan={3} className="py-4 px-4 border-r border-gray-300"></td>
              <td className="py-4 px-4"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {filteredOrders.length > 0 && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-gray-400">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrders.length)} of{' '}
            {filteredOrders.length} entries
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 font-medium"
            >
              First
            </button>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 font-medium"
            >
              Previous
            </button>
            {getPaginationButtons().map((page) => (
              <button
                key={page}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={typeof page !== 'number' || loading}
                className={`px-4 py-2 rounded font-medium ${
                  page === currentPage
                    ? 'bg-blue-500 text-white border border-blue-500'
                    : typeof page === 'number'
                    ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    : 'bg-white border border-gray-100 text-gray-400 cursor-default'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 font-medium"
            >
              Next
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 font-medium"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderTable;