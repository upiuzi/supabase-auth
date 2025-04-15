import { Customer, Batch, OrderItem } from '../../type/schema';

interface OrderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  batches: Batch[];
  formData: {
    customer_id: string;
    batch_id: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    order_items: OrderItem[];
    expedition?: string;
    description?: string;
  };
  setFormData: (data: any) => void;
  onSubmit: () => void;
  loading: boolean;
}

const OrderEditModal: React.FC<OrderEditModalProps> = ({
  isOpen,
  onClose,
  customers,
  batches,
  formData,
  setFormData,
  onSubmit,
  loading,
}) => {
  if (!isOpen) return null;

  const handleAddItem = () => {
    setFormData({
      ...formData,
      order_items: [
        ...formData.order_items,
        { product_id: '', qty: 1, price: 0 },
      ],
    });
  };

  const handleItemChange = (
    index: number,
    field: keyof OrderItem,
    value: any
  ) => {
    const updatedItems = formData.order_items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setFormData({ ...formData, order_items: updatedItems });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      order_items: formData.order_items.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md text-white">
        <h2 className="text-xl font-bold mb-4">Edit Order</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-300">
            Customer
          </label>
          <select
            value={formData.customer_id}
            onChange={(e) =>
              setFormData({ ...formData, customer_id: e.target.value })
            }
            className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200"
            disabled={loading}
          >
            <option value="">Select Customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-300">
            Batch
          </label>
          <select
            value={formData.batch_id}
            onChange={(e) =>
              setFormData({ ...formData, batch_id: e.target.value })
            }
            className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200"
            disabled={loading}
          >
            <option value="">Select Batch</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.batch_name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-300">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as 'pending' | 'confirmed' | 'cancelled',
              })
            }
            className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200"
            disabled={loading}
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-300">
            Expedition
          </label>
          <input
            type="text"
            value={formData.expedition || ''}
            onChange={(e) =>
              setFormData({ ...formData, expedition: e.target.value })
            }
            className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200"
            disabled={loading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-300">
            Description
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200"
            disabled={loading}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-300">
            Order Items
          </label>
          {formData.order_items.map((item, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <select
                value={item.product_id}
                onChange={(e) =>
                  handleItemChange(index, 'product_id', e.target.value)
                }
                className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200"
                disabled={loading}
              >
                <option value="">Select Product</option>
                {batches
                  .find((b) => b.id === formData.batch_id)
                  ?.batch_products?.map((bp) => (
                    <option key={bp.product_id} value={bp.product_id}>
                      {bp.product?.name}
                    </option>
                  ))}
              </select>
              <input
                type="number"
                value={item.qty}
                onChange={(e) =>
                  handleItemChange(index, 'qty', parseInt(e.target.value))
                }
                className="w-20 border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200"
                min="1"
                disabled={loading}
              />
              <input
                type="number"
                value={item.price}
                onChange={(e) =>
                  handleItemChange(index, 'price', parseFloat(e.target.value))
                }
                className="w-24 border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200"
                min="0"
                disabled={loading}
              />
              <button
                onClick={() => handleRemoveItem(index)}
                className="text-red-400 hover:text-red-300"
                disabled={loading}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={handleAddItem}
            className="text-blue-400 hover:text-blue-300"
            disabled={loading}
          >
            Add Item
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-white"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-400"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderEditModal;