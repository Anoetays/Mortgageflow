import express from 'express';
import { loginOfficer, verifyToken, logout } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/login', loginOfficer);

// Protected routes
router.get('/verify', authenticateToken, verifyToken);
router.post('/logout', authenticateToken, logout);

export default router;
