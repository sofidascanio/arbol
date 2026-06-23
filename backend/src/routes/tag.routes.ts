import { Router } from 'express';
import { verifyToken } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { list, getPopular, getBookmarkTagsHandler, addTags, removeTag } from '@/controllers/tag.controller';
import { getPopularSchema, addTagsSchema, removeTagSchema } from '@/schemas/tag.schema';

const router = Router();

router.use(verifyToken);

router.get('/', list);
router.get('/popular', [...getPopularSchema, validate], getPopular);
router.get('/bookmark/:bookmarkId', getBookmarkTagsHandler);
router.post('/bookmark/:bookmarkId', [...addTagsSchema, validate], addTags);
router.delete('/bookmark/:bookmarkId/:tagName', [...removeTagSchema, validate], removeTag);

export default router;