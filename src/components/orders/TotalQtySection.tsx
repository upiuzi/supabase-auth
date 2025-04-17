import { Order, Batch } from '../../type/order';

interface TotalQtySectionProps {
  filteredOrders: Order[];
  batches: Batch[];
}

const TotalQtySection: React.FC<TotalQtySectionProps> = ({ filteredOrders, batches }) => {
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

  const getInitialQty = (productId: string, batchId: string) => {
    const batch = batches.find((b) => b.id === batchId);
    if (batch && batch.batch_products) {
      const batchProduct = batch.batch_products.find((bp) => bp.product_id === productId);
      return batchProduct ? batchProduct.initial_qty : 0;
    }
    return 0;
  };

  const getTotalQtyPerProduct = () => {
    const totalQtyByProduct: Record<
      string,
      { orderedQty: number; initialQty: number; batchId: string }
    > = {};

    filteredOrders.forEach((order) => {
      if (order.order_items) {
        order.order_items.forEach((item) => {
          const productName = getProductName(item.product_id, order.batch_id);
          const initialQty = getInitialQty(item.product_id, order.batch_id);

          if (!totalQtyByProduct[productName]) {
            totalQtyByProduct[productName] = {
              orderedQty: 0,
              initialQty: initialQty,
              batchId: order.batch_id,
            };
          }
          totalQtyByProduct[productName].orderedQty += item.qty;
        });
      }
    });

    return totalQtyByProduct;
  };

  const totalQtyByProduct = getTotalQtyPerProduct();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-bold text-white mb-2">Total Produksi</h2>
        {Object.keys(totalQtyByProduct).length === 0 ? (
          <p className="text-gray-400">No products ordered yet.</p>
        ) : (
          <ul className="space-y-2">
            {Object.entries(totalQtyByProduct).map(([productName, data]) => (
              <li key={productName} className="text-gray-200">
                <span className="font-medium">{productName}:</span>{' '}
                {data.initialQty} kg
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-bold text-white mb-2">Total Order</h2>
        {Object.keys(totalQtyByProduct).length === 0 ? (
          <p className="text-gray-400">No products ordered yet.</p>
        ) : (
          <ul className="space-y-2">
            {Object.entries(totalQtyByProduct).map(([productName, data]) => (
              <li key={productName} className="text-gray-200">
                <span className="font-medium">{productName}:</span> {data.orderedQty} kg
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TotalQtySection;