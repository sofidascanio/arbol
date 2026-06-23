import { Router } from 'express';
import { verifyToken } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { list, getOne, create, update, remove } from '@/controllers/bookmark.controller';
import { listSchema, createSchema, updateSchema } from '@/schemas/bookmark.schema';

const router = Router();

router.use(verifyToken);

router.get('/', [...listSchema, validate], list);
router.get('/:id', getOne);
router.post('/', [...createSchema, validate], create);
router.put('/:id', [...updateSchema, validate], update);
router.delete('/:id', remove);

export default router;