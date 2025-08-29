// Email service placeholder
// In production, this would integrate with services like SendGrid, Mailgun, etc.

const sendPasswordResetEmail = async (email, resetUrl) => {
  // For development, just log the reset URL
  console.log(`Password reset email for ${email}:`);
  console.log(`Reset URL: ${resetUrl}`);
  
  // TODO: In production, implement actual email sending
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // 
  // const msg = {
  //   to: email,
  //   from: process.env.FROM_EMAIL,
  //   subject: 'Reset your password',
  //   html: `
  //     <h2>Reset Your Password</h2>
  //     <p>Click the link below to reset your password:</p>
  //     <a href="${resetUrl}">${resetUrl}</a>
  //     <p>This link will expire in 10 minutes.</p>
  //   `
  // };
  // 
  // await sgMail.send(msg);
  
  return true;
};

module.exports = {
  sendPasswordResetEmail
};