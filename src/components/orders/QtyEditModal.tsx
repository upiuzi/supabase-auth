import { useState } from 'react';
import { Order, Batch } from '../../type/schema';

interface QtyEditModalProps {
  show: boolean;
  loading: boolean;
  orderId: string | null;
  productId: string | null;
  newQty: number;
  orders: Order[];
  batches: Batch[];
  onClose: () => void;
  onSave: (orderId: string, productId: string, newQty: number) => void;
  onQtyChange: (qty: number) => void;
}

const QtyEditModal: React.FC<QtyEditModalProps> = ({
  show,
  loading,
  orderId,
  productId,
  newQty,
  orders,
  batches,
  onClose,
  onSave,
  onQtyChange,
}) => {
  const [error, setError] = useState<string | null>(null);

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

  const handleSave = () => {
    if (isNaN(newQty) || newQty <= 0) {
      setError('Quantity must be a positive number');
      return;
    }
    setError(null);
    onSave(orderId!, productId!, newQty);
  };

  if (!show || !orderId || !productId) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md text-white">
        <h2 className="text-xl font-bold mb-4">Edit Quantity</h2>
        {error && (
          <div className="mb-4 p-2 bg-red-900 text-red-200 rounded" role="alert">
            {error}
          </div>
        )}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-300" htmlFor="product">
            Product
          </label>
          <input
            id="product"
            type="text"
            value={getProductName(productId, orders.find((o) => o.id === orderId)?.batch_id || '')}
            className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200 focus:outline-none"
            disabled
            aria-disabled="true"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-300" htmlFor="quantity">
            Quantity
          </label>
          <input
            id="quantity"
            type="number"
            value={newQty}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              onQtyChange(isNaN(value) ? 0 : value);
              setError(null);
            }}
            className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            disabled={loading}
            aria-required="true"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-white disabled:bg-gray-400"
            disabled={loading}
            aria-label="Cancel editing quantity"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-400"
            disabled={loading || isNaN(newQty) || newQty <= 0}
            aria-label="Save quantity changes"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QtyEditModal;