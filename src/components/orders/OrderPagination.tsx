interface OrderPaginationProps {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    setItemsPerPage: (items: number) => void;
  }
  
  const OrderPagination: React.FC<OrderPaginationProps> = ({
    totalItems,
    itemsPerPage,
    currentPage,
    setCurrentPage,
    setItemsPerPage,
  }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
  
    return (
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-300">Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(parseInt(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-600 rounded px-2 py-1 bg-gray-700 text-gray-200"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500 text-white disabled:bg-gray-400"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-gray-200">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500 text-white disabled:bg-gray-400"
          >
            Next
          </button>
        </div>
      </div>
    );
  };
  
  export default OrderPagination;