import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { tmpdir } from 'node:os';
import { SourceType } from '@claudemd-gen/shared';
import type { AnalyzeRequest } from '@claudemd-gen/shared';
import { asyncHandler } from '../middlewares/error-handler.js';
import { validateAnalyzeRequest } from '../middlewares/validator.js';
import { analyzeProject } from '../services/analyze.service.js';
import { MAX_UPLOAD_SIZE_MB } from '@claudemd-gen/shared';

const router = Router();

const upload = multer({
  dest: tmpdir(), // 파일을 디스크에 저장해야 req.file.path를 사용할 수 있음
  limits: { fileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are accepted.'));
    }
  },
});

// POST /api/analyze
router.post(
  '/',
  validateAnalyzeRequest,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await analyzeProject({ request: req.body as AnalyzeRequest });
    res.json(result);
  }),
);

// POST /api/analyze/upload
router.post(
  '/upload',
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    const uploadedFilePath = req.file?.path;

    const analyzeRequest: AnalyzeRequest = {
      source: { type: SourceType.ZIP_UPLOAD, value: '' },
    };

    const serviceInput = uploadedFilePath !== undefined
      ? { request: analyzeRequest, uploadedFilePath }
      : { request: analyzeRequest };

    const result = await analyzeProject(serviceInput);
    res.json(result);
  }),
);

export default router;
