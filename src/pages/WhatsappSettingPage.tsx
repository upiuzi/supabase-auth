import React, { useState, useEffect } from 'react';
import Navbar2 from '../components/Navbar2';
import QRCode from 'react-qr-code';
import { API_BASE_URL } from '../config';

const BASE_URL = API_BASE_URL;

// --- MULTI SESSION SUPPORT ---
// Ambil daftar session dari backend
interface WaSession {
  session_id: string;
  status: string;
  last_qr: string | null;
}

const WhatsappSettingPage: React.FC = () => {
  const [sessions, setSessions] = useState<WaSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [qr, setQr] = useState<string|null>(null);
  const [status, setStatus] = useState<'idle'|'loading'|'connected'|'failed'>('idle');
  const [error, setError] = useState('');
  const [newSessionId, setNewSessionId] = useState('');
  const [creating, setCreating] = useState(false);

  // Fetch all sessions on mount
  useEffect(() => {
    fetch(`${BASE_URL}/whatsapp/sessions`).then(async res => {
      if (!res.ok) return;
      const data = await res.json();
      setSessions(data);
      if (data.length > 0) setSelectedSession(data[0].session_id);
    });
  }, []);

  const fetchQr = async (sid: string) => {
    setQr(null);
    try {
      // Ambil QR string dari backend (bukan image)
      const res = await fetch(`${BASE_URL}/whatsapp/qr-string/${sid}`);
      if (!res.ok) throw new Error('Gagal fetch QR');
      const data = await res.json();
      setQr(data.qr);
    } catch (e: any) {
      setError(e.message || 'Gagal fetch QR');
    }
  };

  const handleConnect = async () => {
    setStatus('loading');
    setQr(null);
    setError('');
    try {
      // Start session (generate QR string)
      const res = await fetch(`${BASE_URL}/whatsapp/start-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: selectedSession }),
      });
      if (!res.ok) throw new Error('Gagal mulai session');
      // Fetch QR string after starting
      await fetchQr(selectedSession);
      setStatus('idle');
    } catch (e: any) {
      setError(e.message || 'Gagal fetch QR');
      setStatus('failed');
    }
  };

  useEffect(() => {
    if (selectedSession) fetchQr(selectedSession);
    // eslint-disable-next-line
  }, [selectedSession]);

  const handleCheckStatus = async () => {
    setStatus('loading');
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/whatsapp/status/${selectedSession}`);
      if (!res.ok) throw new Error('Gagal cek status');
      const data = await res.json();
      if (data.connected) {
        setStatus('connected');
        setQr(null);
      } else {
        setStatus('idle');
      }
    } catch (e: any) {
      setError(e.message || 'Gagal cek status');
      setStatus('failed');
    }
  };

  // Tambah session baru
  const handleCreateSession = async () => {
    if (!newSessionId) return;
    setCreating(true);
    setError('');
    try {
      // Insert ke DB via backend (buat endpoint baru jika belum ada)
      const res = await fetch(`${BASE_URL}/whatsapp/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: newSessionId })
      });
      if (!res.ok) throw new Error('Gagal membuat session');
      // Refresh session list
      const sessionRes = await fetch(`${BASE_URL}/whatsapp/sessions`);
      const sessionData = await sessionRes.json();
      setSessions(sessionData);
      setSelectedSession(newSessionId);
      setNewSessionId('');
      await fetchQr(newSessionId);
    } catch (e: any) {
      setError(e.message || 'Gagal create session');
    } finally {
      setCreating(false);
    }
  };

  // Hapus session
  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm(`Yakin hapus session ${sessionId}?`)) return;
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/whatsapp/delete-session/${sessionId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal hapus session');
      // Refresh session list
      const sessionRes = await fetch(`${BASE_URL}/whatsapp/sessions`);
      const sessionData = await sessionRes.json();
      setSessions(sessionData);
      // Reset selected jika yang dihapus adalah session aktif
      if (selectedSession === sessionId) {
        setSelectedSession(sessionData[0]?.session_id || '');
        setQr(null);
        setStatus('idle');
      }
    } catch (e: any) {
      setError(e.message || 'Gagal hapus session');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Navbar2 />
      <div className="max-w-md mx-auto p-6 mt-10 bg-white rounded-lg shadow-lg border border-gray-200">
        <h1 className="text-2xl font-bold mb-4 text-green-700">Setting WhatsApp Multi Session</h1>
        <div className="mb-4">
          <label className="block mb-1 text-gray-700">Buat Session WhatsApp Baru</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-3 py-2 rounded border border-gray-300 bg-white text-gray-900 focus:outline-none"
              placeholder="Masukkan nama session (ex: sales, finance, manager)"
              value={newSessionId}
              onChange={e => setNewSessionId(e.target.value)}
              disabled={creating}
            />
            <button
              className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 disabled:bg-green-200 disabled:cursor-not-allowed"
              onClick={handleCreateSession}
              disabled={creating || !newSessionId}
            >
              {creating ? 'Membuat...' : 'Create Session'}
            </button>
          </div>
        </div>
        <label className="block mb-2 text-gray-700">Pilih Session WhatsApp</label>
        <div className="flex gap-2 mb-4">
          <select
            className="flex-1 px-3 py-2 rounded border border-gray-300 bg-white text-gray-900 focus:outline-none"
            value={selectedSession}
            onChange={e => setSelectedSession(e.target.value)}
            disabled={status==='loading' || sessions.length === 0}
          >
            {sessions.map(s => (
              <option key={s.session_id} value={s.session_id}>
                {s.session_id} ({s.status})
              </option>
            ))}
          </select>
          <button
            className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 disabled:bg-red-200 disabled:cursor-not-allowed"
            onClick={() => handleDeleteSession(selectedSession)}
            disabled={sessions.length === 0 || !selectedSession}
          >
            Hapus
          </button>
        </div>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-green-200 disabled:cursor-not-allowed mb-4"
          onClick={handleConnect}
          disabled={status==='loading' || !selectedSession || sessions.length === 0}
        >
          {status==='loading' ? 'Memuat QR...' : 'Konek/Refresh QR'}
        </button>
        <button
          className="ml-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-200 disabled:cursor-not-allowed mb-4"
          onClick={handleCheckStatus}
          disabled={status==='loading' || !selectedSession || sessions.length === 0}
        >
          Cek Status
        </button>
        {qr && (
          <div className="flex flex-col items-center mt-4">
            <div className="mb-2 text-gray-700">Scan QR di bawah ini dengan WhatsApp:</div>
            <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #eee' }}>
              <QRCode value={qr} size={224} />
            </div>
          </div>
        )}
        {status==='connected' && (
          <div className="mt-4 text-green-700 font-bold">Koneksi berhasil!</div>
        )}
        {error && (
          <div className="mt-4 text-red-600">{error}</div>
        )}
      </div>
    </div>
  );
};
// --- END MULTI SESSION SUPPORT ---

export default WhatsappSettingPage;
