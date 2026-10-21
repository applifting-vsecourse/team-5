import { ResendAdapter } from './resend-adapter';

const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

describe('ResendAdapter', () => {
  let adapter: ResendAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new ResendAdapter({
      apiKey: 'test-api-key',
      from: 'TrainLoop <onboarding@resend.dev>',
    });
  });

  it('should send email successfully', async () => {
    mockSend.mockResolvedValueOnce({ data: { id: 'msg_123' }, error: null });

    await expect(
      adapter.sendEmail('client@example.com', 'Předmět', '<p>Ahoj</p>'),
    ).resolves.toBeUndefined();

    expect(mockSend).toHaveBeenCalledWith({
      from: 'TrainLoop <onboarding@resend.dev>',
      to: 'client@example.com',
      subject: 'Předmět',
      html: '<p>Ahoj</p>',
    });
  });

  it('should throw "Zkuste to znovu" when resend returns an error', async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { message: 'Domain not verified' },
    });

    await expect(
      adapter.sendEmail('client@example.com', 'Předmět', '<p>Ahoj</p>'),
    ).rejects.toThrow('Zkuste to znovu');
  });

  it('should throw "Zkuste to znovu" on network failure', async () => {
    mockSend.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      adapter.sendEmail('client@example.com', 'Předmět', '<p>Ahoj</p>'),
    ).rejects.toThrow('Zkuste to znovu');
  });
});
