const express = require('express');
const path = require('path');
const candidatesRouter = require('./routes/candidates');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// /uploads/ 정적 파일 서빙
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// 라우트
app.use('/api/candidates', candidatesRouter);

// GET /api/health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// 공통 오류 핸들러
app.use((err, _req, res, _next) => {
  res.status(err.status || 500).json({ error: err.message || '서버 오류가 발생했습니다.' });
});

module.exports = app;
