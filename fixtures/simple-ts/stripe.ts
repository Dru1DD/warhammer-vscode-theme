import { loadConfig } from './config';
import type { Config } from './config';

export class StripeClient {
  private config: Config;
  constructor() { this.config = loadConfig(); }
  charge(amount: number): boolean { return amount > 0; }
  refund(id: string): boolean { return id.length > 0; }
}
