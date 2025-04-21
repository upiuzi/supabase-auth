import React, { useState } from 'react';

interface BroadcastConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onSend: (arrivalDate: string, session: string) => void;
  sessions: { session_id: string; status: string }[];
  loading: boolean;
}

const BroadcastConfirmModal: React.FC<BroadcastConfirmModalProps> = ({ show, onClose, onSend, sessions, loading }) => {
  const [arrivalDate, setArrivalDate] = useState('');
  const [selectedSession, setSelectedSession] = useState('');

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md mx-2 sm:mx-auto text-white shadow-lg">
        <h3 className="text-lg font-bold mb-4">Konfirmasi Broadcast Pesanan</h3>
        <div className="mb-4">
          <label className="block mb-1">Tanggal Tiba (required)</label>
          <input
            type="date"
            className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200 mb-2"
            value={arrivalDate}
            onChange={(e) => setArrivalDate(e.target.value)}
            required
          />
          <label className="block mb-1">Pilih Session WhatsApp (required)</label>
          <select
            className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200"
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            required
          >
            <option value="">Pilih session</option>
            {sessions.map((s) => (
              <option key={s.session_id} value={s.session_id}>
                {s.session_id} ({s.status})
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
            disabled={loading}
          >
            Batal
          </button>
          <button
            onClick={() => onSend(arrivalDate, selectedSession)}
            className="px-4 py-2 bg-indigo-500 rounded hover:bg-indigo-600"
            disabled={loading || !arrivalDate || !selectedSession}
          >
            {loading ? 'Mengirim...' : 'Kirim Broadcast'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BroadcastConfirmModal;
