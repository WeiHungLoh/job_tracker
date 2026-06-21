import type { Request, Response } from 'express';
import type { PingResponse } from './models.js';
import express from 'express';

const router = express.Router();

router.get('/', (_req: Request<Record<string, never>, PingResponse>, res: Response<PingResponse>): void => {
    res.status(200).send('testing');
});

export default router;
