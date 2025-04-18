import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Customer, Batch } from '../../type/order';
import { Order, Company, BankAccount, PaymentLog } from '../../type/schema';
import { useState, useEffect } from 'react';
import { createPaymentLog, getPaymentLogsByOrderId, updateBankAccount } from '../../services/supabaseService';
import  supabase  from '../../supabase'; // Asumsi supabase client sudah dikonfigurasi

interface OrderDetailModalProps {
  show: boolean;
  order: Order | null;
  customers: Customer[];
  batches: Batch[];
  companies: Company[];
  bankAccounts: BankAccount[];
  loading: boolean;
  onClose: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  show,
  order,
  customers,
  batches,
  companies,
  bankAccounts,
  loading,
  onClose,
}) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (order) {
      setPaymentMethod(order.bank_account_id);
      fetchPaymentLogs();
    }
  }, [order]);

  const fetchPaymentLogs = async () => {
    if (order?.id) {
      try {
        const logs = await getPaymentLogsByOrderId(order.id);
        setPaymentLogs(logs);
      } catch (error) {
        console.error('Error fetching payment logs:', error);
      }
    }
  };

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

  const getCompanyName = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    return company ? company.company_name : '-';
  };

  const getBankAccountName = (bankAccountId: string) => {
    const bankAccount = bankAccounts.find((ba) => ba.id === bankAccountId);
    return bankAccount ? `${bankAccount.account_name} (${bankAccount.bank_name})` : '-';
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

  const generatePDF = (order: Order) => {
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

    const selectedCompany = companies.find((c) => c.id === order.company_id);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(selectedCompany?.company_name || 'Unknown Company', leftColumnX, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Phone: ${selectedCompany?.phone || '-'}`, leftColumnX, yPos);
    yPos += 6;
    doc.text(`Email: ${selectedCompany?.email || '-'}`, leftColumnX, yPos);
    yPos += 6;
    const companyAddress = selectedCompany?.address || '-';
    const maxWidth = 90;
    const addressLines = doc.splitTextToSize(`Address: ${companyAddress}`, maxWidth);
    doc.text(addressLines, leftColumnX, yPos);
    yPos += 6 * addressLines.length;

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
    const addressLinesCustomer = doc.splitTextToSize(`Address: ${customerAddress}`, maxWidth);
    doc.text(addressLinesCustomer, rightColumnX, customerYPos);
    customerYPos += 6 * addressLinesCustomer.length;
    doc.text(`Batch: ${getBatchId(order.batch_id)}`, rightColumnX, customerYPos);

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

    const selectedBankAccount = bankAccounts.find((ba) => ba.id === order.bank_account_id);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Methods', leftColumnX, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Bank: ${selectedBankAccount?.bank_name || '-'}`, leftColumnX, yPos);
    yPos += 6;
    doc.text(
      `${selectedBankAccount?.account_number || '-'} : ${selectedBankAccount?.account_name || '-'}`,
      leftColumnX,
      yPos
    );

    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 10, {
      align: 'center',
    });

    doc.save(`Invoice_${order.id}_Standard.pdf`);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setPaymentLoading(true);
    try {
      await createPaymentLog(
        order.id,
        parseFloat(paymentAmount),
        paymentDate,
        paymentMethod,
        paymentNotes
      );

      const bankAccount = bankAccounts.find((ba) => ba.id === paymentMethod);
      if (bankAccount) {
        const newBalance = bankAccount.balance + parseFloat(paymentAmount);
        await updateBankAccount(bankAccount.id, { balance: newBalance });
      }

      await fetchPaymentLogs();

      setShowPaymentForm(false);
      setPaymentAmount('');
      setPaymentDate('');
      setPaymentMethod(order.bank_account_id);
      setPaymentNotes('');
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Failed to add payment. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDeletePayment = async (paymentLog: PaymentLog) => {
    if (!order || !confirm('Are you sure you want to delete this payment?')) return;
    setPaymentLoading(true);
    try {
      await supabase
        .from('payment_logs')
        .delete()
        .eq('id', paymentLog.id);

      const bankAccount = bankAccounts.find((ba) => ba.id === paymentLog.payment_method);
      if (bankAccount) {
        const newBalance = bankAccount.balance - paymentLog.amount;
        await updateBankAccount(bankAccount.id, { balance: newBalance });
      }

      const newPaidAmount = paymentLogs.reduce((sum, log) => sum + (log.id === paymentLog.id ? 0 : log.amount), 0);
      let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid';
      if (newPaidAmount > 0 && newPaidAmount < (order.total_amount || 0)) {
        paymentStatus = 'partial';
      } else if (newPaidAmount >= (order.total_amount || 0)) {
        paymentStatus = 'paid';
      }
      await supabase
        .from('orders')
        .update({ paid_amount: newPaidAmount, payment_status: paymentStatus })
        .eq('id', order.id);

      await fetchPaymentLogs();
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Failed to delete payment. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (!show || !order) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl text-white">
        <h2 className="text-xl font-bold mb-4">Order Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold text-lg">{getCompanyName(order.company_id)}</h3>
            <p>Phone: {companies.find((c) => c.id === order.company_id)?.phone || '-'}</p>
            <p>Email: {companies.find((c) => c.id === order.company_id)?.email || '-'}</p>
            <p>Address: {companies.find((c) => c.id === order.company_id)?.address || '-'}</p>
          </div>
          <div>
            <h3 className="font-bold text-lg">Customer Details</h3>
            <p>Name: {getCustomerName(order.customer_id)}</p>
            <p>Phone: {getCustomerPhone(order.customer_id)}</p>
            <p>Address: {getCustomerAddress(order.customer_id)}</p>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="font-bold text-lg mb-2">Order Information</h3>
          <p>Order ID: {order.id}</p>
          <p>Status: {order.status}</p>
          <p>Expedition: {order.expedition || '-'}</p>
          <p>Description: {order.description || '-'}</p>
          <p>Total Amount: Rp {(order.total_amount || 0).toLocaleString('id-ID')}</p>
          <p>Paid Amount: Rp {(order.paid_amount || 0).toLocaleString('id-ID')}</p>
          <p>Payment Status: {order.payment_status || 'unpaid'}</p>
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
                <td colSpan={3} className="py-3 text-right">
                  Total Qty:
                </td>
                <td className="py-3 px-4">{getTotalQtyAllProducts(order)} kg</td>
                <td className="py-3 px-4">Rp {getTotalAmount(order).toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-6">
          <h3 className="font-bold text-lg mb-2">Payment History</h3>
          {paymentLogs.length > 0 ? (
            <table className="min-w-full bg-gray-700 rounded-lg">
              <thead>
                <tr className="text-gray-400 text-left">
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {paymentLogs.map((log) => (
                  <tr key={log.id} className="border-t border-gray-600">
                    <td className="py-3 px-4">Rp {log.amount.toLocaleString('id-ID')}</td>
                    <td className="py-3 px-4">{new Date(log.payment_date).toLocaleDateString('id-ID')}</td>
                    <td className="py-3 px-4">{getBankAccountName(log.payment_method || '')}</td>
                    <td className="py-3 px-4">{log.notes || '-'}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDeletePayment(log)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        disabled={paymentLoading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400">No payment history available.</p>
          )}
        </div>
        {showPaymentForm && (
          <div className="mt-6">
            <h3 className="font-bold text-lg mb-2">Add Payment</h3>
            <form onSubmit={handlePaymentSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-200">
                    Amount
                  </label>
                  <input
                    type="number"
                    id="paymentAmount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-200">
                    Date
                  </label>
                  <input
                    type="date"
                    id="paymentDate"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-200">
                    Method
                  </label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-700 text-white"
                  >
                    {bankAccounts.map((ba) => (
                      <option key={ba.id} value={ba.id}>
                        {ba.account_name} ({ba.bank_name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="paymentNotes" className="block text-sm font-medium text-gray-200">
                    Notes
                  </label>
                  <textarea
                    id="paymentNotes"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-700 text-white"
                  />
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  disabled={loading || paymentLoading}
                >
                  Add Payment
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="ml-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                  disabled={loading || paymentLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        <div className="mt-6 flex justify-between">
          <div>
            <button
              onClick={() => generatePDF(order)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
              disabled={loading || paymentLoading}
              aria-label="Download standard invoice"
            >
              Download Invoice
            </button>
            <button
              onClick={() => setShowPaymentForm(true)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={loading || paymentLoading}
              aria-label="Add payment"
            >
              Add Payment
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
            disabled={loading || paymentLoading}
            aria-label="Close order details modal"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;