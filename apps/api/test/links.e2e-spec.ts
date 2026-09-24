import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Links (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health -> 200 with ok status', async () => {
    await request(app.getHttpServer()).get('/health').expect(200, { status: 'ok' });
  });

  it('POST /links -> 201 with alias and shortUrl', async () => {
    const res = await request(app.getHttpServer())
      .post('/links')
      .send({ url: 'https://example.com/one' })
      .expect(201);

    expect(res.body.alias).toBeDefined();
    expect(res.body.shortUrl).toContain(res.body.alias);
  });

  it('POST /links with duplicate customAlias -> 409', async () => {
    await request(app.getHttpServer())
      .post('/links')
      .send({ url: 'https://example.com/two', customAlias: 'dup-e2e' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/links')
      .send({ url: 'https://example.com/three', customAlias: 'dup-e2e' })
      .expect(409);
  });

  it('POST /links with invalid URL -> 400', async () => {
    await request(app.getHttpServer())
      .post('/links')
      .send({ url: 'not-a-url' })
      .expect(400);
  });

  it('GET /links -> 200 with an array', async () => {
    await request(app.getHttpServer())
      .post('/links')
      .send({ url: 'https://example.com/four' })
      .expect(201);

    const res = await request(app.getHttpServer()).get('/links').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /links/:id -> 200', async () => {
    const created = await request(app.getHttpServer())
      .post('/links')
      .send({ url: 'https://example.com/five' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/links/${created.body.id}`)
      .expect(200);

    expect(res.body.id).toBe(created.body.id);
  });

  it('DELETE /links/:id -> 204', async () => {
    const created = await request(app.getHttpServer())
      .post('/links')
      .send({ url: 'https://example.com/six' })
      .expect(201);

    await request(app.getHttpServer()).delete(`/links/${created.body.id}`).expect(204);
    await request(app.getHttpServer()).get(`/links/${created.body.id}`).expect(404);
  });

  it('GET /:alias -> 302 with correct Location', async () => {
    await request(app.getHttpServer())
      .post('/links')
      .send({ url: 'https://example.com/seven', customAlias: 'go-e2e' })
      .expect(201);

    const res = await request(app.getHttpServer()).get('/go-e2e').expect(302);

    expect(res.headers.location).toBe('https://example.com/seven');
  });

  it('GET /:alias not found -> 404', async () => {
    await request(app.getHttpServer()).get('/does-not-exist').expect(404);
  });

  it('GET /:alias expired -> 410', async () => {
    await request(app.getHttpServer())
      .post('/links')
      .send({
        url: 'https://example.com/eight',
        customAlias: 'expired-e2e',
        expiresAt: new Date(Date.now() + 50).toISOString(),
      })
      .expect(201);

    await new Promise((resolve) => setTimeout(resolve, 100));

    await request(app.getHttpServer()).get('/expired-e2e').expect(410);
  });
});