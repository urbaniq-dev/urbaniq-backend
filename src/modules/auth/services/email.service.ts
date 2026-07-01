import nodemailer from 'nodemailer';

export const sendOTPEmail = async (email: string, otp: string): Promise<boolean> => {
  // Log the OTP code first so testing works even without SMTP credentials
  console.log(`\n\n==============================================`);
  console.log(`🔒 URBANIQ VERIFICATION OTP FOR ${email} IS: ${otp}`);
  console.log(`==============================================\n\n`);

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'skillforgeoffical@gmail.com',
        pass: process.env.EMAIL_PASS || '',
      },
    });

    if (!process.env.EMAIL_PASS) {
      console.warn("⚠️ EMAIL_PASS not set in .env. OTP was only logged to console.");
      return true; // Return true as fallback is active
    }

    const mailOptions = {
      from: `"Urbaniq Security" <${process.env.EMAIL_USER || 'skillforgeoffical@gmail.com'}>`,
      to: email,
      subject: 'Your Urbaniq Verification Code',
      text: `Your Urbaniq verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nDo not share this code with anyone.`,
      html: `
        <div style="background-color: #FAF7F5; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%;">
          <div style="max-width: 500px; margin: 0 auto; border-radius: 20px; box-shadow: 0 4px 12px rgba(61,26,14,0.08); overflow: hidden; border: 1px solid #E8D5C4; background: #ffffff;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1A365D 0%, #2A4365 100%); padding: 32px; text-align: center; border-bottom: 3px solid #3182CE;">
              <span style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 1px; font-family: sans-serif;">Urban<span style="color: #3182CE;">iq</span></span>
              <p style="color: rgba(255,255,255,0.6); margin: 6px 0 0 0; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Account Protection Center</p>
            </div>
            
            <!-- Body -->
            <div style="padding: 40px 32px; text-align: center;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: #EBF8FF; line-height: 48px; margin: 0 auto 20px auto; text-align: center;">
                <span style="font-size: 20px; color: #3182CE; vertical-align: middle;">🔒</span>
              </div>
              <h2 style="color: #2D3748; margin: 0 0 12px 0; font-size: 20px; font-weight: 800;">Email Verification Required</h2>
              <p style="color: #4A5568; font-size: 14px; line-height: 1.5; margin: 0 0 32px 0;">Use the following security code to complete your verification process. This code is valid for <strong>5 minutes</strong>.</p>
              
              <!-- OTP Code Display -->
              <div style="background: #F7FAFC; border: 1.5px dashed #CBD5E0; padding: 20px; border-radius: 16px; margin: 0 auto 32px auto; display: inline-block; min-width: 240px; text-align: center;">
                <span style="font-size: 36px; font-weight: 900; letter-spacing: 6px; color: #2D3748; font-family: 'Courier New', Courier, monospace;">${otp}</span>
              </div>

              <!-- Expiry Alert -->
              <div style="background: #EBF8FF; border: 1px solid #BEE3F8; border-radius: 12px; padding: 12px 16px; text-align: left; margin-bottom: 8px;">
                <p style="color: #2B6CB0; font-size: 12px; font-weight: bold; margin: 0 0 4px 0;">⏳ Expires in 5 minutes</p>
                <p style="color: #4A5568; font-size: 11px; margin: 0; line-height: 1.4;">If you did not request this verification code, please ignore this email.</p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #FAF7F5; padding: 24px; text-align: center; border-top: 1px solid #E8D5C4;">
              <p style="color: #4A5568; opacity: 0.6; font-size: 11px; margin: 0; font-weight: 600;">Urbaniq • Security Operations Center</p>
              <p style="color: #4A5568; opacity: 0.4; font-size: 10px; margin: 4px 0 0 0;">This is an automated transmission. Please do not reply to this address.</p>
            </div>
            
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error("Failed to send OTP email:", error);
    return false;
  }
};

export const sendResetPasswordEmail = async (email: string, otp: string): Promise<boolean> => {
  // Log the OTP code first so testing works even without SMTP credentials
  console.log(`\n\n==============================================`);
  console.log(`🔑 PASSWORD RESET OTP FOR ${email} IS: ${otp}`);
  console.log(`==============================================\n\n`);

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'skillforgeoffical@gmail.com',
        pass: process.env.EMAIL_PASS || '',
      },
    });

    if (!process.env.EMAIL_PASS) {
      console.warn("⚠️ EMAIL_PASS not set in .env. Password reset OTP was only logged to console.");
      return true; // Return true as fallback is active
    }

    const mailOptions = {
      from: `"Urbaniq Security" <${process.env.EMAIL_USER || 'skillforgeoffical@gmail.com'}>`,
      to: email,
      subject: 'Reset your Urbaniq Password',
      text: `Your Urbaniq password reset verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nDo not share this code with anyone.`,
      html: `
        <div style="background-color: #FAF7F5; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%;">
          <div style="max-width: 500px; margin: 0 auto; border-radius: 20px; box-shadow: 0 4px 12px rgba(61,26,14,0.08); overflow: hidden; border: 1px solid #E8D5C4; background: #ffffff;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1A365D 0%, #2A4365 100%); padding: 32px; text-align: center; border-bottom: 3px solid #3182CE;">
              <span style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 1px; font-family: sans-serif;">Urban<span style="color: #3182CE;">iq</span></span>
              <p style="color: rgba(255,255,255,0.6); margin: 6px 0 0 0; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Account Protection Center</p>
            </div>
            
            <!-- Body -->
            <div style="padding: 40px 32px; text-align: center;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: #EBF8FF; line-height: 48px; margin: 0 auto 20px auto; text-align: center;">
                <span style="font-size: 20px; color: #3182CE; vertical-align: middle;">🔑</span>
              </div>
              <h2 style="color: #2D3748; margin: 0 0 12px 0; font-size: 20px; font-weight: 800;">Password Reset Code</h2>
              <p style="color: #4A5568; font-size: 14px; line-height: 1.5; margin: 0 0 32px 0;">Use the following security code to verify your identity and reset your password. This code is valid for <strong>5 minutes</strong>.</p>
              
              <!-- OTP Code Display -->
              <div style="background: #F7FAFC; border: 1.5px dashed #CBD5E0; padding: 20px; border-radius: 16px; margin: 0 auto 32px auto; display: inline-block; min-width: 240px; text-align: center;">
                <span style="font-size: 36px; font-weight: 900; letter-spacing: 6px; color: #2D3748; font-family: 'Courier New', Courier, monospace;">${otp}</span>
              </div>

              <!-- Expiry Alert -->
              <div style="background: #EBF8FF; border: 1px solid #BEE3F8; border-radius: 12px; padding: 12px 16px; text-align: left; margin-bottom: 8px;">
                <p style="color: #2B6CB0; font-size: 12px; font-weight: bold; margin: 0 0 4px 0;">⏳ Expires in 5 minutes</p>
                <p style="color: #4A5568; font-size: 11px; margin: 0; line-height: 1.4;">If you did not request a password reset, please ignore this email.</p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #FAF7F5; padding: 24px; text-align: center; border-top: 1px solid #E8D5C4;">
              <p style="color: #4A5568; opacity: 0.6; font-size: 11px; margin: 0; font-weight: 600;">Urbaniq • Security Operations Center</p>
              <p style="color: #4A5568; opacity: 0.4; font-size: 10px; margin: 4px 0 0 0;">This is an automated transmission. Please do not reply to this address.</p>
            </div>
            
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
};

