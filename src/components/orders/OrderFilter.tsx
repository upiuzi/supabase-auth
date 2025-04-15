interface OrderFilterProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onCreate: () => void;
    selectedOrders: string[];
    onBulkEdit: () => void;
  }
  
  const OrderFilter: React.FC<OrderFilterProps> = ({
    searchQuery,
    setSearchQuery,
    onCreate,
    selectedOrders,
    onBulkEdit,
  }) => {
    return (
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by customer or batch..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 border border-gray-600 rounded px-4 py-2 bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <button
            onClick={onCreate}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Order
          </button>
          <button
            onClick={onBulkEdit}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-400"
            disabled={selectedOrders.length === 0}
          >
            Bulk Edit
          </button>
        </div>
      </div>
    );
  };
  
  export default OrderFilter;