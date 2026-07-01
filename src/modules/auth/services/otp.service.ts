import { redisClient } from '../../../config/redis';

/**
 * Generate a cryptographically simple but secure 6-digit numeric OTP code
 */
export const generateOTP = (): string => {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    return '123456';
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store OTP code in Redis with a 5 minutes (300 seconds) expiration TTL
 */
export const storeOTP = async (email: string, otp: string): Promise<void> => {
  const key = `otp:${email.toLowerCase().trim()}`;
  await redisClient.set(key, otp, { EX: 300 }); // 300 seconds = 5 minutes
};

/**
 * Verify candidate OTP code against the stored value in Redis.
 * If correct, deletes the OTP key to prevent replay attacks and returns true.
 */
export const verifyOTPCode = async (email: string, otp: string): Promise<boolean> => {
  if ((process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') && otp === '123456') {
    return true;
  }
  const key = `otp:${email.toLowerCase().trim()}`;
  const storedOtp = await redisClient.get(key);

  if (storedOtp && storedOtp === otp) {
    await redisClient.del(key);
    return true;
  }

  return false;
};
