import React, { useState, useEffect } from 'react';
import { getCustomers } from '../services/customerService';
import { sendBroadcast, sendBroadcastImage, sendBroadcastVideo, sendBroadcastDocument, sendBroadcastVoice } from '../services/broadcastService';
import { askAIString } from '../services/aiService';
import Navbar2 from '../components/Navbar2';

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface BroadcastStatus {
  phone: string;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  message: string;
}

const BroadcastPage: React.FC = () => {
  const [message, setMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [statusList, setStatusList] = useState<BroadcastStatus[]>([]);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [messageType, setMessageType] = useState<'text'|'image'|'video'|'document'|'voice'>('text');
  const [mediaFile, setMediaFile] = useState<File|null>(null);
  const [caption, setCaption] = useState('');
  const [sessions, setSessions] = useState<{session_id:string,status:string}[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');

  const allSelected = customers.length > 0 && selectedPhones.length === customers.length;

  useEffect(() => {
    getCustomers().then(setCustomers);
  }, []);

  useEffect(() => {
    setSelectedPhones((prev) => prev.filter(phone => filteredCustomers.some(c => c.phone === phone)));
  }, [search, customers]);

  useEffect(() => {
    fetch('http://localhost:3331/whatsapp/sessions')
      .then(res => res.json())
      .then(data => {
        setSessions(data);
        if (data.length > 0) setSelectedSession(data[0].session_id);
      });
  }, []);

  const handleSelectPhone = (phone: string) => {
    setSelectedPhones((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]
    );
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedPhones([]);
    } else {
      setSelectedPhones(customers.map((c) => c.phone));
    }
  };

  const handleAskAI = async () => {
    setAiLoading(true);
    const aiResponse = await askAIString(message);
    setMessage(aiResponse);
    setAiLoading(false);
  };

  const handleBroadcast = async () => {
    setSending(true);
    const initialStatus = selectedPhones.map((phone) => ({ phone, status: 'pending' as const, message: '' }));
    setStatusList(initialStatus);

    for (const phone of selectedPhones) {
      setStatusList((prev) =>
        prev.map((s) =>
          s.phone === phone ? { ...s, status: 'sending' } : s
        )
      );
      try {
        if (messageType === 'text') {
          await sendBroadcast(phone, message, selectedSession);
        } else if (messageType === 'image' && mediaFile) {
          await sendBroadcastImage(phone, mediaFile, caption, selectedSession);
        } else if (messageType === 'video' && mediaFile) {
          await sendBroadcastVideo(phone, mediaFile, caption, selectedSession);
        } else if (messageType === 'document' && mediaFile) {
          await sendBroadcastDocument(phone, mediaFile, caption, selectedSession);
        } else if (messageType === 'voice' && mediaFile) {
          await sendBroadcastVoice(phone, mediaFile, selectedSession);
        } else {
          throw new Error('File belum dipilih');
        }
        setStatusList((prev) =>
          prev.map((s) =>
            s.phone === phone ? { ...s, status: 'sent', message: 'Terkirim' } : s
          )
        );
      } catch (e: any) {
        setStatusList((prev) =>
          prev.map((s) =>
            s.phone === phone ? { ...s, status: 'failed', message: e?.message || 'Gagal' } : s
          )
        );
      }
    }
    setSending(false);
  };

  const filteredCustomers = customers.filter((c) =>
    (c.name?.toLowerCase?.() || '').includes(search.toLowerCase())
  );

  const allFilteredSelected = filteredCustomers.length > 0 && filteredCustomers.every(c => selectedPhones.includes(c.phone));

  const handleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedPhones(prev => prev.filter(phone => !filteredCustomers.some(c => c.phone === phone)));
    } else {
      setSelectedPhones(prev => Array.from(new Set([...prev, ...filteredCustomers.map(c => c.phone)])));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Navbar2 />
      <div className="max-w-2xl mx-auto p-6 mt-10 bg-gray-900 rounded-lg shadow-lg border border-gray-700">
        <h1 className="text-2xl font-bold mb-4 text-blue-400">Broadcast Pesan</h1>
        {/* Pilih tipe pesan */}
        <div className="flex gap-4 mb-4">
          {['text','image','video','document','voice'].map(type => (
            <label key={type} className={`cursor-pointer px-3 py-1 rounded ${messageType===type ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
              <input
                type="radio"
                name="messageType"
                value={type}
                checked={messageType===type}
                onChange={() => {setMessageType(type as any); setMediaFile(null); setCaption('')}}
                className="mr-2 hidden"
              />
              {type==='text'?'Teks':type==='image'?'Gambar':type==='video'?'Video':type==='document'?'Dokumen':'Voice Note'}
            </label>
          ))}
        </div>
        {/* Input pesan/caption/file */}
        {messageType==='text' && (
          <>
            <label className="block mb-2 font-semibold text-gray-200">Isi Pesan</label>
            <textarea
              className="w-full border border-gray-700 rounded px-3 py-2 mb-2 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tulis pesan..."
              disabled={sending}
            />
          </>
        )}
        {messageType!=='text' && (
          <>
            <label className="block mb-2 font-semibold text-gray-200">Pilih File {messageType==='voice'?'Voice Note':messageType.charAt(0).toUpperCase()+messageType.slice(1)}</label>
            <input
              type="file"
              accept={messageType==='image'?"image/*":messageType==='video'?"video/*":messageType==='document'?"application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain":"audio/*"}
              onChange={e=>setMediaFile(e.target.files?.[0]||null)}
              disabled={sending}
              className="mb-2"
            />
            {mediaFile && (
              <div className="mb-2 text-sm text-gray-400">File: {mediaFile.name}</div>
            )}
            {messageType!=='voice' && (
              <>
                <label className="block mb-2 font-semibold text-gray-200">Caption (opsional)</label>
                <input
                  type="text"
                  className="w-full border border-gray-700 rounded px-3 py-2 mb-2 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={caption}
                  onChange={e=>setCaption(e.target.value)}
                  placeholder="Tulis caption..."
                  disabled={sending}
                />
              </>
            )}
          </>
        )}
        <label className="block mb-2 font-semibold text-gray-200">Pilih Session WhatsApp</label>
        <select
          className="w-full mb-4 px-3 py-2 rounded border border-gray-700 bg-gray-800 text-white focus:outline-none"
          value={selectedSession}
          onChange={e => setSelectedSession(e.target.value)}
          disabled={sending || sessions.length === 0}
        >
          {sessions.length === 0 ? (
            <option value="">Tidak ada session</option>
          ) : (
            sessions.map(s => (
              <option key={s.session_id} value={s.session_id}>
                {s.session_id} ({s.status})
              </option>
            ))
          )}
        </select>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
          onClick={handleAskAI}
          disabled={aiLoading || sending}
        >
          {aiLoading ? 'Meminta AI...' : 'Bantu AI'}
        </button>
        <hr className="my-6 border-gray-700" />
        <label className="block mb-2 font-semibold text-gray-200">Pilih Customer</label>
        <input
          type="text"
          className="w-full mb-2 px-3 py-2 rounded border border-gray-700 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Cari nama atau nomor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={sending}
        />
        <pre className="text-xs text-gray-400 bg-gray-900 p-2 rounded mb-2 overflow-x-auto" style={{display:'none'}}>
          Search: {JSON.stringify(search)}
          {"\n"}Customers: {JSON.stringify(customers)}
          {"\n"}Filtered: {JSON.stringify(filteredCustomers)}
        </pre>
        <div className="flex items-center mb-2">
          <input
            type="checkbox"
            className="form-checkbox h-5 w-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            checked={allFilteredSelected}
            onChange={handleSelectAllFiltered}
            disabled={sending || filteredCustomers.length === 0}
          />
          <span className="ml-2 text-gray-100 font-semibold">Pilih Semua</span>
        </div>
        <div className="max-h-60 overflow-y-auto border border-gray-700 rounded p-2 mb-4 bg-gray-800">
          <div className="flex flex-col gap-1">
            {filteredCustomers.length === 0 ? (
              <div className="text-gray-500 text-center py-2">Tidak ada customer ditemukan.</div>
            ) : (
              filteredCustomers.map((c, idx) => {
                const key = c.phone || `no-phone-${idx}`;
                return (
                  <div key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedPhones.includes(c.phone)}
                      onChange={() => handleSelectPhone(c.phone)}
                      disabled={sending}
                      className="form-checkbox h-5 w-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-gray-100">{c.name || '(Tanpa Nama)'} <span className="text-gray-400">({c.phone || 'No Phone'})</span></span>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-green-400 disabled:cursor-not-allowed"
          onClick={handleBroadcast}
          disabled={sending || (messageType==='text'?(!message):(selectedPhones.length===0 || !mediaFile))}
        >
          {sending ? 'Mengirim...' : 'Kirim Broadcast'}
        </button>
        <div className="mt-8">
          <h2 className="font-semibold mb-2 text-gray-200">Status Broadcast</h2>
          <ul>
            {statusList.map((s) => (
              <li key={s.phone} className="mb-1">
                <span className="font-mono text-gray-400">{s.phone}</span>:
                <span className={
                  s.status === 'sent'
                    ? 'text-green-400'
                    : s.status === 'failed'
                    ? 'text-red-400'
                    : 'text-yellow-400'
                }> {s.status.toUpperCase()}</span>
                {s.message && <span className="ml-2 text-gray-500">({s.message})</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BroadcastPage;
