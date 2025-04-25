import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api/files` : '/api/files';

export default function FileManagerPage() {
  const [files, setFiles] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState('');
  const [selectedFile, setSelectedFile] = useState<string|null>(null);
  const [previewUrl, setPreviewUrl] = useState<string|null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameInfo, setRenameInfo] = useState<{oldName: string, newName: string, isFolder: boolean}|null>(null);

  const fetchList = async (folder = '') => {
    const res = await axios.get(`${API_URL}/list`, { params: { folder } });
    setFiles(Array.isArray(res.data.files) ? res.data.files : []);
    setFolders(Array.isArray(res.data.folders) ? res.data.folders : []);
    setCurrentFolder(folder);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    formData.append('folder', currentFolder);
    await axios.post(`${API_URL}/upload`, formData);
    fetchList(currentFolder);
  };

  const handleDownload = (filename: string) => {
    window.open(`${API_URL}/download?folder=${encodeURIComponent(currentFolder)}&filename=${encodeURIComponent(filename)}`);
  };

  const handleDelete = async (name: string, isFolder = false) => {
    await axios.delete(`${API_URL}/delete`, { data: { folder: currentFolder, filename: name, isFolder } });
    fetchList(currentFolder);
  };

  const handlePreview = (filename: string) => {
    setPreviewUrl(`${API_URL}/preview?folder=${encodeURIComponent(currentFolder)}&filename=${encodeURIComponent(filename)}`);
    setSelectedFile(filename);
  };

  const handleMkdir = async () => {
    if (!newFolderName) return;
    await axios.post(`${API_URL}/mkdir`, { folder: currentFolder, name: newFolderName });
    setNewFolderName('');
    fetchList(currentFolder);
  };

  const handleRename = async () => {
    if (!renameInfo || !renameInfo.newName) return;
    await axios.post(`${API_URL}/rename`, { folder: currentFolder, oldName: renameInfo.oldName, newName: renameInfo.newName });
    setRenameInfo(null);
    fetchList(currentFolder);
  };

  const enterFolder = (folder: string) => {
    fetchList(currentFolder ? `${currentFolder}/${folder}` : folder);
  };

  const goUp = () => {
    if (!currentFolder) return;
    const parts = currentFolder.split('/').filter(Boolean);
    parts.pop();
    fetchList(parts.join('/'));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white text-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">File Manager</h1>
      <div className="mb-2 flex gap-2 items-center">
        <button className="px-2 py-1 bg-gray-200 rounded" onClick={goUp} disabled={!currentFolder}>⬆️ Up</button>
        <span className="text-gray-600">/{currentFolder}</span>
        <input
          type="text"
          value={newFolderName}
          onChange={e => setNewFolderName(e.target.value)}
          placeholder="Folder name"
          className="border px-2 py-1 rounded ml-2"
        />
        <button className="px-2 py-1 bg-green-200 rounded" onClick={handleMkdir}>+ Folder</button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
        <button className="px-2 py-1 bg-blue-200 rounded" onClick={() => fileInputRef.current?.click()}>+ Upload</button>
      </div>
      <table className="w-full mt-2 border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left px-2 py-1">Name</th>
            <th>Type</th>
            <th className="w-32">Action</th>
          </tr>
        </thead>
        <tbody>
          {folders.map(folder => (
            <tr key={folder} className="bg-gray-50">
              <td className="px-2 py-1 cursor-pointer text-blue-800" onClick={() => enterFolder(folder)}>
                📁 {folder}
              </td>
              <td>Folder</td>
              <td>
                <button className="text-red-600 mr-2" onClick={() => handleDelete(folder, true)}>Delete</button>
                <button className="text-yellow-600" onClick={() => setRenameInfo({ oldName: folder, newName: '', isFolder: true })}>Rename</button>
              </td>
            </tr>
          ))}
          {files.map(file => (
            <tr key={file}>
              <td className="px-2 py-1 cursor-pointer text-green-800" onClick={() => handlePreview(file)}>
                🗎 {file}
              </td>
              <td>File</td>
              <td>
                <button className="text-blue-600 mr-2" onClick={() => handleDownload(file)}>Download</button>
                <button className="text-red-600 mr-2" onClick={() => handleDelete(file, false)}>Delete</button>
                <button className="text-yellow-600" onClick={() => setRenameInfo({ oldName: file, newName: '', isFolder: false })}>Rename</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {renameInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="mb-2 font-bold">Rename {renameInfo.isFolder ? 'Folder' : 'File'}: {renameInfo.oldName}</h3>
            <input
              type="text"
              value={renameInfo.newName}
              onChange={e => setRenameInfo({ ...renameInfo, newName: e.target.value })}
              className="border px-2 py-1 rounded mb-2 w-full"
              placeholder="New name"
            />
            <div className="flex gap-2">
              <button className="px-2 py-1 bg-blue-500 text-white rounded" onClick={handleRename}>Rename</button>
              <button className="px-2 py-1 bg-gray-300 rounded" onClick={() => setRenameInfo(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white p-4 rounded shadow max-w-xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <h3 className="mb-2 font-bold">Preview: {selectedFile}</h3>
            {previewUrl.endsWith('.png') || previewUrl.endsWith('.jpg') || previewUrl.endsWith('.jpeg') || previewUrl.endsWith('.gif') ? (
              <img src={previewUrl} alt="preview" className="max-w-full max-h-[60vh]" />
            ) : previewUrl.endsWith('.pdf') ? (
              <iframe src={previewUrl} className="w-full h-[60vh]" title="PDF Preview"></iframe>
            ) : (
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open File</a>
            )}
            <div className="mt-2 text-right">
              <button className="px-2 py-1 bg-gray-300 rounded" onClick={() => setPreviewUrl(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
