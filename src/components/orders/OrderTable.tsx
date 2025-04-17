import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Order, Customer, Batch } from '../../type/order';

interface OrderTableProps {
  orders: Order[];
  filteredOrders: Order[];
  customers: Customer[];
  batches: Batch[];
  loading: boolean;
  selectedOrders: string[];
  itemsPerPage: number;
  currentPage: number;
  tableType: 'orders' | 'shipment';
  onSelectOrder: (orderId: string) => void;
  onSelectAll: () => void;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  onEditQty: (orderId: string, productId: string, qty: number) => void;
  onViewDetails: (order: Order) => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onStatusChange: (orderId: string, status: 'pending' | 'confirmed' | 'cancelled') => void;
  onEditShipment: (order: Order) => void;
}

const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  filteredOrders,
  customers,
  batches,
  loading,
  selectedOrders,
  itemsPerPage,
  currentPage,
  tableType,
  onSelectOrder,
  onSelectAll,
  onPageChange,
  onItemsPerPageChange,
  onEditQty,
  onViewDetails,
  onEditOrder,
  onDeleteOrder,
  onStatusChange,
  onEditShipment,
}) => {
  console.log('OrderTable rendered with tableType:', tableType);

  const tableRef = useRef<HTMLDivElement>(null);
  const [sortByExpedition, setSortByExpedition] = useState(false);

  const handleExportToPNG = async () => {
    if (tableRef.current) {
      try {
        const tableClone = tableRef.current.cloneNode(true) as HTMLElement;
        tableClone.style.backgroundColor = '#1F2937';
        tableClone.style.color = '#FFFFFF';
        const tableElement = tableClone.querySelector('table') as HTMLElement;
        if (tableElement) {
          tableElement.style.backgroundColor = '#1F2937';
        }

        const rows = tableClone.querySelectorAll('tr');
        rows.forEach((row) => {
          const cells = row.querySelectorAll('th, td');
          if (cells.length > 0) {
            const lastCell = cells[cells.length - 1] as HTMLElement;
            lastCell.style.display = 'none';
          }
        });

        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

        const statusCells = tableClone.querySelectorAll('tbody tr:not(:last-child) td:nth-child(9)');
        statusCells.forEach((cell, index) => {
          if (index < currentItems.length) {
            const order = currentItems[index];
            const status = order.status;
            const statusText = status.charAt(0).toUpperCase() + status.slice(1);
            const statusSpan = document.createElement('span');
            statusSpan.textContent = statusText;
            const statusClasses = getStatusColor(status).split(' ').filter((cls) =>
              cls.startsWith('bg-') || cls.startsWith('text-')
            );
            statusSpan.className = statusClasses.join(' ');
            statusSpan.style.backgroundColor = getStatusColor(status).includes('bg-[#4A2F00]') ? '#4A2F00' :
                                              getStatusColor(status).includes('bg-[#003087]') ? '#003087' :
                                              getStatusColor(status).includes('bg-[#8B0000]') ? '#8B0000' : '#374151';
            statusSpan.style.color = getStatusColor(status).includes('text-[#FFD700]') ? '#FFD700' :
                                     getStatusColor(status).includes('text-[#FFFFFF]') ? '#FFFFFF' :
                                     getStatusColor(status).includes('text-[#FFB6C1]') ? '#FFB6C1' : '#D1D5DB';
            statusSpan.style.padding = '4px 12px';
            statusSpan.style.borderRadius = '9999px';
            statusSpan.style.display = 'inline-block';
            cell.innerHTML = '';
            cell.appendChild(statusSpan);
          }
        });

        const replaceOklchColors = (element: HTMLElement) => {
          const computedStyle = window.getComputedStyle(element);
          if (computedStyle.backgroundColor.includes('oklch')) {
            element.style.backgroundColor = '#1F2937';
          }
          if (computedStyle.color.includes('oklch')) {
            element.style.color = '#FFFFFF';
          }
          if (computedStyle.borderColor.includes('oklch')) {
            element.style.borderColor = '#374151';
          }
          ['fill', 'stroke'].forEach((prop) => {
            if (computedStyle.getPropertyValue(prop).includes('oklch')) {
              element.style.setProperty(prop, '#FFFFFF');
            }
          });
          Array.from(element.children).forEach((child) =>
            replaceOklchColors(child as HTMLElement)
          );
        };

        replaceOklchColors(tableClone);

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.backgroundColor = '#1F2937';
        tempContainer.appendChild(tableClone);
        document.body.appendChild(tempContainer);

        console.log('Cloned table HTML before export:', tableClone.outerHTML);

        const canvas = await html2canvas(tempContainer, {
          backgroundColor: '#1F2937',
          scale: 3,
          useCORS: true,
        });

        document.body.removeChild(tempContainer);

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `order-table-${tableType}-${new Date().toISOString()}.png`;
        link.click();
      } catch (error) {
        console.error('Error exporting camps to PNG:', error);
        alert('Failed to export table to PNG');
      }
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer ? customer.name : '-';
  };

  const getCustomerPhone = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.phone || '-';
  };

  const getCustomerAddress = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.address || '-';
  };

  const getBatchId = (batchId: string) => {
    const batch = batches.find((b) => b.id === batchId);
    return batch ? batch.batch_id : '-';
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

  const getTotalAmount = (order: Order) => {
    if (!order.order_items) return 0;
    return order.order_items.reduce((total, item) => total + item.price * item.qty, 0);
  };

  const getTotalQtyAllProducts = (order: Order) => {
    if (!order.order_items) return 0;
    return order.order_items.reduce((total, item) => total + item.qty, 0);
  };

  const getOverallTotalAmount = () => {
    return filteredOrders.reduce((total, order) => total + getTotalAmount(order), 0);
  };

  const getOverallTotalQtyAllProducts = () => {
    return filteredOrders.reduce((total, order) => total + getTotalQtyAllProducts(order), 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-[#4A2F00] text-[#FFD700]';
      case 'pending':
        return 'bg-[#003087] text-[#FFFFFF]';
      case 'cancelled':
        return 'bg-[#8B0000] text-[#FFB6C1]';
      default:
        return 'bg-[#374151] text-[#D1D5DB]';
    }
  };

  const handleSortByExpedition = () => {
    setSortByExpedition(!sortByExpedition);
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

  return (
    <>
      <style>
        {`
          .export-compatible {
            background-color: #1F2937;
            color: #FFFFFF;
          }
          .export-compatible table {
            background-color: #1F2937;
          }
          .export-compatible th {
            background-color: #1F2937;
            color: #9CA3AF;
          }
          .export-compatible td {
            color: #FFFFFF;
          }
          .export-compatible select {
            color: #FFFFFF;
          }
          .export-compatible .bg-gray-700 {
            background-color: #374151;
          }
          .export-compatible .text-gray-300 {
            color: #D1D5DB;
          }
          .export-compatible .text-gray-400 {
            color: #9CA3AF;
          }
          .export-compatible .bg-blue-500 {
            background-color: #3B82F6;
          }
          .export-compatible .bg-green-500 {
            background-color: #10B981;
          }
          .export-compatible .bg-yellow-900 {
            background-color: #4A2F00;
          }
          .export-compatible .text-yellow-200 {
            color: #FFD700;
          }
          .export-compatible .bg-blue-900 {
            background-color: #003087;
          }
          .export-compatible .text-blue-200 {
            color: #87CEEB;
          }
          .export-compatible .bg-red-900 {
            background-color: #8B0000;
          }
          .export-compatible .text-red-200 {
            color: #FFB6C1;
          }
          .export-compatible .border-gray-700 {
            border-color: #374151;
          }
          .export-compatible .hover\\:bg-gray-600:hover {
            background-color: #4B5563;
          }
          .export-compatible .hover\\:text-green-400:hover {
            color: #34D399;
          }
          .export-compatible .hover\\:text-blue-400:hover {
            color: #60A5FA;
          }
          .export-compatible .hover\\:text-yellow-400:hover {
            color: #FBBF24;
          }
          .export-compatible .hover\\:text-red-400:hover {
            color: #F87171;
          }
          .export-compatible .bg-gray-800 {
            background-color: #1F2937;
          }
          .export-compatible .disabled\\:bg-gray-800:disabled {
            background-color: #1F2937;
          }
          .export-compatible .disabled\\:text-gray-500:disabled {
            color: #6B7280;
          }
          .export-compatible .disabled\\:bg-green-300:disabled {
            background-color: #6EE7B7;
          }
          .export-compatible .border-gray-600 {
            border-color: #4B5563;
          }
          .export-compatible .text-blue-500 {
            color: #3B82F6;
          }
          .export-compatible .focus\\:ring-blue-500:focus {
            --tw-ring-color: #3B82F6;
          }
        `}
      </style>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <label className="text-gray-300">Show per page:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div className="flex gap-2">
          {tableType === 'shipment' && (
            <button
              onClick={handleSortByExpedition}
              disabled={loading}
              className={`px-4 py-2 rounded flex items-center gap-2 text-white ${
                sortByExpedition ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              } disabled:bg-gray-800 disabled:text-gray-500`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                />
              </svg>
              {sortByExpedition ? 'Sorted by Expedition' : 'Sort by Expedition'}
            </button>
          )}
          <button
            onClick={handleExportToPNG}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-green-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export to PNG
          </button>
        </div>
      </div>

      <div className="overflow-x-auto export-compatible" ref={tableRef}>
        <table className="min-w-full bg-gray-800 rounded-lg">
          <thead>
            <tr className="text-gray-400 text-left">
              <th className="py-3 px-4 w-16">
                <input
                  type="checkbox"
                  checked={selectedOrders.length === currentItems.length && currentItems.length > 0}
                  onChange={onSelectAll}
                  disabled={loading}
                  className="rounded w-4 h-4 text-blue-500 focus:ring-blue-500"
                />
              </th>
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Batch</th>
              {tableType === 'orders' ? (
                <>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Amount</th>
                </>
              ) : (
                <>
                  <th className="py-3 px-4">Shipment</th>
                  <th className="py-3 px-4">Customer Phone</th>
                  <th className="py-3 px-4">Customer Address</th>
                  <th className="py-3 px-4">Noted</th>
                </>
              )}
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((order, index) => (
              <tr key={order.id} className="border-t border-gray-700 hover:bg-gray-700">
                <td className="py-4 px-4">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => onSelectOrder(order.id)}
                    disabled={loading}
                    className="rounded w-4 h-4 text-blue-500 focus:ring-blue-500"
                  />
                </td>
                <td className="py-4 px-4 text-gray-300">{'order' + (indexOfFirstItem + index + 1)}</td>
                <td className="py-4 px-4 text-white">{getCustomerName(order.customer_id)}</td>
                <td className="py-4 px-4 text-white">{getBatchId(order.batch_id)}</td>
                {tableType === 'orders' ? (
                  <>
                    <td className="py-4 px-4 text-white">
                      {order.order_items && order.order_items.length > 0 ? (
                        <div className="space-y-1">
                          {order.order_items.map((item, idx) => (
                            <div key={idx}>{getProductName(item.product_id, order.batch_id)}</div>
                          ))}
                        </div>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-white">
                      {order.order_items && order.order_items.length > 0 ? (
                        <div className="space-y-1">
                          {order.order_items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <button
                                onClick={() => onEditQty(order.id, item.product_id, item.qty)}
                                className="text-white hover:text-gray-300 flex items-center gap-1"
                                disabled={loading}
                              >
                                {item.qty} kg
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-white">
                      {order.order_items && order.order_items.length > 0 ? (
                        <div className="space-y-1">
                          {order.order_items.map((item, idx) => (
                            <div key={idx}>Rp {item.price.toLocaleString('id-ID')}</div>
                          ))}
                        </div>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-white">
                      Rp {getTotalAmount(order).toLocaleString('id-ID')},00
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-4 px-4 text-white">{order.expedition || '-'}</td>
                    <td className="py-4 px-4 text-white">{getCustomerPhone(order.customer_id)}</td>
                    <td className="py-4 px-4 text-white">{getCustomerAddress(order.customer_id)}</td>
                    <td className="py-4 px-4 text-white">{order.description || '-'}</td>
                  </>
                )}
                <td className="py-4 px-4">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      onStatusChange(order.id, e.target.value as 'pending' | 'confirmed' | 'cancelled')
                    }
                    className={`text-sm px-3 py-1 rounded-full ${getStatusColor(order.status)} focus:outline-none`}
                    disabled={loading}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="py-4 px-4 flex gap-2">
                  <button
                    onClick={() => onViewDetails(order)}
                    className="text-gray-400 hover:text-green-400"
                    disabled={loading}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-3 8a8 8 0 100-16 8 8 0 000 16z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => onEditOrder(order)}
                    className="text-gray-400 hover:text-blue-400"
                    disabled={loading}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  {tableType === 'shipment' && (
                    <button
                      onClick={() => onEditShipment(order)}
                      className="text-gray-400 hover:text-yellow-400"
                      disabled={loading}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteOrder(order.id)}
                    className="text-gray-400 hover:text-red-400"
                    disabled={loading}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M9 7v12m6-12v12M3 7h18"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {tableType === 'orders' && (
              <tr className="border-t border-gray-700 font-bold">
                <td colSpan={5} className="py-4 px-4 text-right">
                  Overall Total:
                </td>
                <td className="py-4 px-4 text-white">
                  {getOverallTotalQtyAllProducts()}
                </td>
                <td className="py-4 px-4 text-white"></td>
                <td className="py-4 px-4 text-white">
                  Rp {getOverallTotalAmount().toLocaleString('id-ID')},00
                </td>
                <td className="py-4 px-4 text-white"></td>
                <td></td>
              </tr>
            )}
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
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white"
            >
              First
            </button>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white"
            >
              Previous
            </button>
            {getPaginationButtons().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={typeof page !== 'number' || loading}
                className={`px-4 py-2 rounded ${
                  page === currentPage
                    ? 'bg-blue-500 text-white'
                    : typeof page === 'number'
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-700 text-gray-400 cursor-default'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white"
            >
              Next
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white"
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