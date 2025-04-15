import { Order } from '../../type/schema';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  getCustomerName: (customerId: string) => string;
  getBatchId: (batchId: string) => string;
  getProductName: (productId: string, batchId: string) => string;
  getTotalAmount: (order: Order) => number;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen,
  onClose,
  order,
  getCustomerName,
  getBatchId,
  getProductName,
  getTotalAmount,
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md text-white">
        <h2 className="text-xl font-bold mb-4">Order Details</h2>
        <div className="mb-4">
          <p>
            <strong>Customer:</strong> {getCustomerName(order.customer_id)}
          </p>
          <p>
            <strong>Batch:</strong> {getBatchId(order.batch_id)}
          </p>
          <p>
            <strong>Date:</strong>{' '}
            {order.created_at
              ? new Date(order.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '-'}
          </p>
          <p>
            <strong>Status:</strong> {order.status}
          </p>
          <p>
            <strong>Expedition:</strong> {order.expedition || '-'}
          </p>
          <p>
            <strong>Description:</strong> {order.description || '-'}
          </p>
          <p>
            <strong>Products:</strong>
          </p>
          <ul className="list-disc pl-5">
            {order.order_items?.map((item, idx) => (
              <li key={idx}>
                {getProductName(item.product_id, order.batch_id)}: {item.qty} x Rp{' '}
                {item.price.toLocaleString('id-ID')} = Rp{' '}
                {(item.qty * item.price).toLocaleString('id-ID')}
              </li>
            ))}
          </ul>
          <p>
            <strong>Total Amount:</strong> Rp{' '}
            {getTotalAmount(order).toLocaleString('id-ID')},00
          </p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;