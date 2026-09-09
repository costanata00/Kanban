import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createServer } from '../../../src/server.js';
import { buildTestRepositories } from '../../helpers/fixtures.js';

describe('GET /', () => {
  it('renderiza o quadro com suas colunas', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.type).toBe('text/html');
    expect(response.text).toContain('Quadro de Teste');
    expect(response.text).toContain('Coluna 1');
    expect(response.text).toContain('Coluna 2');
  });
});

describe('POST /columns', () => {
  it('cria uma nova coluna', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).post('/columns').send({ name: 'Nova Coluna' });

    expect(response.status).toBe(201);
    expect(response.text).toContain('Nova Coluna');
  });

  it('responde 400', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).post('/columns').send({ name: 'a' });

    expect(response.status).toBe(400);
  });
});