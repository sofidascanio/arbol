import { Router } from 'express';
import { verifyToken } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { list, getPopular, getBookmarkTagsHandler, addTags, removeTag, updateColor, create, remove, rename } from '@/controllers/tag.controller';
import { getPopularSchema, addTagsSchema, removeTagSchema, updateColorSchema, createTagSchema, renameTagSchema } from '@/schemas/tag.schema';

const router = Router();

router.use(verifyToken);

router.get('/', list);
router.get('/popular', [...getPopularSchema, validate], getPopular);
router.get('/bookmark/:bookmarkId', getBookmarkTagsHandler);
router.post('/', [...createTagSchema, validate], create);           // ← crear tag
router.post('/bookmark/:bookmarkId', [...addTagsSchema, validate], addTags);
router.delete('/bookmark/:bookmarkId/:tagName', [...removeTagSchema, validate], removeTag);
router.patch('/:tagId/color', [...updateColorSchema, validate], updateColor);
router.delete('/:tagId', remove);     
router.patch('/:tagId/name', [...renameTagSchema, validate], rename);

export default router;