import request from 'supertest';
import { prisma } from '../src/lib/prisma.js';
import { createApp } from '../src/app.js';

const app = createApp();

const registerPayload = {
  email: 'patient@example.com',
  password: 'Sicher1234'
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

  it('registriert einen Benutzer und setzt ein Auth-Cookie', async () => {
    const response = await request(app).post('/api/v1/auth/register').send(registerPayload);

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(registerPayload.email);
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('liefert den aktuellen Benutzer ueber /auth/me', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send(registerPayload);
    const authCookie = registerResponse.headers['set-cookie'][0];

    const meResponse = await request(app).get('/api/v1/auth/me').set('Cookie', authCookie);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user.email).toBe(registerPayload.email);
  });

  it('blockiert /auth/me ohne Cookie', async () => {
    const response = await request(app).get('/api/v1/auth/me');

    expect(response.status).toBe(401);
  });

  it('erlaubt Fast-Login mit benutzerspezifischem Token', async () => {
    const registerResponse = await request(app).post('/api/v1/auth/register').send(registerPayload);
    const authCookie = registerResponse.headers['set-cookie'][0];

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
