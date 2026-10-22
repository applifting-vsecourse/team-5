import { EmailDeliveryError } from '@/core/email/errors/email-delivery.error';
import * as nodemailer from 'nodemailer';
import { SMTPAdapter } from './smtp-adapter';

const mockSendMail = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockImplementation(() => ({
    sendMail: mockSendMail,
  })),
}));

describe('SMTPAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize transporter without auth when user/pass are omitted', () => {
    new SMTPAdapter({
      host: 'localhost',
      port: 1025,
      secure: false,
      from: 'TrainLoop <onboarding@resend.dev>',
    });

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'localhost',
      port: 1025,
      secure: false,
      auth: undefined,
    });
  });

  it('should initialize transporter with auth when user/pass are provided', () => {
    new SMTPAdapter({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      from: 'TrainLoop <onboarding@resend.dev>',
      user: 'user123',
      pass: 'secret',
    });

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      auth: {
        user: 'user123',
        pass: 'secret',
      },
    });
  });

  it('should send email successfully', async () => {
    const adapter = new SMTPAdapter({
      host: 'localhost',
      port: 1025,
      secure: false,
      from: 'TrainLoop <onboarding@resend.dev>',
    });
    mockSendMail.mockResolvedValueOnce({ messageId: '123' });

    await expect(
      adapter.sendEmail('test@example.com', 'Test předmět', '<p>Obsah</p>'),
    ).resolves.toBeUndefined();

    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'TrainLoop <onboarding@resend.dev>',
      to: 'test@example.com',
      subject: 'Test předmět',
      html: '<p>Obsah</p>',
    });
  });

  it('should throw EmailDeliveryError when sendMail fails and retain cause', async () => {
    const adapter = new SMTPAdapter({
      host: 'localhost',
      port: 1025,
      secure: false,
      from: 'TrainLoop <onboarding@resend.dev>',
    });
    const connectionError = new Error('Connection refused');
    mockSendMail.mockRejectedValueOnce(connectionError);

    let thrownError: unknown;
    try {
      await adapter.sendEmail(
        'test@example.com',
        'Test předmět',
        '<p>Obsah</p>',
      );
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeInstanceOf(EmailDeliveryError);
    expect((thrownError as EmailDeliveryError).cause).toBe(connectionError);
  });
});
