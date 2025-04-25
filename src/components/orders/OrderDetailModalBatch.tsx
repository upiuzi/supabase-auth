// Duplicate of OrderDetailModal, batch select input hanya tampilkan batch yang dipilih
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Batch } from '../../type/order';
import { Order, Company, BankAccount, PaymentLog, Customer } from '../../type/schema';
import { useState, useEffect } from 'react';
import { createPaymentLog, getPaymentLogsByOrderId, updateBankAccount } from '../../services/supabaseService';
import supabase from '../../supabase';
import { API_BASE_URL } from '../../config';

interface OrderDetailModalBatchProps {
  show: boolean;
  order: Order | null;
  batches: Batch[];
  companies: Company[];
  bankAccounts: BankAccount[];
  customers: Customer[];
  loading: boolean;
  onClose: () => void;
  selectedBatchId: string; // batch yang dipilih dari OrderBatchPage
}

const OrderDetailModalBatch: React.FC<OrderDetailModalBatchProps> = ({
  show,
  order,
  batches,
  companies,
  bankAccounts,
  customers = [],
  loading,
  onClose,
  selectedBatchId,
}) => {
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (order) {
      getPaymentLogsByOrderId(order.id).then((data) => {
        setPaymentLogs(data);
      });
    }
  }, [order]);

  const handlePrint = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [['No', 'Tanggal', 'Jumlah', 'Metode', 'Catatan']],
      body: paymentLogs.map((log, index) => [
        index + 1,
        log.createdAt,
        log.amount,
        log.method,
        log.note,
      ]),
    });
    doc.save('payment_logs.pdf');
  };

  const handleCreatePaymentLog = () => {
    if (order && selectedCompany && selectedBankAccount) {
      createPaymentLog({
        order_id: order.id,
        company_id: selectedCompany.id,
        bank_account_id: selectedBankAccount.id,
        amount: paymentAmount,
        method: paymentMethod,
        date: paymentDate,
        note,
      }).then((data) => {
        setPaymentLogs((prevLogs) => [...prevLogs, data]);
        setPaymentAmount(0);
        setPaymentMethod('');
        setPaymentDate('');
        setNote('');
      });
    }
  };

  const handleUpdateBankAccount = () => {
    if (selectedBankAccount) {
      updateBankAccount(selectedBankAccount.id, {
        balance: selectedBankAccount.balance + paymentAmount,
      }).then((data) => {
        setSelectedBankAccount(data);
      });
    }
  };

  return (
    <div>
      {/* Modal Header */}
      <div>
        <h2>Detail Order</h2>
        <button onClick={onClose}>Tutup</button>
      </div>

      {/* Modal Body */}
      <div>
        <h3>Informasi Order</h3>
        <p>No. Order: {order?.id}</p>
        <p>Tanggal: {order?.createdAt}</p>
        <p>Total: {order?.total}</p>

        <h3>Batch</h3>
        <select>
          {batches.filter((batch) => batch.id === selectedBatchId).map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.batch_id}
            </option>
          ))}
        </select>

        <h3>Pembayaran</h3>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>Jumlah</th>
              <th>Metode</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            {paymentLogs.map((log, index) => (
              <tr key={log.id}>
                <td>{index + 1}</td>
                <td>{log.createdAt}</td>
                <td>{log.amount}</td>
                <td>{log.method}</td>
                <td>{log.note}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Tambah Pembayaran</h3>
        <form>
          <label>
            Tanggal:
            <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </label>
          <label>
            Jumlah:
            <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value))} />
          </label>
          <label>
            Metode:
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="">Pilih Metode</option>
              <option value="cash">Tunai</option>
              <option value="transfer">Transfer</option>
            </select>
          </label>
          <label>
            Catatan:
            <textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <button type="button" onClick={handleCreatePaymentLog}>
            Tambah Pembayaran
          </button>
        </form>

        <h3>Cetak Laporan</h3>
        <button onClick={handlePrint}>Cetak Laporan</button>
      </div>
    </div>
  );
};

export default OrderDetailModalBatch;
