
import express from 'express';
import {
  submitFeePayment,
  getStudentFeeHistory,
  checkFeeEligibility,
  getFeeSummary,
  getPreviousPaymentsForCurrentMonth,
  getAllPaymentStatusController
} from '../controllers/feeController.js';
import { check } from 'express-validator';

const router = express.Router();

router.post(
  '/submit',
  [
    check('student_id', 'Student ID is required').isInt(),
    check('student_name', 'Student name is required').not().isEmpty(),
    check('class_name', 'Class name is required').not().isEmpty(),
    check('payment_date', 'Payment date is required').isISO8601(),
    check('monthly_fee', 'Monthly fee must be a number').optional().isNumeric(),
    check('admission_fee', 'Admission fee must be a number').optional().isNumeric(),
    check('registration_fee', 'Registration fee must be a number').optional().isNumeric(),
    check('art_material', 'Art material fee must be a number').optional().isNumeric(),
    check('transport', 'Transport fee must be a number').optional().isNumeric(),
    check('books', 'Books fee must be a number').optional().isNumeric(),
    check('uniform', 'Uniform fee must be a number').optional().isNumeric(),
    check('fine', 'Fine must be a number').optional().isNumeric(),
    check('others', 'Others must be a number').optional().isNumeric(),
    check('deposit', 'Deposit must be a number').optional().isNumeric(),
    check('selected_months', 'Selected months must be an array').optional().isArray(),
    check('monthly_fees', 'Monthly fees must be an object').optional().isObject()
  ],
  submitFeePayment
);

router.get('/history/:studentId', getStudentFeeHistory);
router.get('/eligibility/:studentId', checkFeeEligibility);
router.get('/summary/:studentId', getFeeSummary);
router.get('/previous-payments/:studentId/:month', getPreviousPaymentsForCurrentMonth);
router.get('/payment-status/:studentId', getAllPaymentStatusController);

export default router;
