export const API_URL = 'https://example.invalid';
export interface Config { url: string; retries: number; }
export function loadConfig(): Config {
  return { url: API_URL, retries: 3 };
}
