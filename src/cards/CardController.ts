import type { CardRepository } from './CardRepository.js';
import type { BoardRepository } from '../boards/BoardRepository.js';
import type { ControllerResult } from '../shared/http.js';
import { NotImplementedError } from '../shared/errors.js';
import { Card, type CardPriority } from './Card.js';
import { toBoardViewModel } from '../boards/boardView.js';
import { CardNotFoundError, DuplicateCardTitleError, InvalidCardColumnError, WipLimitExceededError } from './errors.js';
import { ColumnNotFoundError } from '../boards/errors.js';

/**
 * CONTROLLER — nenhum método está implementado ainda. Isso é proposital:
 * cada método corresponde a uma atividade proposta na Aula 03 (ver
 * aula03.md). O construtor já recebe os dois repositórios que vocês vão
 * precisar — `cardRepository` para persistir cartões, `boardRepository`
 * para validar que uma coluna existe antes de criar/mover um cartão nela.
 */
export class CardController {
  constructor(
    private readonly cardRepository: CardRepository,
    private readonly boardRepository: BoardRepository,
  ) { }

  /**
   * TODO (Atividade 1): criar um cartão a partir do corpo da requisição
   * (`{ title, columnId, priority?, description? }`) e redirecionar de
   * volta para `/`. Regras a aplicar: título válido (`Card.create` já
   * valida), coluna precisa existir no quadro (`boardRepository`), e não
   * pode haver título duplicado na mesma coluna (Atividade 6 — podem
   * implementar já aqui ou depois, é a mesma regra).
   */
  create(_body: unknown): ControllerResult {
    const body = _body as Record<string, any>;
    const title = body.title;
    const columnId = body.columnId;
    const board = this.boardRepository.getDefault();

    if (!board.hasColumn(columnId)) {
      throw new ColumnNotFoundError(columnId);
    }

    const column = board.findColumn(columnId);
    const cardsInColumn = this.cardRepository.findByColumn(columnId).length;
    if (column.wipLimit !== null && cardsInColumn >= column.wipLimit) {
      throw new WipLimitExceededError(column.wipLimit);
    }

    if (this.cardRepository.existsWithTitleInColumn(title, columnId)) {
      throw new DuplicateCardTitleError(title);
    }

    const card = Card.create(title, columnId, body.priority, body.description);
    this.cardRepository.save(card);
    return {
      status: 201,
      view: 'board/index',
      locals: { board: toBoardViewModel(board, this.cardRepository.findAll()) },
    };
  }

  /**
   * TODO (Atividade 2): mover um cartão para outra coluna
   * (`{ columnId }` no corpo). Regras: coluna destino precisa existir;
   * respeitar o limite de WIP da coluna destino (Atividade 5).
   */
  move(id: string, _body: unknown): ControllerResult {
    const body = _body as Record<string, any>;
    const columnId = body.columnId;
    const card = this.cardRepository.findById(id);
    if (!card) {
      throw new CardNotFoundError(id);
    }

    const board = this.boardRepository.getDefault();
    if (!board.hasColumn(columnId)) {
      throw new ColumnNotFoundError(columnId);
    }

    const column = board.findColumn(columnId);
    const cardsInColumn = this.cardRepository.findByColumn(columnId).length;
    if (column.wipLimit !== null && cardsInColumn >= column.wipLimit) {
      throw new WipLimitExceededError(column.wipLimit);
    }

    card.changeColumn(columnId);
    this.cardRepository.save(card);
    return {
      status: 200,
      view: 'board/index',
      locals: { board: toBoardViewModel(board, this.cardRepository.findAll()) },
    };
  }

  /**
   * TODO (Atividade 3): editar título/descrição/prioridade de um cartão
   * existente (`{ title?, description?, priority? }`).
   */
  update(id: string, _body: unknown): ControllerResult {
    const body = _body as Record<string, unknown>;
    const card = this.cardRepository.findById(id);
    if (!card) {
      throw new CardNotFoundError(id);
    }
    if (body.title !== undefined || body.description !== undefined) {
      card.rename(body.title as string ?? card.title, body.description as string ?? card.description);
    }
    if (body.priority !== undefined) {
      card.changePriority(body.priority as CardPriority);
    }
    this.cardRepository.save(card);
    const board = this.boardRepository.getDefault();
    return {
      status: 200,
      view: 'board/index',
      locals: { board: toBoardViewModel(board, this.cardRepository.findAll()) },
    };
  }
  /** TODO (Atividade 4): excluir um cartão existente. */
  remove(_id: string): ControllerResult {
    const card = this.cardRepository.findById(_id);
    if (!card) {
      throw new CardNotFoundError(_id);
    }
    this.cardRepository.delete(card.id);
    const board = this.boardRepository.getDefault();
    return {
      status: 200,
      view: 'board/index',
      locals: { board: toBoardViewModel(board, this.cardRepository.findAll()) },
    };
  }

  /** TODO (Atividade 8, estica): página de detalhe de um cartão. */
  showDetail(_id: string): ControllerResult {
    throw new NotImplementedError('CardController#showDetail');
  }

  /** TODO (Atividade 9, estica): buscar cartões por título (`?query=`). */
  search(_query: unknown): ControllerResult {
    throw new NotImplementedError('CardController#search');
  }
}
