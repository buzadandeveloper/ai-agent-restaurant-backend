import { Injectable } from '@nestjs/common';
import sgMail from '@sendgrid/mail';

@Injectable()
export class SendGridMailService {
  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY environment variable is required');
    }
    sgMail.setApiKey(apiKey);
  }

  async sendVerificationEmail(email: string, link: string) {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    if (!fromEmail) {
      throw new Error('SENDGRID_FROM_EMAIL environment variable is required');
    }

    await sgMail.send({
      to: email,
      from: fromEmail,
      subject: 'Confirm your email',
      html: `
        <p>Welcome!</p>
        <p>Please confirm your email by clicking the link below:</p>
        <a href="${link}">Confirm Email</a>
        <p>This link expires in 24 hours.</p>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, code: string) {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    if (!fromEmail) {
      throw new Error('SENDGRID_FROM_EMAIL environment variable is required');
    }

    await sgMail.send({
      to: email,
      from: fromEmail,
      subject: 'Reset your password',
      html: `
        <p>Hello,</p>
        <p>You requested to reset your password. Please use the following code to proceed:</p>
        <h2 style="letter-spacing: 5px; font-family: monospace;">${code}</h2>
        <p>This code expires in 15 minutes.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      `,
    });
  }
}
