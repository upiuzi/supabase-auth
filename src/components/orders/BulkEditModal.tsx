interface BulkEditModalProps {
    show: boolean;
    loading: boolean;
    bulkEditDate: string;
    onClose: () => void;
    onSave: () => void;
    onDateChange: (date: string) => void;
  }
  
  const BulkEditModal: React.FC<BulkEditModalProps> = ({
    show,
    loading,
    bulkEditDate,
    onClose,
    onSave,
    onDateChange,
  }) => {
    if (!show) return null;
  
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
        <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md text-white">
          <h2 className="text-xl font-bold mb-4">Bulk Edit Order Dates</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-300">Select Date</label>
            <input
              type="date"
              value={bulkEditDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
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
              onClick={onSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-400"
              disabled={loading || !bulkEditDate}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default BulkEditModal;