
import { useEffect, useState } from 'react';
import { Order } from '../../type/order';

interface ShipmentEditModalProps {
  show: boolean;
  loading: boolean;
  order: Order | null;
  onClose: () => void;
  onSave: (orderId: string, expedition: string, description: string) => Promise<void>;
}

const ShipmentEditModal: React.FC<ShipmentEditModalProps> = ({
  show,
  loading,
  order,
  onClose,
  onSave,
}) => {
  const [expedition, setExpedition] = useState('');
  const [description, setDescription] = useState('');

  // Initialize form fields when order changes
  useEffect(() => {
    if (order) {
      setExpedition(order.expedition || '');
      setDescription(order.description || '');
    }
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      await onSave(order.id, expedition, description);
      onClose();
    } catch (error) {
      console.error('Error saving shipment details:', error);
      alert('Failed to save shipment details');
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Edit Shipment Details</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2" htmlFor="expedition">
              Expedition
            </label>
            <input
              id="expedition"
              type="text"
              value={expedition}
              onChange={(e) => setExpedition(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              disabled={loading}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 disabled:bg-gray-400"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
              disabled={loading}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShipmentEditModal;
