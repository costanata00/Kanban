# Perguntas
    
# Discussão obrigatória (antes de codar)

Abram src/boards/BoardController.ts e src/cards/CardController.ts e reparem que os dois módulos dependem um do outro (BoardController recebe um CardRepository; CardController recebe um BoardRepository) — um acoplamento aferente e eferente ao mesmo tempo. Registrem, em um comentário no código ou em um parágrafo curto no README do projeto, as respostas do grupo para:

**Esse acoplamento é um problema real ou aceitável para o tamanho atual do projeto?**

Acredito que não é um grande problema agora porque é um projeto pequeno, mas se o projeto crescesse, seria um problema, porque cada mudança iria exigir uma alteração em ambas partes do código.

**Se cards precisasse virar um serviço separado no futuro, o que quebraria primeiro?**

Primeiramente ia quebrar a parte de checar se existencia de coluna e limite do WIP, também quebraria a parte de montar a view. 

**Uma alternativa seria o Board "possuir" a lista de ids de cartões (em vez de CardController perguntar ao BoardRepository) — o que isso resolveria, e o que isso criaria de novo?**

Removeria uma boa parte da da dependência do controller e o repository, e facilitaria o processo do board já que ele não teria que consultar a parte de persistência, mas o board teria que ser atualizado em todo movimento de um cartão.
