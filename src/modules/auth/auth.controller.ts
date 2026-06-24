import { Request, Response } from 'express';
import User from '../user/user.model';
import { generateOTP, storeOTP, verifyOTPCode } from './services/otp.service';
import { sendOTPEmail } from './services/email.service';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
} from './services/token.service';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role || 'Buyer',
    });

    if (user) {
      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = await generateRefreshToken(user._id.toString());

      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        accessToken,
        refreshToken,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = await generateRefreshToken(user._id.toString());

      res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        accessToken,
        refreshToken,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Google OAuth stub
export const googleAuth = async (req: Request, res: Response) => {
  // To be implemented using google-auth-library
  res.status(501).json({ message: 'Google OAuth not implemented yet' });
};

// Send OTP via Email using Redis store
export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    const otp = generateOTP();
    await storeOTP(email, otp);

    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }

    // For debugging/development purposes, we also return the OTP in the body if SMTP is missing
    const showOtpInResponse = !process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD;

    res.json({
      message: 'OTP sent successfully',
      ...(showOtpInResponse ? { otp } : {})
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify OTP from Redis store and update user verification status
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const isValid = await verifyOTPCode(email, otp);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isVerified = true;
    await user.save();

    res.json({ message: 'Email verified successfully', isVerified: true });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Refresh access token and refresh token (Rotation)
export const refreshSession = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    const decoded = await verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Invalidate the old refresh token
    await revokeRefreshToken(decoded.id, decoded.jti);

    // Generate brand new access and refresh tokens
    const newAccessToken = generateAccessToken(decoded.id);
    const newRefreshToken = await generateRefreshToken(decoded.id);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout and invalidate the current refresh token session
export const logoutUser = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    const decoded = await verifyRefreshToken(refreshToken);
    if (decoded) {
      // Invalidate token from Redis
      await revokeRefreshToken(decoded.id, decoded.jti);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
