import express from 'express';
import * as paymentController from './payment.controller';
import { protect } from '../../core/middlewares/auth.middleware';

const router = express.Router();

router.post('/create-order', protect, paymentController.createOrder);

export default router;
