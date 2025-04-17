import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Order, Customer, Batch } from '../../type/order';

interface OrderDetailModalProps {
  show: boolean;
  order: Order | null;
  customers: Customer[];
  batches: Batch[];
  loading: boolean;
  onClose: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ show, order, customers, batches, loading, onClose }) => {
  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer ? customer.name : '-';
  };

  const getCustomerPhone = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.phone || '-';
  };

  const getCustomerAddress = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.address || '-';
  };

  const getBatchId = (batchId: string) => {
    const batch = batches.find((b) => b.id === batchId);
    return batch ? batch.batch_id : '-';
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

  const getProductDescription = (productId: string, batchId: string) => {
    const batch = batches.find((b) => b.id === batchId);
    if (batch && batch.batch_products) {
      const batchProduct = batch.batch_products.find((bp) => bp.product_id === productId);
      if (batchProduct && batchProduct.product) {
        return batchProduct.product.description || 'No description available';
      }
    }
    return 'No description available';
  };

  const getTotalAmount = (order: Order) => {
    if (!order.order_items) return 0;
    return order.order_items.reduce((total, item) => total + item.price * item.qty, 0);
  };

  const getTotalQtyAllProducts = (order: Order) => {
    if (!order.order_items) return 0;
    return order.order_items.reduce((total, item) => total + item.qty, 0);
  };

  const generatePDF = (order: Order, isPTSATI: boolean) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const leftColumnX = 10;
    const rightColumnX = 100;
    let yPos = 10;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${order.id}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    const currentDate = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    doc.text(`Date: ${currentDate}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SAT COCONUT', leftColumnX, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('WhatsApp: +6281122244446', leftColumnX, yPos);
    yPos += 6;
    doc.text('Email: jaya@satcoconut.com', leftColumnX, yPos);
    yPos += 6;
    doc.text('Address: Chubb Square, 9th Floor', leftColumnX, yPos);
    yPos += 6;
    doc.text('Jln. Jendral Sudirman Kav.60', leftColumnX, yPos);
    yPos += 6;
    doc.text('Jakarta, Indonesia', leftColumnX, yPos);

    let customerYPos = 34;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Details', rightColumnX, customerYPos);
    customerYPos += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${getCustomerName(order.customer_id)}`, rightColumnX, customerYPos);
    customerYPos += 6;
    doc.text(`Phone Number: ${getCustomerPhone(order.customer_id)}`, rightColumnX, customerYPos);
    customerYPos += 6;

    const customerAddress = getCustomerAddress(order.customer_id);
    const maxWidth = 90;
    const addressLines = doc.splitTextToSize(`Address: ${customerAddress}`, maxWidth);
    doc.text(addressLines, rightColumnX, customerYPos);
    customerYPos += 6 * addressLines.length;
    doc.text(`Batch: ${getBatchId(order.batch_id)}`, rightColumnX, customerYPos);

    yPos = Math.max(yPos, customerYPos) + 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Products', leftColumnX, yPos);
    yPos += 2;
    doc.setLineWidth(0.5);
    doc.setDrawColor(150, 150, 150);
    doc.line(leftColumnX, yPos, pageWidth - 10, yPos);
    yPos += 6;

    const headers = ['Product Name', 'Description', 'Qty', 'Price', 'Total'];
    const data =
      order.order_items?.map((item) => [
        getProductName(item.product_id, order.batch_id),
        getProductDescription(item.product_id, order.batch_id).substring(0, 20) + '...',
        item.qty.toString(),
        `Rp ${item.price.toLocaleString('id-ID')}`,
        `Rp ${(item.price * item.qty).toLocaleString('id-ID')}`,
      ]) || [];

    doc.autoTable({
      startY: yPos,
      head: [headers],
      body: [
        ...data,
        ['', '', '', 'Grand Total', `Rp ${getTotalAmount(order).toLocaleString('id-ID')}`],
        ['', '', `${getTotalQtyAllProducts(order)}`, 'Total Qty', ''],
      ],
      styles: { fontSize: 10, font: 'helvetica' },
      headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      margin: { left: leftColumnX, right: 10 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Methods', leftColumnX, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Transfer to account:', leftColumnX, yPos);
    yPos += 6;
    doc.text('Bank BCA', leftColumnX, yPos);
    yPos += 6;
    doc.text(
      isPTSATI ? '2610 - 222 - 628 : PT Semesta Agro Tani' : '233-333-3368 : Alvin S Yohan',
      leftColumnX,
      yPos
    );

    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 10, {
      align: 'center',
    });

    doc.save(`Invoice_${order.id}.pdf`);
  };

  if (!show || !order) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl text-white">
        <h2 className="text-xl font-bold mb-4">Order Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold text-lg">SAT COCONUT</h3>
            <p>WhatsApp: +6281122244446</p>
            <p>Email: jaya@satcoconut.com</p>
            <p>Address: Chubb Square, 9th Floor</p>
            <p>Jln. Jendral Sudirman Kav.60</p>
            <p>Jakarta, Indonesia</p>
          </div>
          <div>
            <h3 className="font-bold text-lg">Customer Details</h3>
            <p>Name: {getCustomerName(order.customer_id)}</p>
            <p>Phone: {getCustomerPhone(order.customer_id)}</p>
            <p>Address: {getCustomerAddress(order.customer_id)}</p>
            <p>Batch: {getBatchId(order.batch_id)}</p>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="font-bold text-lg mb-2">Order Information</h3>
          <p>Order ID: {order.id}</p>
          <p>Status: {order.status}</p>
          <p>Expedition: {order.expedition || '-'}</p>
          <p>Description: {order.description || '-'}</p>
        </div>
        <div className="mt-6">
          <h3 className="font-bold text-lg mb-2">Products</h3>
          <table className="min-w-full bg-gray-700 rounded-lg">
            <thead>
              <tr className="text-gray-400 text-left">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Qty</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items?.map((item, index) => (
                <tr key={index} className="border-t border-gray-600">
                  <td className="py-3 px-4">{getProductName(item.product_id, order.batch_id)}</td>
                  <td className="py-3 px-4">
                    {getProductDescription(item.product_id, order.batch_id).substring(0, 20) + '...'}
                  </td>
                  <td className="py-3 px-4">{item.qty} kg</td>
                  <td className="py-3 px-4">Rp {item.price.toLocaleString('id-ID')}</td>
                  <td className="py-3 px-4">Rp {(item.price * item.qty).toLocaleString('id-ID')}</td>
                </tr>
              ))}
              <tr className="border-t border-gray-600 font-bold">
                <td colSpan={3} className="py-3 px-4 text-right">
                  Total Qty:
                </td>
                <td className="py-3 px-4">{getTotalQtyAllProducts(order)} kg</td>
                <td className="py-3 px-4">Rp {getTotalAmount(order).toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex justify-between">
          <div>
            <button
              onClick={() => generatePDF(order, false)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
              disabled={loading}
            >
              Download Invoice
            </button>
            <button
              onClick={() => generatePDF(order, true)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={loading}
            >
              Download PTSATI Invoice
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
            disabled={loading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;