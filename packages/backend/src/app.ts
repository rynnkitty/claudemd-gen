import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health.route.js';
import analyzeRouter from './routes/analyze.route.js';
import { errorHandler } from './middlewares/error-handler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/analyze', analyzeRouter);

// 전역 에러 핸들러 — 반드시 라우터 뒤에 등록
app.use(errorHandler);

export default app;
