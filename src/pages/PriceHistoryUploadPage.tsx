import React, { useRef, useState } from 'react';
import Papa from 'papaparse';

interface PriceHistoryRow {
  tanggal: string;
  buah?: number;
  kopra?: number;
  cno?: number;
  vco_a?: number;
  vco_b?: number;
  arang?: number;
  bungkil?: number;
}

const PriceHistoryUploadPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [rows, setRows] = useState<PriceHistoryRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setRows(results.data as PriceHistoryRow[]);
      },
      error: () => {
        setMessage('Failed to parse CSV.');
      },
    });
  };

  const handleUpload = async () => {
    setUploading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/history-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      if (res.ok) {
        setMessage('Upload sukses!');
        setRows([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setMessage('Upload gagal.');
      }
    } catch (e) {
      setMessage('Terjadi error saat upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-4">Upload Data History Harga</h2>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="mb-4"
      />
      {rows.length > 0 && (
        <>
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Buah</th>
                  <th>Kopra</th>
                  <th>CNO</th>
                  <th>VCO A</th>
                  <th>VCO B</th>
                  <th>Arang</th>
                  <th>Bungkil</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.tanggal}</td>
                    <td>{row.buah}</td>
                    <td>{row.kopra}</td>
                    <td>{row.cno}</td>
                    <td>{row.vco_a}</td>
                    <td>{row.vco_b}</td>
                    <td>{row.arang}</td>
                    <td>{row.bungkil}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded font-bold"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload ke Database'}
          </button>
        </>
      )}
      {message && <div className="mt-4 text-center text-lg font-semibold">{message}</div>}
    </div>
  );
};

export default PriceHistoryUploadPage;
