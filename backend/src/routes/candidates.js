const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

// multer 설정: UUID 파일명, jpg/png 허용, 5MB 제한
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uuidv4() + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('jpg/png 파일만 업로드할 수 있습니다.'));
    }
  },
});

// 후보자 row → 응답 객체 변환
function toResponse(row) {
  return {
    id: row.id,
    contractId: row.contract_id,
    name: row.name,
    photoUrl: row.photo_filename ? `/uploads/${row.photo_filename}` : null,
  };
}

// POST /api/candidates — 후보자 등록
router.post('/', upload.single('photo'), (req, res) => {
  const { contractId, name } = req.body;

  if (!contractId || !name) {
    if (req.file) fs.unlinkSync(path.join(UPLOADS_DIR, req.file.filename));
    return res.status(400).json({ error: 'contractId와 name은 필수입니다.' });
  }

  const parsedContractId = parseInt(contractId, 10);
  if (isNaN(parsedContractId)) {
    if (req.file) fs.unlinkSync(path.join(UPLOADS_DIR, req.file.filename));
    return res.status(400).json({ error: 'contractId는 숫자여야 합니다.' });
  }

  const photoFilename = req.file ? req.file.filename : null;

  try {
    const stmt = db.prepare(
      'INSERT INTO candidates (contract_id, name, photo_filename) VALUES (?, ?, ?)'
    );
    const result = stmt.run(parsedContractId, name, photoFilename);
    const row = db.prepare('SELECT * FROM candidates WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json(toResponse(row));
  } catch (err) {
    if (req.file) fs.unlinkSync(path.join(UPLOADS_DIR, req.file.filename));
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: '이미 등록된 contractId입니다.' });
    }
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/candidates — 전체 조회
router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM candidates ORDER BY contract_id ASC').all();
  return res.json(rows.map(toResponse));
});

// GET /api/candidates/:contractId — 단건 조회
router.get('/:contractId', (req, res) => {
  const contractId = parseInt(req.params.contractId, 10);
  if (isNaN(contractId)) return res.status(400).json({ error: '유효하지 않은 contractId입니다.' });

  const row = db.prepare('SELECT * FROM candidates WHERE contract_id = ?').get(contractId);
  if (!row) return res.status(404).json({ error: '후보자를 찾을 수 없습니다.' });

  return res.json(toResponse(row));
});

// DELETE /api/candidates/:contractId — 삭제 (파일도 함께 삭제)
router.delete('/:contractId', (req, res) => {
  const contractId = parseInt(req.params.contractId, 10);
  if (isNaN(contractId)) return res.status(400).json({ error: '유효하지 않은 contractId입니다.' });

  const row = db.prepare('SELECT * FROM candidates WHERE contract_id = ?').get(contractId);
  if (!row) return res.status(404).json({ error: '후보자를 찾을 수 없습니다.' });

  // 파일 삭제
  if (row.photo_filename) {
    const filePath = path.join(UPLOADS_DIR, row.photo_filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  db.prepare('DELETE FROM candidates WHERE contract_id = ?').run(contractId);
  return res.json({ success: true });
});

module.exports = router;
