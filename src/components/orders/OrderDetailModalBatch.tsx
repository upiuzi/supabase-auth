// Duplicate of OrderDetailModal, batch select input hanya tampilkan batch yang dipilih
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Batch } from '../../type/order';
import { Order, PaymentLog } from '../../type/schema';
import { useState, useEffect } from 'react';
import { createPaymentLog, getPaymentLogsByOrderId } from '../../services/supabaseService';

interface OrderDetailModalBatchProps {
  order: Order | null;
  batches: Batch[];
  onClose: () => void;
  selectedBatchId: string;
}

const OrderDetailModalBatch: React.FC<OrderDetailModalBatchProps> = ({
  order,
  batches,
  onClose,
  selectedBatchId,
}) => {
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
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
      head: [['No', 'Tanggal', 'Jumlah', 'Catatan']],
      body: paymentLogs.map((log, index) => [
        index + 1,
        log.created_at,
        log.amount,
        log.notes,
      ]),
    });
    doc.save('payment_logs.pdf');
  };

  const handleCreatePaymentLog = () => {
    if (order) {
      // createPaymentLog kemungkinan return void, jadi tidak perlu if (data)
      createPaymentLog(order.id, paymentAmount, paymentDate, paymentMethod, note).then(() => {
        setPaymentLogs((prevLogs) => [...prevLogs]); // Jika ingin fetch ulang, bisa fetchPaymentLogs ulang
        setPaymentAmount(0);
        setPaymentMethod('');
        setPaymentDate('');
        setNote('');
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
        <p>Tanggal: {order?.created_at}</p>

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
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            {paymentLogs.map((log, index) => (
              <tr key={log.id}>
                <td>{index + 1}</td>
                <td>{log.created_at}</td>
                <td>{log.amount}</td>
                <td>{log.notes}</td>
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
