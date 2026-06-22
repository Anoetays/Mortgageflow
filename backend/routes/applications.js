import express from 'express';
import {
  submitApplication,
  getApplication,
  getApplications,
  updateApplicationStage,
  saveCreditAssessment,
  managerDecision,
  sendCounterOffer,
  updateCounterOfferStatus,
  getAnalytics,
} from '../controllers/applicationsController.js';
import { authenticateToken, isOfficer, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/submit', submitApplication);
router.get('/track/:id', getApplication);

// Protected routes (require authentication)
router.get('/analytics', authenticateToken, getAnalytics);
router.get('/', authenticateToken, getApplications);
router.get('/:id', authenticateToken, getApplication);

// Officer routes
router.put('/:id/stage', authenticateToken, isOfficer, updateApplicationStage);
router.post('/:id/credit-assessment', authenticateToken, authorize('Credit Admin', 'Branch Manager'), saveCreditAssessment);

// Manager-only routes
router.post('/:id/manager-decision', authenticateToken, authorize('Branch Manager'), managerDecision);
router.post('/:id/counter-offer', authenticateToken, authorize('Branch Manager', 'Credit Admin'), sendCounterOffer);
router.put('/:id/counter-offer/status', authenticateToken, authorize('Branch Manager', 'Credit Admin'), updateCounterOfferStatus);

export default router;
