import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { DateTime } from 'luxon';
import { prisma } from '../src/lib/prisma.js';
import { createApp } from '../src/app.js';

const app = createApp();

const cleanDb = async () => {
  await prisma.measurement.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();
};

const registerAndGetCookie = async (): Promise<string> => {
  const response = await request(app).post('/api/v1/auth/register').send({
    email: `testuser-${randomUUID()}@example.com`,
    password: 'Sicher1234'
  });

  return response.headers['set-cookie'][0];
};

describe('Measurements & Dashboard API', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  it('erstellt und listet Messungen pro Monat', async () => {
    const cookie = await registerAndGetCookie();
    const measuredAt = DateTime.fromObject({ year: 2026, month: 3, day: 1, hour: 8, minute: 15 }).toISO();

    const createResponse = await request(app)
      .post('/api/v1/measurements')
      .set('Cookie', cookie)
      .send({
        measuredAt,
        peakFlowLpm: 410,
        inhalationTiming: 'before_inhalation',
        note: 'morgens'
      });

    expect(createResponse.status).toBe(201);

    const listResponse = await request(app)
      .get('/api/v1/measurements?month=2026-03')
      .set('Cookie', cookie);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.items[0].peakFlowLpm).toBe(410);
    expect(listResponse.body.items[0].inhalationTiming).toBe('before_inhalation');
  });

  it('liefert Monatsstatistiken im Dashboard', async () => {
    const cookie = await registerAndGetCookie();

    await request(app).patch('/api/v1/settings').set('Cookie', cookie).send({
      personalBestLpm: 500
    });

    const firstTime = DateTime.fromObject({ year: 2026, month: 3, day: 2, hour: 8, minute: 0 }).toISO();
    const secondTime = DateTime.fromObject({ year: 2026, month: 3, day: 2, hour: 19, minute: 0 }).toISO();

    await request(app).post('/api/v1/measurements').set('Cookie', cookie).send({
      measuredAt: firstTime,
      peakFlowLpm: 400,
      inhalationTiming: 'before_inhalation'
    });

    await request(app).post('/api/v1/measurements').set('Cookie', cookie).send({
      measuredAt: secondTime,
      peakFlowLpm: 500,
      inhalationTiming: 'after_inhalation'
    });

    const response = await request(app)
      .get('/api/v1/dashboard/monthly?month=2026-03')
      .set('Cookie', cookie);

    expect(response.status).toBe(200);
    expect(response.body.stats.count).toBe(2);
    expect(response.body.stats.min).toBe(400);
    expect(response.body.stats.max).toBe(500);
    expect(response.body.stats.avgBeforeInhalation).toBe(400);
    expect(response.body.stats.avgAfterInhalation).toBe(500);
    expect(response.body.stats.zone.personalBestLpm).toBe(500);
    expect(response.body.stats.zone.thresholds.greenMin).toBe(400);
    expect(response.body.stats.zone.thresholds.yellowMin).toBe(300);
    expect(response.body.stats.zone.counts.green).toBe(2);
    expect(response.body.stats.zone.counts.yellow).toBe(0);
    expect(response.body.stats.zone.counts.red).toBe(0);
    expect(response.body.stats.zone.counts.unclassified).toBe(0);
    expect(response.body.series).toHaveLength(1);
    expect(response.body.series[0].beforeInhalation).toBe(400);
    expect(response.body.series[0].afterInhalation).toBe(500);
    expect(response.body.series[0].avg).toBe(450);
    expect(response.body.series[0].beforeZone).toBe('green');
    expect(response.body.series[0].afterZone).toBe('green');
    expect(response.body.series[0].avgZone).toBe('green');
  });

  it('liefert konsistent 404 fuer PATCH und DELETE auf nicht vorhandene Messungen', async () => {
    const cookie = await registerAndGetCookie();
    const missingId = randomUUID();

    const patchResponse = await request(app)
      .patch(`/api/v1/measurements/${missingId}`)
      .set('Cookie', cookie)
      .send({ note: 'aktualisiert' });

    const deleteResponse = await request(app)
      .delete(`/api/v1/measurements/${missingId}`)
      .set('Cookie', cookie);

    expect(patchResponse.status).toBe(404);
    expect(deleteResponse.status).toBe(404);
  });

  it('erzwingt den userId-Scope bei PATCH und DELETE', async () => {
    const ownerCookie = await registerAndGetCookie();
    const otherCookie = await registerAndGetCookie();
    const measuredAt = DateTime.fromObject({ year: 2026, month: 3, day: 3, hour: 10, minute: 0 }).toISO();

    const createResponse = await request(app).post('/api/v1/measurements').set('Cookie', ownerCookie).send({
      measuredAt,
      peakFlowLpm: 420,
      inhalationTiming: 'before_inhalation',
      note: 'owner'
    });

    expect(createResponse.status).toBe(201);
    const measurementId = createResponse.body.id as string;

    const foreignPatchResponse = await request(app)
      .patch(`/api/v1/measurements/${measurementId}`)
      .set('Cookie', otherCookie)
      .send({ note: 'fremd' });

    const foreignDeleteResponse = await request(app)
      .delete(`/api/v1/measurements/${measurementId}`)
      .set('Cookie', otherCookie);

    expect(foreignPatchResponse.status).toBe(404);
    expect(foreignDeleteResponse.status).toBe(404);

    const persisted = await prisma.measurement.findUnique({
      where: { id: measurementId },
      select: { note: true }
    });

    expect(persisted).not.toBeNull();
    expect(persisted?.note).toBe('owner');
  });

  it('liefert bei konkurrierendem PATCH und DELETE keine 500-Fehler', async () => {
    const cookie = await registerAndGetCookie();
    const measuredAt = DateTime.fromObject({ year: 2026, month: 3, day: 4, hour: 7, minute: 30 }).toISO();

    const createResponse = await request(app).post('/api/v1/measurements').set('Cookie', cookie).send({
      measuredAt,
      peakFlowLpm: 430,
      inhalationTiming: 'before_inhalation'
    });

    expect(createResponse.status).toBe(201);
    const measurementId = createResponse.body.id as string;

    const [patchResponse, deleteResponse] = await Promise.all([
      request(app)
        .patch(`/api/v1/measurements/${measurementId}`)
        .set('Cookie', cookie)
        .send({ note: 'race-update' }),
      request(app).delete(`/api/v1/measurements/${measurementId}`).set('Cookie', cookie)
    ]);

    expect([200, 404]).toContain(patchResponse.status);
    expect(deleteResponse.status).toBe(204);
    expect(patchResponse.status).toBeLessThan(500);
    expect(deleteResponse.status).toBeLessThan(500);
  });
});
