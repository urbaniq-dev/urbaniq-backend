import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../user/user.model';
import { redisClient } from '../../config/redis';
import { generateOTP, storeOTP, verifyOTPCode } from './services/otp.service';
import { sendOTPEmail, sendResetPasswordEmail } from './services/email.service';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
} from './services/token.service';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, role, phone, experienceYears, specialties, profileImage, verificationDocument, agentLocation, operatingAreas } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Auto-generate OTP
    const otp = generateOTP();
    await storeOTP(normalizedEmail, otp);
    await sendOTPEmail(normalizedEmail, otp);

    // Cache the registration payload in Redis (TTL: 10 minutes)
    const pendingUser = {
      firstName,
      lastName,
      email: normalizedEmail,
      password,
      role: role || 'Buyer',
      phone,
      profileImage,
      agentProfile: role === 'Agent' ? {
        experienceYears: experienceYears ? Number(experienceYears) : 0,
        specialties: specialties || [],
        verificationDocument,
        location: agentLocation ? {
          address: agentLocation.address || '',
          city: agentLocation.city || '',
          state: agentLocation.state || '',
          country: agentLocation.country || '',
          zipCode: agentLocation.zipCode || '',
          operatingAreas: operatingAreas || [],
        } : undefined,
      } : undefined,
    };
    const cacheKey = `pendingUser:${normalizedEmail}`;
    await redisClient.set(cacheKey, JSON.stringify(pendingUser), { EX: 600 });

    res.status(200).json({
      message: 'Verification code sent to email',
      email: normalizedEmail,
    });
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
        isVerified: user.isVerified,
        token: accessToken,
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

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google Client ID is not configured on the server' });
    }

    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Invalid ID token payload' });
    }

    const email = payload.email.toLowerCase().trim();
    let user = await User.findOne({ email });

    if (user) {
      // User exists - link googleId if missing
      if (!user.googleId) {
        user.googleId = payload.sub;
        await user.save();
      }

      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = await generateRefreshToken(user._id.toString());

      return res.json({
        isNewUser: false,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
        token: accessToken,
        accessToken,
        refreshToken,
      });
    }

    // User does not exist - notify frontend that role selection is required
    return res.json({
      isNewUser: true,
      email,
      firstName: payload.given_name || '',
      lastName: payload.family_name || '',
      googleId: payload.sub,
    });
  } catch (error: any) {
    console.error('Google Auth error:', error);
    res.status(400).json({ message: 'Google authentication failed: ' + error.message });
  }
};

export const googleRegister = async (req: Request, res: Response) => {
  try {
    const { idToken, role } = req.body;
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Google Client ID is not configured on the server' });
    }

    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Invalid ID token payload' });
    }

    const email = payload.email.toLowerCase().trim();
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: 'Account already exists for this email. Please sign in instead.' });
    }

    // Create user (Google accounts are automatically email-verified!)
    user = await User.create({
      firstName: payload.given_name || 'Google',
      lastName: payload.family_name || 'User',
      email,
      googleId: payload.sub,
      isVerified: role === 'Agent' ? false : true,
      role,
    });

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = await generateRefreshToken(user._id.toString());

    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      token: accessToken,
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Google Register error:', error);
    res.status(400).json({ message: 'Google registration failed: ' + error.message });
  }
};

// Send OTP via Email using Redis store (handles both existing users and pending registrations)
export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if the user exists in the database
    const user = await User.findOne({ email: normalizedEmail });

    // Also check if there's a pending user registration session in Redis
    const cacheKey = `pendingUser:${normalizedEmail}`;
    const pendingUser = await redisClient.get(cacheKey);

    if (!user && !pendingUser) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    const otp = generateOTP();
    await storeOTP(normalizedEmail, otp);

    const emailSent = await sendOTPEmail(normalizedEmail, otp);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }

    res.json({
      message: 'OTP sent successfully',
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify OTP, persist user details to database, and return auth tokens
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const isValid = await verifyOTPCode(normalizedEmail, otp);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const cacheKey = `pendingUser:${normalizedEmail}`;
    const cachedPayload = await redisClient.get(cacheKey);
    if (!cachedPayload) {
      return res.status(400).json({ message: 'Registration session expired. Please sign up again.' });
    }

    const pendingData = JSON.parse(cachedPayload);

    // Create the user in database (Mongoose automatically runs pre-save validation/hashing)
    const user = await User.create({
      ...pendingData,
      isVerified: pendingData.role === 'Agent' ? false : true,
    });

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = await generateRefreshToken(user._id.toString());

    // Clean up cached payload
    await redisClient.del(cacheKey);

    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      token: accessToken,
      accessToken,
      refreshToken,
    });
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
      token: newAccessToken,
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

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    const otp = generateOTP();
    const cacheKey = `resetOtp:${normalizedEmail}`;
    await redisClient.set(cacheKey, otp, { EX: 300 });

    const emailSent = await sendResetPasswordEmail(normalizedEmail, otp);
    if (!emailSent) {
      return res.status(500).json({ message: 'Failed to send reset email' });
    }

    res.json({
      message: 'Password reset code sent to email',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const cacheKey = `resetOtp:${normalizedEmail}`;
    const storedOtp = await redisClient.get(cacheKey);

    const isDevOtp = (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') && otp === '123456';

    if (!isDevOtp && (!storedOtp || storedOtp !== otp)) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    await redisClient.del(cacheKey);

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
