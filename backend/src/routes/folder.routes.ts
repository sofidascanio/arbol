import { Router } from 'express';
import { verifyToken } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { getTree, getOne, getBreadcrumbHandler, create, update, remove } from '@/controllers/folder.controller';
import { createSchema, updateSchema } from '@/schemas/folder.schema';

const router = Router();

router.use(verifyToken);

router.get('/', getTree);
router.get('/:id', getOne);
router.get('/:id/breadcrumb', getBreadcrumbHandler);
router.post('/', [...createSchema, validate], create);
router.put('/:id', [...updateSchema, validate], update);
router.delete('/:id', remove);

export default router;