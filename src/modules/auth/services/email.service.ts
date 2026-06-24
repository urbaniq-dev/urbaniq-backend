import nodemailer from 'nodemailer';

export const sendOTPEmail = async (email: string, otp: string): Promise<boolean> => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.FROM_EMAIL || 'noreply@urbaniq.com';

  console.log(`[OTP Verification] Generated code for ${email}: ${otp}`);

  // Fallback if SMTP config is missing
  if (!host || !user || !pass) {
    console.log('--- SMTP configuration variables (SMTP_HOST, SMTP_USER, SMTP_PASSWORD) are missing in .env. OTP falls back to console logging. ---');
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from: `"Urbaniq Support" <${from}>`,
      to: email,
      subject: 'Your Urbaniq Verification Code',
      text: `Hello,\n\nYour OTP code for verification is: ${otp}\n\nThis code will expire in 5 minutes.\n\nThank you,\nUrbaniq Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333333; text-align: center;">Urbaniq Verification Code</h2>
          <p style="font-size: 16px; color: #555555;">Hello,</p>
          <p style="font-size: 16px; color: #555555;">Thank you for choosing Urbaniq. Use the following security code to complete your verification process. This code is valid for <strong>5 minutes</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2d89ef; background-color: #f0f7ff; padding: 10px 20px; border-radius: 4px; border: 1px dashed #2d89ef;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #999999; text-align: center;">If you did not request this code, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
          <p style="font-size: 12px; color: #aaaaaa; text-align: center;">&copy; 2026 Urbaniq. All rights reserved.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`Failed to send email to ${email}: ${error.message}`);
    return false;
  }
};
