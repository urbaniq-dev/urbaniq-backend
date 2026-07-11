import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, message: 'Amount is required' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
    });

    const options = {
      amount: amount, // amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ success: false, message: 'Some error occurred while creating order' });
    }

    res.status(200).json({ success: true, order });
  } catch (error: any) {
    console.error('Error creating razorpay order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
};
