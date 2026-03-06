import request from 'supertest';
import { prisma } from '../src/lib/prisma.js';
import { createApp } from '../src/app.js';

const app = createApp();

const registerPayload = {
  email: 'patient@example.com',
  password: 'Sicher1234'
};

const register = () => request(app).post('/api/v1/auth/register').send(registerPayload);

const loginAndGetCookie = async (): Promise<string> => {
  const loginResponse = await request(app).post('/api/v1/auth/login').send(registerPayload);
  expect(loginResponse.status).toBe(200);
  return loginResponse.headers['set-cookie'][0] as string;
};

const cleanDb = async () => {
  await prisma.measurement.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();
};

describe('Auth API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it('nimmt Registrierung an und legt bei neuer E-Mail einen Benutzer an', async () => {
    const response = await register();
    const persistedUser = await prisma.user.findUnique({
      where: { email: registerPayload.email },
      select: { email: true }
    });

    expect(response.status).toBe(202);
    expect(response.body).toEqual({
      message:
        'Registrierung entgegengenommen. Falls die E-Mail noch nicht registriert ist, wurde ein Konto angelegt.'
    });
    expect(persistedUser?.email).toBe(registerPayload.email);
  });

  it('liefert fuer neue und bestehende E-Mail dieselbe Register-Antwort', async () => {
    const firstResponse = await register();
    const secondResponse = await register();
    const userCount = await prisma.user.count({ where: { email: registerPayload.email } });

    expect(firstResponse.status).toBe(202);
    expect(secondResponse.status).toBe(202);
    expect(secondResponse.body).toEqual(firstResponse.body);
    expect(userCount).toBe(1);
  });

  it('liefert den aktuellen Benutzer ueber /auth/me', async () => {
    await register();
    const authCookie = await loginAndGetCookie();

    const meResponse = await request(app).get('/api/v1/auth/me').set('Cookie', authCookie);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user.email).toBe(registerPayload.email);
  });

  it('blockiert /auth/me ohne Cookie', async () => {
    const response = await request(app).get('/api/v1/auth/me');

    expect(response.status).toBe(401);
  });

  it('erlaubt Fast-Login mit benutzerspezifischem Token', async () => {
    await register();
    const authCookie = await loginAndGetCookie();

    const settingsResponse = await request(app).patch('/api/v1/settings').set('Cookie', authCookie).send({
      fastLoginEnabled: true,
      regenerateFastLoginToken: true
    });

    expect(settingsResponse.status).toBe(200);
    expect(settingsResponse.body.fastLoginEnabled).toBe(true);
    expect(typeof settingsResponse.body.fastLoginUrl).toBe('string');

    const fastLoginUrl = new URL(settingsResponse.body.fastLoginUrl);
    const token = fastLoginUrl.searchParams.get('token');

    const fastLoginResponse = await request(app).post('/api/v1/auth/fast-login').send({ token });

    expect(fastLoginResponse.status).toBe(200);
    expect(fastLoginResponse.body.user.email).toBe(registerPayload.email);
    expect(fastLoginResponse.headers['set-cookie']).toBeDefined();
  });
});
