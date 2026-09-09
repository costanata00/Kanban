import { describe, expect, it, test } from 'vitest';
import request from 'supertest';
import { createServer } from '../../../src/server.js';
import { buildTestRepositories } from '../../helpers/fixtures.js';
import { Board } from '../../../src/boards/Board.js';
import { InMemoryBoardRepository } from '../../../src/boards/BoardRepository.js';
import { Column } from '../../../src/boards/Column.js';
import { Card } from '../../../src/cards/Card.js';
import { InMemoryCardRepository } from '../../../src/cards/CardRepository.js';

describe('Rotas de cartões — estica ainda não implementada', () => {
  it('GET /cards/:id responde 501 (Atividade 8, estica)', async () => {
    const app = createServer(buildTestRepositories());
    const response = await request(app).get('/cards/qualquer-id');
    expect(response.status).toBe(501);
  });

  it('GET /cards/search responde 501 (Atividade 9, estica)', async () => {
    const app = createServer(buildTestRepositories());
    const response = await request(app).get('/cards/search').query({ query: 'termo' });
    expect(response.status).toBe(501);
  });
});

describe('POST /cards', () => {
  it('cria um cartão válido e renderiza o quadro atualizado', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).post('/cards').send({ title: 'Novo cartão', columnId: 'col-1' });

    expect(response.status).toBe(201);
    expect(response.text).toContain('Novo cartão');
  });

  it('rejeita título com menos de 3 caracteres com 400', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).post('/cards').send({ title: 'ab', columnId: 'col-1' });

    expect(response.status).toBe(400);
  });

  it('rejeita columnId de uma coluna que não existe com 404', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).post('/cards').send({ title: 'Card válido', columnId: 'col-inexistente' });

    expect(response.status).toBe(404);
  });

  it('impede título duplicado na mesma coluna com 409 (Atividade 6)', async () => {
    const app = createServer(buildTestRepositories());
    await request(app).post('/cards').send({ title: 'Duplicado', columnId: 'col-1' });

    const response = await request(app).post('/cards').send({ title: 'Duplicado', columnId: 'col-1' });

    expect(response.status).toBe(409);
  });

  it('responde 409 quando a coluna já atingiu o limite de WIP (Atividade 5)', async () => {
    const board = Board.create('board-1', 'Quadro WIP', [
      Column.create('col-1', 'A Fazer', 1),
      Column.create('col-2', 'Em Andamento', 2, 1),
    ]);
    const repositories = {
      boardRepository: new InMemoryBoardRepository(board),
      cardRepository: new InMemoryCardRepository(),
    };
    repositories.cardRepository.save(Card.create('Já em andamento', 'col-2'));
    const app = createServer(repositories);

    const response = await request(app).post('/cards').send({ title: 'Novo cartão', columnId: 'col-2' });

    expect(response.status).toBe(409);
  });
});

describe('POST /cards/:id/move', () => {
  it('move o cartão para a coluna informada', async () => {
    const repositories = buildTestRepositories();
    const app = createServer(repositories);
    const card = Card.create('Para mover', 'col-1');
    repositories.cardRepository.save(card);

    const response = await request(app).post(`/cards/${card.id}/move`).send({ columnId: 'col-2' });

    expect(response.status).toBe(200);
    expect(repositories.cardRepository.findById(card.id)?.columnId).toBe('col-2');
  });

  it('responde 404 se o cartão não existe', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).post('/cards/id-inexistente/move').send({ columnId: 'col-2' });

    expect(response.status).toBe(404);
  });

  it('responde 404 se a coluna destino não existe', async () => {
    const repositories = buildTestRepositories();
    const app = createServer(repositories);
    const card = Card.create('Para mover', 'col-1');
    repositories.cardRepository.save(card);

    const response = await request(app).post(`/cards/${card.id}/move`).send({ columnId: 'col-inexistente' });

    expect(response.status).toBe(404);
  });

  it('responde 409 se a coluna destino já atingiu o limite de WIP (Atividade 5)', async () => {
    const board = Board.create('board-1', 'Quadro WIP', [
      Column.create('col-1', 'A Fazer', 1),
      Column.create('col-2', 'Em Andamento', 2, 1),
    ]);
    const repositories = {
      boardRepository: new InMemoryBoardRepository(board),
      cardRepository: new InMemoryCardRepository(),
    };
    const cardToMove = Card.create('Para mover', 'col-1');
    repositories.cardRepository.save(cardToMove);
    repositories.cardRepository.save(Card.create('Já em andamento', 'col-2'));
    const app = createServer(repositories);

    const response = await request(app).post(`/cards/${cardToMove.id}/move`).send({ columnId: 'col-2' });

    expect(response.status).toBe(409);
  });
});

describe('POST /cards/:id/update', () => {
  it('edita título, descrição e prioridade', async () => {
    const repositories = buildTestRepositories();
    const app = createServer(repositories);
    const card = Card.create('Título original', 'col-1');
    repositories.cardRepository.save(card);

    const response = await request(app)
      .post(`/cards/${card.id}/update`)
      .send({ title: 'Título editado', description: 'nova descrição', priority: 'alta' });

    expect(response.status).toBe(200);
    const updated = repositories.cardRepository.findById(card.id);
    expect(updated?.title).toBe('Título editado');
    expect(updated?.description).toBe('nova descrição');
    expect(updated?.priority).toBe('alta');
  });

  it('mantém a prioridade quando ela não é informada', async () => {
    const repositories = buildTestRepositories();
    const app = createServer(repositories);
    const card = Card.create('Título original', 'col-1', 'alta');
    repositories.cardRepository.save(card);

    const response = await request(app)
      .post(`/cards/${card.id}/update`)
      .send({ title: 'Só o título mudou' });

    expect(response.status).toBe(200);
    const updated = repositories.cardRepository.findById(card.id);
    expect(updated?.title).toBe('Só o título mudou');
    expect(updated?.priority).toBe('alta');
  });

  it('responde 404 se o cartão não existe', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).post('/cards/id-inexistente/update').send({ title: 'Editado' });

    expect(response.status).toBe(404);
  });

  it('mantém o título quando apenas a descrição é informada', async () => {
    const repositories = buildTestRepositories();
    const app = createServer(repositories);
    const card = Card.create('Título original', 'col-1');
    repositories.cardRepository.save(card);

    const response = await request(app)
      .post(`/cards/${card.id}/update`)
      .send({ description: 'só a descrição mudou' });

    expect(response.status).toBe(200);
    const updated = repositories.cardRepository.findById(card.id);
    expect(updated?.title).toBe('Título original');
    expect(updated?.description).toBe('só a descrição mudou');
  });

});

describe('POST /cards/:id/delete', () => {
  it('remove o cartão', async () => {
    const repositories = buildTestRepositories();
    const app = createServer(repositories);
    const card = Card.create('Para excluir', 'col-1');
    repositories.cardRepository.save(card);

    const response = await request(app).post(`/cards/${card.id}/delete`);

    expect(response.status).toBe(200);
    expect(repositories.cardRepository.findById(card.id)).toBeUndefined();
  });

  it('responde 404 se o cartão não existe', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).post('/cards/id-inexistente/delete');

    expect(response.status).toBe(404);
  });
});