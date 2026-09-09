import { describe, expect, it } from 'vitest';
import { Card } from '../../../src/cards/Card.js';
import { InvalidCardColumnError, InvalidCardTitleError, InvalidPriorityError } from '../../../src/cards/errors.js';
import { NotImplementedError } from '../../../src/shared/errors.js';

describe('Card.create', () => {
  it('cria um cartão com prioridade baixa e descrição vazia por padrão', () => {
    const card = Card.create('Configurar ambiente', 'col-todo');

    expect(card.title).toBe('Configurar ambiente');
    expect(card.columnId).toBe('col-todo');
    expect(card.priority).toBe('baixa');
    expect(card.description).toBe('');
    expect(card.id).toBeTypeOf('string');
  });

  it('aceita prioridade e descrição customizadas, normalizando o título', () => {
    const card = Card.create('  Mover cartão  ', 'col-doing', 'alta', '  detalhes  ');

    expect(card.title).toBe('Mover cartão');
    expect(card.priority).toBe('alta');
    expect(card.description).toBe('detalhes');
  });

  it('rejeita título com menos de 3 caracteres', () => {
    expect(() => Card.create('ab', 'col-todo')).toThrow(InvalidCardTitleError);
  });

  it('rejeita título com mais de 120 caracteres', () => {
    expect(() => Card.create('a'.repeat(121), 'col-todo')).toThrow(InvalidCardTitleError);
  });

  it('rejeita título que não é string', () => {
    // @ts-expect-error propositalmente passando um tipo inválido
    expect(() => Card.create(123, 'col-todo')).toThrow(InvalidCardTitleError);
  });

  it('rejeita columnId vazio', () => {
    expect(() => Card.create('Título válido', '   ')).toThrow(InvalidCardColumnError);
  });

  it('rejeita columnId que não é string', () => {
    // @ts-expect-error propositalmente passando um tipo inválido
    expect(() => Card.create('Título válido', 42)).toThrow(InvalidCardColumnError);
  });

  it('rejeita prioridade inválida', () => {
    // @ts-expect-error propositalmente passando um valor fora do union
    expect(() => Card.create('Título válido', 'col-todo', 'urgente')).toThrow(InvalidPriorityError);
  });
});

describe('Card.restore', () => {
  it('reconstrói um cartão a partir de um snapshot já persistido', () => {
    const original = Card.create('Cartão original', 'col-todo', 'média', 'descrição');
    const restored = Card.restore(original.toSnapshot());

    expect(restored.toSnapshot()).toEqual(original.toSnapshot());
  });
});

describe('Card#changeColumn', () => {
  it('move o cartão para a coluna informada', () => {
    const card = Card.create('Cartão', 'col-todo');

    card.changeColumn('col-doing');

    expect(card.columnId).toBe('col-doing');
  });

  it('rejeita columnId vazio', () => {
    const card = Card.create('Cartão', 'col-todo');

    expect(() => card.changeColumn('')).toThrow(InvalidCardColumnError);
  });
});

describe('Card#rename', () => {
  it('atualiza título e descrição', () => {
    const card = Card.create('Título antigo', 'col-todo', 'baixa', 'descrição antiga');

    card.rename('Novo título', 'nova descrição');

    expect(card.title).toBe('Novo título');
    expect(card.description).toBe('nova descrição');
  });

  it('mantém a descrição existente quando nenhuma é informada', () => {
    const card = Card.create('Título antigo', 'col-todo', 'baixa', 'descrição original');

    card.rename('Novo título');

    expect(card.description).toBe('descrição original');
  });

  it('rejeita título inválido', () => {
    const card = Card.create('Título válido', 'col-todo');

    expect(() => card.rename('ab')).toThrow(InvalidCardTitleError);
  });
});

describe('Card#changePriority', () => {
  it('atualiza a prioridade', () => {
    const card = Card.create('Cartão', 'col-todo');

    card.changePriority('alta');

    expect(card.priority).toBe('alta');
  });

  it('rejeita prioridade inválida', () => {
    const card = Card.create('Cartão', 'col-todo');
    //@ts-expect-error
    expect(() => card.changePriority('urgente')).toThrow(InvalidPriorityError);
  });
});