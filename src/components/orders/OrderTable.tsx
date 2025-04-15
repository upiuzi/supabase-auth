import { Order, OrderItem } from '../../type/schema';

interface OrderTableProps {
  orders: Order[];
  currentPage: number;
  itemsPerPage: number;
  selectedOrders: string[];
  setSelectedOrders: (orders: string[]) => void;
  loading: boolean;
  getCustomerName: (customerId: string) => string;
  getBatchId: (batchId: string) => string;
  getProductName: (productId: string, batchId: string) => string;
  getTotalAmount: (order: Order) => number;
  getStatusColor: (status: string) => string;
  onStatusChange: (
    orderId: string,
    status: 'pending' | 'confirmed' | 'cancelled'
  ) => void;
  onViewOrder: (order: Order) => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onEditQty: (orderId: string, productId: string, qty: number) => void;
}

const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  currentPage,
  itemsPerPage,
  selectedOrders,
  setSelectedOrders,
  loading,
  getCustomerName,
  getBatchId,
  getProductName,
  getTotalAmount,
  getStatusColor,
  onStatusChange,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
  onEditQty,
}) => {
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(
      selectedOrders.includes(orderId)
        ? selectedOrders.filter((id) => id !== orderId)
        : [...selectedOrders, orderId]
    );
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = orders.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-700">
          <tr>
            <th className="p-3">
              <input
                type="checkbox"
                checked={selectedOrders.length === orders.length && orders.length > 0}
                onChange={() =>
                  setSelectedOrders(
                    selectedOrders.length === orders.length
                      ? []
                      : orders.map((order) => order.id)
                  )
                }
                disabled={loading}
                className="rounded w-4 h-4"
              />
            </th>
            <th className="p-3">No</th>
            <th className="p-3">Customer</th>
            <th className="p-3">Batch</th>
            <th className="p-3">Products</th>
            <th className="p-3">Date</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((order, index) => (
            <tr
              key={order.id}
              className="border-t border-gray-700 hover:bg-gray-700"
            >
              <td className="py-3 px-4">
                <input
                  type="checkbox"
                  checked={selectedOrders.includes(order.id)}
                  onChange={() => handleSelectOrder(order.id)}
                  disabled={loading}
                  className="rounded w-4 h-4 text-blue-500 focus:ring-blue-500"
                />
              </td>
              <td className="py-3 px-4 text-gray-300">
                {"order" + index + 1}
              </td>
              <td className="py-3 px-4 text-white">
                {getCustomerName(order.customer_id)}
              </td>
              <td className="py-3 px-4 text-white">{getBatchId(order.batch_id)}</td>
              <td className="py-3 px-4 text-white">
                {order.order_items && order.order_items.length > 0 ? (
                  order.order_items.map((item: OrderItem, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span>{getProductName(item.product_id, order.batch_id)}:</span>
                      <button
                        onClick={() =>
                          onEditQty(order.id, item.product_id, item.qty)
                        }
                        className="text-white hover:text-gray-300 flex items-center gap-1"
                        disabled={loading}
                      >
                        {item.qty}
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    </div>
                  ))
                ) : (
                  '-'
                )}
              </td>
              <td className="py-3 px-4 text-white">
                {order.created_at
                  ? new Date(order.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '-'}
              </td>
              <td className="py-3 px-4 text-white">
                Rp {getTotalAmount(order).toLocaleString('id-ID')},00
              </td>
              <td className="py-3 px-4">
                <select
                  value={order.status}
                  onChange={(e) =>
                    onStatusChange(
                      order.id,
                      e.target.value as 'pending' | 'confirmed' | 'cancelled'
                    )
                  }
                  className={`text-sm px-3 py-1 rounded-full ${getStatusColor(
                    order.status
                  )} focus:outline-none`}
                  disabled={loading}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
              <td className="py-3 px-4 flex gap-2">
                <button
                  onClick={() => onViewOrder(order)}
                  className="text-gray-400 hover:text-green-400"
                  disabled={loading}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
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
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => onDeleteOrder(order.id)}
                  className="text-gray-400 hover:text-red-400"
                  disabled={loading}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
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
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;