import { StripeClient } from './stripe';
import { loadConfig } from './config';
import * as unused from 'node:util';

export class CheckoutService extends StripeClient {
  createSession(amount: number) {
    loadConfig();
    return this.charge(amount);
  }
  validatePayment() { return true; }
}

export default function checkout(): CheckoutService {
  return new CheckoutService();
}
