import React from "react";

interface BroadcastReviewModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: { name: string; phone: string; product: string; qty: number; customer_id: string }[];
  loading: boolean;
}

const BroadcastReviewModal: React.FC<BroadcastReviewModalProps> = ({ show, onClose, onConfirm, data, loading }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl mx-2 sm:mx-auto text-white shadow-lg">
        <h3 className="text-lg font-bold mb-4">Review Data Broadcast</h3>
        <div className="mb-4 max-h-72 overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-gray-400">
                <th className="px-2 py-1">No</th>
                <th className="px-2 py-1">Nama</th>
                <th className="px-2 py-1">Phone</th>
                <th className="px-2 py-1">Produk</th>
                <th className="px-2 py-1">Qty</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, idx) => (
                <tr key={d.phone + idx} className="border-t border-gray-700">
                  <td className="px-2 py-1 text-center">{idx + 1}</td>
                  <td className="px-2 py-1">{d.name}</td>
                  <td className="px-2 py-1">{d.phone}</td>
                  <td className="px-2 py-1">{d.product}</td>
                  <td className="px-2 py-1 text-right">{d.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
            disabled={loading}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-indigo-500 rounded hover:bg-indigo-600"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Konfirmasi & Kirim'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BroadcastReviewModal;
