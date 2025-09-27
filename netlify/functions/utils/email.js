import FormData from 'form-data';
import Mailgun from 'mailgun.js';

// Initialize Mailgun client
const mailgun = new Mailgun(FormData);

// Email sending function for password reset
export const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    // Check if Mailgun is configured
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    const fromEmail = process.env.MAILGUN_FROM_EMAIL || process.env.FROM_EMAIL || 'noreply@gardenforall.org';
    const fromName = process.env.MAILGUN_FROM_NAME || process.env.FROM_NAME || 'Garden For All';
    
    if (!apiKey || !domain) {
      console.warn('Mailgun not configured. Please set MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables.');
      console.log(`Password reset email for ${email}:`);
      console.log(`Reset URL: ${resetUrl}`);
      return true; // Return success for development
    }

    // Create Mailgun client
    const mg = mailgun.client({
      username: 'api',
      key: apiKey,
      url: process.env.MAILGUN_API_URL || 'https://api.mailgun.net' // US region by default
    });

    // Prepare email message
    const messageData = {
      from: `${fromName} <${fromEmail}>`,
      to: [email],
      subject: 'Reset Your Password - Garden For All',
      text: `
Reset Your Password

You requested to reset your password for your Garden For All account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 10 minutes.

If you didn't request this password reset, please ignore this email.

Best regards,
The Garden For All Team
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #16a34a; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reset Your Password</h1>
    </div>
    <div class="content">
      <p>Hi there,</p>
      <p>You requested to reset your password for your Garden For All account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      <p style="font-size: 14px; color: #6b7280;">Or copy and paste this link into your browser:</p>
      <p style="font-size: 14px; word-break: break-all; color: #6b7280;">${resetUrl}</p>
      <div class="footer">
        <p><strong>This link will expire in 10 minutes.</strong></p>
        <p>If you didn't request this password reset, please ignore this email. Your password won't be changed.</p>
        <p>Best regards,<br>The Garden For All Team</p>
      </div>
    </div>
  </div>
</body>
</html>
      `
    };

    // Send email via Mailgun
    const result = await mg.messages.create(domain, messageData);
    console.log('Password reset email sent successfully:', result.id);
    return true;

  } catch (error) {
    console.error('Failed to send password reset email:', error);
    // In production, you might want to throw this error
    // For now, we'll return false to indicate failure but not break the flow
    return false;
  }
};

// Email sending function for welcome emails (can be added later)
export const sendWelcomeEmail = async (email, userName) => {
  try {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    const fromEmail = process.env.MAILGUN_FROM_EMAIL || process.env.FROM_EMAIL || 'noreply@gardenforall.org';
    const fromName = process.env.MAILGUN_FROM_NAME || process.env.FROM_NAME || 'Garden For All';
    
    if (!apiKey || !domain) {
      console.log(`Welcome email for ${email} (${userName})`);
      return true;
    }

    const mg = mailgun.client({
      username: 'api',
      key: apiKey,
      url: process.env.MAILGUN_API_URL || 'https://api.mailgun.net'
    });

    const messageData = {
      from: `${fromName} <${fromEmail}>`,
      to: [email],
      subject: 'Welcome to Garden For All!',
      text: `
Welcome to Garden For All!

Hi ${userName},

Thank you for joining Garden For All. We're excited to have you as part of our community dedicated to sustainable food production and distribution.

You can now:
- Track harvests and contributions
- Manage food pantry distributions
- Monitor production trends
- Export detailed reports

If you have any questions, please don't hesitate to reach out.

Best regards,
The Garden For All Team
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #16a34a; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
    .feature { margin: 15px 0; padding-left: 20px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Garden For All!</h1>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      <p>Thank you for joining Garden For All. We're excited to have you as part of our community dedicated to sustainable food production and distribution.</p>
      <p><strong>You can now:</strong></p>
      <div class="feature">✓ Track harvests and contributions</div>
      <div class="feature">✓ Manage food pantry distributions</div>
      <div class="feature">✓ Monitor production trends</div>
      <div class="feature">✓ Export detailed reports</div>
      <div class="footer">
        <p>If you have any questions, please don't hesitate to reach out.</p>
        <p>Best regards,<br>The Garden For All Team</p>
      </div>
    </div>
  </div>
</body>
</html>
      `
    };

    const result = await mg.messages.create(domain, messageData);
    console.log('Welcome email sent successfully:', result.id);
    return true;

  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
};