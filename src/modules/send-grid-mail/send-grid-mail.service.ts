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
}
