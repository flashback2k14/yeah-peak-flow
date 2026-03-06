import { parseEnv } from '../src/config/env.js';

const buildEnv = (overrides: Partial<NodeJS.ProcessEnv> = {}): NodeJS.ProcessEnv => ({
  NODE_ENV: 'test',
  PORT: '3001',
  DATABASE_URL: 'file:./prisma/test.db',
  JWT_SECRET: 'test-secret-test-secret-test-secret-1234',
  JWT_EXPIRES_IN: '12h',
  FRONTEND_ORIGIN: 'http://localhost:4200',
  COOKIE_NAME: 'pf_token',
  ...overrides
});

describe('Env validation', () => {
  it('fails fast when JWT_SECRET is missing', () => {
    expect(() => parseEnv(buildEnv({ JWT_SECRET: undefined }))).toThrowError(/JWT_SECRET/);
  });

  it('fails fast when JWT_SECRET uses a placeholder value', () => {
    expect(() => parseEnv(buildEnv({ JWT_SECRET: 'replace-with-at-least-32-characters' }))).toThrowError(
      /Platzhalterwert/
    );
  });

  it('accepts a strong JWT_SECRET', () => {
    expect(
      parseEnv(
        buildEnv({
          JWT_SECRET: 'A39x8M2v4Q7p1J5t9K6n3R8w0Y2z7B1cD4eF6gH8iJ0k'
        })
      ).JWT_SECRET
    ).toBe('A39x8M2v4Q7p1J5t9K6n3R8w0Y2z7B1cD4eF6gH8iJ0k');
  });
});
