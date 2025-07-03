import express from 'express';
import {
  submitFeePayment,
  getStudentFeeHistory,
  checkFeeEligibility,
  getFeeSummary,
  getPreviousPaymentsForCurrentMonth,
  getAllPaymentStatusController,
  getYearlyFeeSummary,
  getPaidFees, // Add this import
  getFeeStructure
} from '../controllers/feeController.js';

import { verifyToken } from '../middlewares/auth.js';
import { check } from 'express-validator';

const router = express.Router();

router.post(
  '/submit',
  [
    check('student_id', 'Student ID is required').isInt(),
    check('student_name', 'Student name is required').not().isEmpty(),
    check('class_name', 'Class name is required').not().isEmpty(),
    check('payment_date', 'Payment date is required').isISO8601(),
    check('fee_months', 'Fee months must be an array').optional().isArray(),
    check('previous_balance', 'Previous balance must be a number')
      .optional()
      .isNumeric(),
    check('deposit', 'Deposit must be a number').optional().isNumeric(),
    check('remark', 'Remark is required').not().isEmpty(),
    check('is_new_admission', 'Is new admission must be a boolean')
      .optional()
      .isBoolean(),
    check('is_yearly_payment', 'Is yearly payment must be a boolean')
      .optional()
      .isBoolean(),
    check('fee_items', 'Fee items must be an array').isArray(),
    check('fee_items.*.fee_master_id', 'Fee master ID must be an integer').isInt(),
    check('fee_items.*.fee_name', 'Fee name is required').not().isEmpty(),
    check('fee_items.*.amount', 'Amount must be a number').isNumeric(),
    check('fee_items.*.is_monthly', 'Is monthly must be a boolean')
      .optional()
      .isBoolean(),
    check('fee_items.*.is_yearly', 'Is yearly must be a boolean')
      .optional()
      .isBoolean(),
  ],
  verifyToken,
  submitFeePayment
);

router.get('/history/:studentId', verifyToken, getStudentFeeHistory);
router.get('/eligibility/:studentId', verifyToken, checkFeeEligibility);
router.get('/summary/:studentId', verifyToken, getFeeSummary);
router.get('/previous-payments/:studentId/:month', verifyToken, getPreviousPaymentsForCurrentMonth);
router.get('/payment-status/:studentId', verifyToken, getAllPaymentStatusController);
router.get('/yearly-summary/:studentId', verifyToken, getYearlyFeeSummary);
router.get('/fees/paid', verifyToken, getPaidFees); // Add this new route
router.get('/structure', verifyToken, getFeeStructure);

export default router;
