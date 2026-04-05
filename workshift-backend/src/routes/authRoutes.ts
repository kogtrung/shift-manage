import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/authController';
import { validateBody } from '../middleware/validateBody';
import { requireAuth } from '../middleware/authJwt';
import { loginSchema, refreshSchema, registerSchema } from '../validation/authSchemas';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/refresh', validateBody(refreshSchema), refresh);
router.post('/logout', requireAuth, logout);

export default router;
