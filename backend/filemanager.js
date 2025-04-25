import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const FILES_ROOT = path.join(__dirname, '../files');
if (!fs.existsSync(FILES_ROOT)) fs.mkdirSync(FILES_ROOT);

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = req.body.folder || '';
    let targetDir = path.join(FILES_ROOT, folder);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// List files/folders
router.get('/list', (req, res) => {
  let folder = req.query.folder || '';
  let dirPath = path.join(FILES_ROOT, folder);
  if (!fs.existsSync(dirPath)) return res.json({ files: [], folders: [] });
  const items = fs.readdirSync(dirPath);
  const files = items.filter(i => fs.statSync(path.join(dirPath, i)).isFile());
  const folders = items.filter(i => fs.statSync(path.join(dirPath, i)).isDirectory());
  res.json({ files, folders });
});

// Upload file
router.post('/upload', upload.single('file'), (req, res) => {
  res.json({ success: true, filename: req.file.filename });
});

// Download file
router.get('/download', (req, res) => {
  let { folder = '', filename } = req.query;
  if (!filename) return res.status(400).json({ error: 'No filename' });
  let filePath = path.join(FILES_ROOT, folder, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  res.download(filePath);
});

// Delete file/folder
router.delete('/delete', (req, res) => {
  let { folder = '', filename, isFolder } = req.body;
  let targetPath = path.join(FILES_ROOT, folder, filename);
  if (!fs.existsSync(targetPath)) return res.status(404).json({ error: 'Not found' });
  try {
    if (isFolder) {
      fs.rmdirSync(targetPath, { recursive: true });
    } else {
      fs.unlinkSync(targetPath);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Rename file/folder
router.post('/rename', (req, res) => {
  let { folder = '', oldName, newName } = req.body;
  let oldPath = path.join(FILES_ROOT, folder, oldName);
  let newPath = path.join(FILES_ROOT, folder, newName);
  if (!fs.existsSync(oldPath)) return res.status(404).json({ error: 'Not found' });
  try {
    fs.renameSync(oldPath, newPath);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Preview file (image/pdf/text)
router.get('/preview', (req, res) => {
  let { folder = '', filename } = req.query;
  if (!filename) return res.status(400).json({ error: 'No filename' });
  let filePath = path.join(FILES_ROOT, folder, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });
  let ext = path.extname(filename).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".gif", ".pdf", ".txt", ".csv", ".md"].includes(ext)) {
    res.sendFile(filePath);
  } else {
    res.status(415).json({ error: 'Preview not supported for this file type' });
  }
});

// Create folder
router.post('/mkdir', (req, res) => {
  let { folder = '', name } = req.body;
  let targetDir = path.join(FILES_ROOT, folder, name);
  if (fs.existsSync(targetDir)) return res.status(400).json({ error: 'Folder already exists' });
  fs.mkdirSync(targetDir, { recursive: true });
  res.json({ success: true });
});

export default router;
