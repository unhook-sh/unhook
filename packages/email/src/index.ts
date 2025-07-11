import { render } from '@react-email/render';
import type { ReactElement } from 'react';
import { Resend } from 'resend';

export type EmailConfig = {
  apiKey: string;
  from: string;
  replyTo?: string;
};

export class EmailClient {
  private resend: Resend;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
    this.resend = new Resend(config.apiKey);
  }

  async send({
    to,
    subject,
    template,
    replyTo,
  }: {
    to: string | string[];
    subject: string;
    template: ReactElement;
    replyTo?: string;
  }) {
    const html = await render(template);

    return this.resend.emails.send({
      from: this.config.from,
      html,
      replyTo: replyTo || this.config.replyTo,
      subject,
      to,
    });
  }

  async sendBatch(
    emails: Array<{
      to: string | string[];
      subject: string;
      template: ReactElement;
      replyTo?: string;
    }>,
  ) {
    const batch = await Promise.all(
      emails.map(async (email) => ({
        from: this.config.from,
        html: await render(email.template),
        replyTo: email.replyTo || this.config.replyTo,
        subject: email.subject,
        to: email.to,
      })),
    );

    return this.resend.batch.send(batch);
  }
}

export function createEmailClient(config: EmailConfig) {
  return new EmailClient(config);
}
