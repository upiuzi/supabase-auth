import { FormData, Customer, Batch, OrderItem } from '../../type/order';

interface OrderFormModalProps {
  show: boolean;
  loading: boolean;
  formData: FormData;
  customers: Customer[];
  batches: Batch[];
  isEdit: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  onOrderItemChange: (index: number, field: keyof OrderItem, value: string | number) => void;
  onAddOrderItem: () => void;
  onRemoveOrderItem: (index: number) => void;
}

const OrderFormModal: React.FC<OrderFormModalProps> = ({
  show,
  loading,
  formData,
  customers,
  batches,
  isEdit,
  onClose,
  onSubmit,
  onInputChange,
  onOrderItemChange,
  onAddOrderItem,
  onRemoveOrderItem,
}) => {
  const getAvailableProducts = () => {
    if (!formData.batch_id) return [];
    const selectedBatch = batches.find((b) => b.id === formData.batch_id);
    if (!selectedBatch || !selectedBatch.batch_products) return [];
    return selectedBatch.batch_products;
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

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-lg text-white shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{isEdit ? 'Edit Order' : 'Create New Order'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200" disabled={loading}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Customer</label>
              <select
                name="customer_id"
                value={formData.customer_id}
                onChange={onInputChange}
                className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              >
                <option value="" className="bg-gray-700 text-gray-200">
                  Select customer
                </option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id} className="bg-gray-700 text-gray-200">
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Batch</label>
              <select
                name="batch_id"
                value={formData.batch_id}
                onChange={onInputChange}
                className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              >
                <option value="" className="bg-gray-700 text-gray-200">
                  Select batch
                </option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id} className="bg-gray-700 text-gray-200">
                    {batch.batch_id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-300">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={onInputChange}
              className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            >
              <option value="pending" className="bg-gray-700 text-gray-200">
                Pending
              </option>
              <option value="confirmed" className="bg-gray-700 text-gray-200">
                Confirmed
              </option>
              <option value="cancelled" className="bg-gray-700 text-gray-200">
                Cancelled
              </option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-300">Expedition</label>
            <input
              type="text"
              name="expedition"
              value={formData.expedition}
              onChange={onInputChange}
              className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
              placeholder="Enter expedition"
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-300">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={onInputChange}
              className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
              rows={3}
              placeholder="Enter description"
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-300">Order Items</label>
              <button
                type="button"
                onClick={onAddOrderItem}
                disabled={!formData.batch_id || getAvailableProducts().length === 0 || loading}
                className="text-blue-400 text-sm hover:text-blue-300 disabled:text-gray-600"
              >
                + Add Item
              </button>
            </div>
            {formData.order_items.length === 0 ? (
              <div className="border border-gray-600 rounded p-4 text-center text-gray-400">
                Select a batch first to see available products.
              </div>
            ) : (
              formData.order_items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 mb-3 p-3 border border-gray-600 rounded bg-gray-700"
                >
                  <div className="flex-1">
                    <select
                      value={item.product_id}
                      onChange={(e) => onOrderItemChange(index, 'product_id', e.target.value)}
                      className="w-full border border-gray-600 rounded px-2 py-1 bg-gray-600 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      {getAvailableProducts().map((product) => (
                        <option
                          key={product.product_id}
                          value={product.product_id}
                          className="bg-gray-600 text-gray-200"
                        >
                          {getProductName(product.product_id, formData.batch_id)} (
                          {product.remaining_qty} available)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => onOrderItemChange(index, 'qty', e.target.value)}
                      className="w-full border border-gray-600 rounded px-2 py-1 bg-gray-600 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      disabled={loading}
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => onOrderItemChange(index, 'price', e.target.value)}
                      className="w-full border border-gray-600 rounded px-2 py-1 bg-gray-600 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                      min="0"
                      step="1000"
                      placeholder="Price"
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveOrderItem(index)}
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
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? (isEdit ? 'Saving...' : 'Creating...') : isEdit ? 'Save Changes' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderFormModal;