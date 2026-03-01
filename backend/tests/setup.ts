process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'file:./prisma/test.db';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-test-secret-test-secret-1234';
process.env.JWT_EXPIRES_IN = '12h';
process.env.FRONTEND_ORIGIN = 'http://localhost:4200';
process.env.COOKIE_NAME = 'pf_token';
