export class EmailDeliveryError extends Error {
  constructor(message = 'Failed to deliver email', options?: ErrorOptions) {
    super(message, options);
    this.name = 'EmailDeliveryError';
  }
}

