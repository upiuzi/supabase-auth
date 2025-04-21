import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Customer, Batch } from '../../type/order';
import { Order, Company, BankAccount } from '../../type/schema';

interface OrderTableProps {
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
  batchTitle?: string; // Added batchTitle prop
}

const OrderTable: React.FC<OrderTableProps> = ({
  // orders, // Added to destructure
  filteredOrders,
  customers,
  batches,
  // companies,
  // bankAccounts,
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
  batchTitle, // Added batchTitle prop
}) => {
  console.log('OrderTable rendered with tableType:', tableType);

  const tableRef = useRef<HTMLDivElement>(null);
  const [sortByExpedition, setSortByExpedition] = useState(false);

  const handleExportToPNG = async () => {
    if (tableRef.current) {
      try {
        const tableClone = tableRef.current.cloneNode(true) as HTMLElement;
        tableClone.style.backgroundColor = '#1F2937';
        tableClone.style.color = '#GGGGGG';
        const tableElement = tableClone.querySelector('table') as HTMLElement;
        if (tableElement) {
          tableElement.style.backgroundColor = '#1F2937';
        }

        // Hide Actions column
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

        // Format Status column
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

        // Replace OKLCH colors for export
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
        console.error('Error exporting table to PNG:', error);
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

  // Utility to shorten invoice number
  const getShortInvoiceNo = (invoiceNo: string) => {
    if (!invoiceNo) return '';
    if (invoiceNo.length <= 4) return invoiceNo;
    return invoiceNo.slice(0, 2) + '.....';
  };

  // const getCompanyName = (companyId: string) => {
  //   const company = companies.find((c) => c.id === companyId);
  //   return company ? company.company_name : '-';
  // };

  // const getBankAccountName = (bankAccountId: string) => {
  //   const bankAccount = bankAccounts.find((ba) => ba.id === bankAccountId);
  //   return bankAccount ? `${bankAccount.account_name} (${bankAccount.bank_name})` : '-';
  // };

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

  const getInvoiceNo = (order: Order) => order.invoice_no || order.id;

  return (
    <>
      
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

      {/* --- BATCH TITLE --- */}
      {tableType === 'orders' && batchTitle && (
        <div className="mb-2 text-lg font-semibold text-blue-400">Batch: {batchTitle}</div>
      )}

      <div className="overflow-x-auto export-compatible" ref={tableRef}>
        <table className="min-w-full bg-white rounded-lg border-separate border-spacing-0 border border-gray-200">
          <thead>
            <tr className="text-gray-700 text-left border-b border-gray-200 bg-gray-50">
              <th className="py-3 px-4 w-16 font-semibold text-gray-700"> </th>
              <th className="py-3 px-4 font-semibold text-gray-700">Invoice No</th>
              <th className="py-3 px-4 font-semibold text-gray-700">Customer</th>
              {/* <th className="py-3 px-4 font-semibold text-gray-700">Batch</th> */}
              <th className="py-3 px-4 font-semibold text-gray-700">Product</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-700">Qty (kg)</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-700">Price</th>
              <th className="py-3 px-4 text-right font-semibold text-gray-700">Amount</th>
              <th className="py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-gray-400 bg-white">No orders found.</td>
              </tr>
            ) : (
              currentItems.map((order, index) => {
                const orderItems = order.order_items || [];
                const rowSpan = orderItems.length > 0 ? orderItems.length : 1;
                const totalAmount = getTotalAmount(order);
                return orderItems.length === 0 ? (
                  <tr key={order.id} className="border-b border-gray-100 bg-white">
                    <td className="py-4 px-4" rowSpan={1}>
                      <input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => onSelectOrder(order.id)} disabled={loading} className="rounded w-4 h-4 text-blue-500 focus:ring-blue-500" />
                    </td>
                    <td className="py-4 px-4 text-gray-900" rowSpan={1}>{getInvoiceNo(order)}</td>
                    <td className="py-4 px-4 text-gray-900" rowSpan={1}>{getCustomerName(order.customer_id)}</td>
                    {/* <td className="py-4 px-4 text-gray-900" rowSpan={1}>{getBatchId(order.batch_id)}</td> */}
                    <td className="py-4 px-4 text-gray-900">-</td>
                    <td className="py-4 px-4 text-right">-</td>
                    <td className="py-4 px-4 text-right">-</td>
                    <td className="py-4 px-4 text-right">Rp {totalAmount.toLocaleString('id-ID')}</td>
                    <td className="py-4 px-4">{order.status}</td>
                    <td className="py-4 px-4"></td>
                  </tr>
                ) : (
                  orderItems.map((item, idx) => (
                    <tr key={order.id + '-' + idx} className={idx === orderItems.length - 1 ? 'border-b border-gray-100 bg-white' : 'bg-white'}>
                      {idx === 0 && (
                        <>
                          <td className="py-4 px-4" rowSpan={rowSpan}>
                            <input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => onSelectOrder(order.id)} disabled={loading} className="rounded w-4 h-4 text-blue-500 focus:ring-blue-500" />
                          </td>
                          <td className="py-4 px-4 text-gray-900" rowSpan={rowSpan}>{getInvoiceNo(order)}</td>
                          <td className="py-4 px-4 text-gray-900" rowSpan={rowSpan}>{getCustomerName(order.customer_id)}</td>
                          {/* <td className="py-4 px-4 text-gray-900" rowSpan={rowSpan}>{getBatchId(order.batch_id)}</td> */}
                        </>
                      )}
                      <td className="py-4 px-4 text-gray-900 align-top">{getProductName(item.product_id, order.batch_id)}</td>
                      <td className="py-4 px-4 text-right align-top">{item.qty}</td>
                      <td className="py-4 px-4 text-right align-top">Rp {item.price.toLocaleString('id-ID')}</td>
                      <td className="py-4 px-4 text-right align-top">Rp {(item.qty * item.price).toLocaleString('id-ID')}</td>
                      {idx === 0 && (
                        <>
                          <td className="py-4 px-4" rowSpan={rowSpan}>{order.status}</td>
                          <td className="py-4 px-4" rowSpan={rowSpan}>
                            {/* ...actions... */}
                            <div className="group inline-block">
                              <button className="text-gray-700 hover:text-blue-400 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                              </button>
                              <div className="absolute right-0 z-10 hidden group-hover:block bg-white border border-gray-200 rounded shadow-lg min-w-[120px]">
                                <button onClick={() => onViewDetails(order)} className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 hover:text-blue-400">View Details</button>
                                <button onClick={() => onEditOrder(order)} className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 hover:text-green-400">Edit</button>
                                <button onClick={() => onDeleteOrder(order.id)} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-100 hover:text-red-600">Delete</button>
                                <button onClick={() => onEditShipment(order)} className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-gray-100 hover:text-yellow-600">Edit Shipment</button>
                              </div>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                );
              })
            )}
            <tr className="border-t border-gray-200 font-bold bg-gray-50">
              <td colSpan={4} className="py-4 px-4 text-right">Total</td>
              <td colSpan={2} className="py-4 px-4 text-right">Rp</td>
              <td className="py-4 px-4 text-right">{getOverallTotalAmount().toLocaleString('id-ID')}</td>
              <td colSpan={2}></td>
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
            {getPaginationButtons().map((page, index) => (
              <button
                key={index}
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