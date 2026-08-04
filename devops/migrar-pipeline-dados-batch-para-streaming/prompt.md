---
nome: Migrar Pipeline de Dados de Batch para Streaming
descricao: Cadeia de 11 prompts Least-to-Most (1 de decomposição + 10 de execução, um por etapa) para planejar e executar a migração de um pipeline de dados de processamento em lote para event-driven, do inventário inicial ao cutover incremental e desligamento do batch.
versao: 1.0.0
tags: [migracao, pipeline-de-dados, streaming, engenharia-de-dados, sre]
inputs:
  - nome: SISTEMA
    descricao: Sistema sendo migrado.
  - nome: FONTE_EVENTOS
    descricao: De onde vêm os eventos consumidos pelo sistema.
  - nome: DW
    descricao: Destino de escrita (data warehouse) das transformações.
  - nome: CONSUMIDORES
    descricao: Sistemas e relatórios downstream que quebram se o sistema mudar.
  - nome: JANELA_ATUAL
    descricao: Intervalo do cron atual de ingestão em lote.
  - nome: DURACAO_JOB
    descricao: Duração média do lote atual.
  - nome: N_ETAPAS
    descricao: Número de etapas encadeadas de transformação no pipeline atual.
  - nome: ENGINE
    descricao: Motor de processamento usado nas transformações.
  - nome: PARTICIONAMENTO
    descricao: Particionamento atual das tabelas de destino.
  - nome: LATENCIA_ALVO
    descricao: Meta de frescor (latência-alvo) do novo pipeline em streaming.
  - nome: TAMANHO_MICRO_LOTE
    descricao: Bloco de processamento (janela) do novo modelo em streaming.
  - nome: AMBIENTE
    descricao: Ambientes disponíveis para testar e promover a migração.
  - nome: JANELA_DUAL_RUN
    descricao: Tempo rodando o pipeline em lote e em streaming em paralelo antes do cutover.
  - nome: FATIA_CUTOVER
    descricao: Unidade de virada incremental usada no cutover (ex.: por tenant).
  - nome: TOLERANCIA_DIVERGENCIA
    descricao: Divergência aceita entre a saída do pipeline em lote e em streaming.
  - nome: FORMATO_SAIDA
    descricao: Formato exigido nas respostas de cada prompt da cadeia.
---

## 2. Tabela de Parâmetros

Substitua os valores entre `{{ }}` em todos os prompts. Os valores abaixo já vêm preenchidos com o cenário atual da Aegis — ajuste o que mudar.

| Parâmetro | Valor padrão | O que é |
|---|---|---|
| `{{SISTEMA}}` | Forge | Sistema sendo migrado |
| `{{FONTE_EVENTOS}}` | Relay | De onde vêm os eventos |
| `{{DW}}` | data warehouse do Forge | Destino de escrita |
| `{{CONSUMIDORES}}` | Sentinel (tabelas agregadas), Cerebro (índice de eventos transformados), relatórios de billing da Pepper (execução de madrugada) | Quem quebra se o Forge mudar |
| `{{JANELA_ATUAL}}` | 60 min | Intervalo do cron atual |
| `{{DURACAO_JOB}}` | ~40 min | Duração média do lote |
| `{{N_ETAPAS}}` | 14 | Etapas encadeadas de transformação |
| `{{ENGINE}}` | Spark | Motor de processamento |
| `{{PARTICIONAMENTO}}` | por hora | Particionamento atual das tabelas |
| `{{LATENCIA_ALVO}}` | 2 min (p95, do evento no Relay até consultável no DW) | Meta de frescor |
| `{{TAMANHO_MICRO_LOTE}}` | 30 s | Bloco de processamento no novo modelo |
| `{{AMBIENTE}}` | staging → produção | Ambientes disponíveis |
| `{{JANELA_DUAL_RUN}}` | 14 dias | Tempo rodando batch e streaming em paralelo |
| `{{FATIA_CUTOVER}}` | por tenant, começando pelos 5 menores | Unidade de virada incremental |
| `{{TOLERANCIA_DIVERGENCIA}}` | 0,1% das linhas por hora | Divergência aceita entre batch e streaming |
| `{{FORMATO_SAIDA}}` | Markdown com passos numerados | Formato pedido nas respostas |

---

## 3. Bloco de Contexto Base

*(cole isto no topo de todos os prompts)*

```
CONTEXTO

Você é um engenheiro de plataforma sênior da Aegis, empresa de observabilidade em SaaS.

A plataforma tem quatro sistemas:
- Relay: barramento de eventos assíncrono e borda de ingestão; todo telemetry de cliente entra por ele.
- Forge: pipeline de dados e data warehouse; transforma telemetry em série temporal e tabela consultável.
- Sentinel: produto de observabilidade e alerting usado pelos clientes.
- Cerebro: indexação e busca em logs.

Fluxo: Clientes -> Relay -> (Forge, Sentinel); Forge -> (Sentinel, Cerebro); Cerebro -> Sentinel; Sentinel -> time de plantão.

SITUAÇÃO ATUAL DO {{SISTEMA}}
- Ingestão: job em cron ("forge-batch-ingest") que acorda a cada {{JANELA_ATUAL}}.
- Transformação: {{N_ETAPAS}} etapas encadeadas em {{ENGINE}}, ~{{DURACAO_JOB}} no total.
- Destino: tabelas no {{DW}}, particionadas {{PARTICIONAMENTO}}.
- Ponto frágil: se um lote falha, o lote seguinte processa o dobro de volume.
- Dependentes: {{CONSUMIDORES}}.

OBJETIVO DA MIGRAÇÃO
- Consumir do {{FONTE_EVENTOS}} continuamente, processando em blocos de {{TAMANHO_MICRO_LOTE}} no lugar do lote de {{JANELA_ATUAL}}.
- Latência alvo: {{LATENCIA_ALVO}}.
- Manter todos os dependentes funcionando durante toda a transição.
- Sem big-bang: migração em passos, cada passo com caminho de volta.

REGRAS DE RESPOSTA
- Responda em {{FORMATO_SAIDA}}.
- Seja concreto: nomes de jobs, tabelas, tópicos, métricas e comandos, não conselhos genéricos.
- Quando faltar informação, assuma um valor plausível e marque como [SUPOSIÇÃO].
```

---

## 4. Prompt 0 — Decomposição do problema

*(este é o único prompt que não resolve uma etapa; ele cria a lista de etapas)*

```
[COLE AQUI O BLOCO DE CONTEXTO BASE]

TAREFA

Decomponha a migração do {{SISTEMA}} de batch para event-driven em etapas,
da mais básica para a mais dependente (Least-to-Most).

Regras da decomposição:
- Entre 8 e 12 etapas. Nem uma etapa gigante, nem microtarefas.
- Cada etapa precisa ser resolvível de forma independente, desde que as
  etapas das quais ela depende já estejam resolvidas.
- Ordene as etapas de modo que nenhuma dependa de uma etapa posterior.

SAÍDA ESPERADA

1) Uma tabela com as colunas:
   | Nº | Nome da etapa | O que envolve (3 a 5 itens) | Depende de | Entregável concreto | Como sei que terminou |

2) Um grafo de dependências em Mermaid (flowchart LR) ligando as etapas.

3) Uma lista de riscos de ordenação: pares de etapas que parecem
   independentes mas não são, e por quê.

Não resolva nenhuma etapa agora. Apenas decomponha e ordene.
```

**O que fazer com a resposta:** confira se a ordem bate com a dos Prompts 1–10 abaixo. Se o modelo propuser uma decomposição diferente, adapte os nomes das etapas nos prompts seguintes — a estrutura da cadeia continua válida.

---

## 5. Prompts 1 a 10 — um por etapa

Cada prompt abaixo segue o mesmo esqueleto:

```
[BLOCO DE CONTEXTO BASE]
+ [respostas das etapas das quais esta depende]
+ [tarefa da etapa]
+ [formato de saída = procedimento técnico]
```

E todos pedem a resposta no mesmo formato de procedimento:

**FORMATO DE PROCEDIMENTO (padrão para os Prompts 1–10):**

```
FORMATO DA RESPOSTA — PROCEDIMENTO TÉCNICO

0. Pré-requisitos: o que precisa estar pronto/acessível antes de começar.
1..N. Passos numerados, em ordem de execução. Cada passo com:
      - ação (imperativo: "crie", "rode", "altere");
      - onde é executado (repositório, cluster, console, tabela);
      - comando, trecho de código ou configuração quando aplicável;
      - verificação: como confirmar que o passo deu certo.
X. Ponto de não-retorno: a partir de qual passo voltar atrás fica caro, e por quê.
Y. Rollback: como desfazer, passo a passo.
Z. Critérios de conclusão: lista objetiva e verificável.
W. Riscos e mitigação: tabela | risco | probabilidade | impacto | mitigação |.

Não inclua trabalho que pertença a outra etapa. Se precisar de algo de uma
etapa posterior, registre como "dependência externa" e siga em frente.
```

---

### Prompt 1 — Etapa 1: Inventário e baseline

**Depende de:** nada.

```
[BLOCO DE CONTEXTO BASE]

ETAPA 1 DE 10 — INVENTÁRIO E BASELINE

TAREFA
Produza o procedimento para levantar, com números reais, o estado atual do {{SISTEMA}}:
- volume, formato e schema do telemetry que chega do {{FONTE_EVENTOS}};
- inventário das {{N_ETAPAS}} etapas de transformação em {{ENGINE}}: entrada, saída,
  tempo de execução e se cada uma é sem estado, agregação ou junção;
- inventário das tabelas gravadas no {{DW}}: schema, particionamento, tamanho, taxa de crescimento;
- mapa de consumo: quem lê o quê, com que frequência e com qual expectativa de frescor
  ({{CONSUMIDORES}});
- baseline de custo, latência fim a fim e taxa de falha do lote atual.

[COLE AQUI O FORMATO DE PROCEDIMENTO]
```

---

### Prompt 2 — Etapa 2: Metas, SLOs e critérios de equivalência

**Depende de:** Etapa 1.

```
[BLOCO DE CONTEXTO BASE]

INSUMO — RESULTADO DA ETAPA 1:
[cole aqui a resposta do Prompt 1]

ETAPA 2 DE 10 — METAS, SLOs E CRITÉRIOS DE EQUIVALÊNCIA

TAREFA
Produza o procedimento para definir e formalizar:
- SLOs do novo {{SISTEMA}}: frescor ({{LATENCIA_ALVO}}), completude, disponibilidade
  do consumo e tempo de recuperação após falha;
- a semântica de entrega alvo (at-least-once com idempotência, exactly-once etc.)
  e o que isso implica para cada consumidor;
- a definição de "streaming equivalente ao batch": quais consultas comparar,
  em qual granularidade, com qual {{TOLERANCIA_DIVERGENCIA}};
- o orçamento de erro e o gatilho objetivo de rollback;
- os SLAs herdados que não podem ser quebrados (ex.: billing da Pepper de madrugada).

[COLE AQUI O FORMATO DE PROCEDIMENTO]
```

---

### Prompt 3 — Etapa 3: Contrato de consumo do Relay

**Depende de:** Etapas 1 e 2.

```
[BLOCO DE CONTEXTO BASE]

INSUMO — RESULTADOS DAS ETAPAS 1 E 2:
[cole aqui as respostas dos Prompts 1 e 2]

ETAPA 3 DE 10 — CONTRATO DE CONSUMO DO {{FONTE_EVENTOS}}

TAREFA
Produza o procedimento para estabelecer como o {{SISTEMA}} passa a consumir
eventos continuamente do {{FONTE_EVENTOS}}:
- tópicos/streams a consumir, chave de particionamento e grau de paralelismo;
- grupo de consumo, controle de offsets e checkpointing;
- garantias de ordem por chave e tratamento de eventos fora de ordem e atrasados;
- retenção necessária no {{FONTE_EVENTOS}} para permitir reprocessamento;
- versionamento e evolução de schema dos eventos;
- controle de vazão: backpressure, limites de consumo e proteção do {{FONTE_EVENTOS}}
  contra o novo consumidor.

Deixe explícito o que precisa mudar no {{FONTE_EVENTOS}} e o que é mudança só do lado do {{SISTEMA}}.

[COLE AQUI O FORMATO DE PROCEDIMENTO]
```

---

### Prompt 4 — Etapa 4: Redesenho das transformações para streaming

**Depende de:** Etapas 2 e 3.

```
[BLOCO DE CONTEXTO BASE]

INSUMO — RESULTADOS DAS ETAPAS 2 E 3:
[cole aqui as respostas dos Prompts 2 e 3]

ETAPA 4 DE 10 — REDESENHO DAS {{N_ETAPAS}} TRANSFORMAÇÕES

TAREFA
Produza o procedimento para converter as {{N_ETAPAS}} etapas de {{ENGINE}} em
processamento por micro-lotes de {{TAMANHO_MICRO_LOTE}}:
- classifique cada etapa em: sem estado, agregação por janela, junção, ou enriquecimento
  por lookup, e diga o tratamento de cada classe;
- defina janelas, watermarks e política de eventos atrasados;
- defina onde fica o estado, seu tamanho estimado e a política de expiração;
- torne cada etapa idempotente e reexecutável (chave de deduplicação, chave natural);
- indique quais etapas não fazem sentido em streaming e devem permanecer em lote,
  justificando;
- defina a estratégia de testes por etapa, incluindo comparação com a saída do lote atual.

[COLE AQUI O FORMATO DE PROCEDIMENTO]
```

---

### Prompt 5 — Etapa 5: Modelo de escrita no data warehouse

**Depende de:** Etapa 4.

```
[BLOCO DE CONTEXTO BASE]

INSUMO — RESULTADO DA ETAPA 4:
[cole aqui a resposta do Prompt 4]

ETAPA 5 DE 10 — ESCRITA INCREMENTAL NO {{DW}}

TAREFA
Produza o procedimento para mudar a escrita de "um lote fecha a partição da hora"
para escrita contínua:
- estratégia de escrita incremental (append, upsert/merge, tabela de staging + merge);
- como manter o particionamento {{PARTICIONAMENTO}} coerente enquanto a hora ainda
  está aberta, e quando declarar a partição "fechada";
- deduplicação e garantia de escrita idempotente sob reprocessamento;
- problema de arquivos pequenos: compactação, frequência e janela de manutenção;
- isolamento e leitura consistente para quem consulta durante a escrita;
- impacto em custo de armazenamento e de consulta, com estimativa.

[COLE AQUI O FORMATO DE PROCEDIMENTO]
```

---

### Prompt 6 — Etapa 6: Camada de compatibilidade para os consumidores

**Depende de:** Etapas 2 e 5.

```
[BLOCO DE CONTEXTO BASE]

INSUMO — RESULTADOS DAS ETAPAS 2 E 5:
[cole aqui as respostas dos Prompts 2 e 5]

ETAPA 6 DE 10 — COMPATIBILIDADE COM {{CONSUMIDORES}}

TAREFA
Produza o procedimento para que os dependentes continuem funcionando sem alteração
durante a transição:
- camada de views/tabelas que preserva a interface horária hoje consumida;
- para o Sentinel: como as tabelas agregadas passam a ser lidas com dados de hora
  em aberto sem gerar alerta falso;
- para o Cerebro: como a indexação passa de "lote pronto" para fluxo contínuo,
  sem indexar duas vezes;
- para o billing da Pepper: como garantir uma visão estável e fechada da madrugada,
  imune a reprocessamentos posteriores;
- contrato de comunicação: o que avisar a cada time, quando, e o que pedir que validem.

[COLE AQUI O FORMATO DE PROCEDIMENTO]
```

---

### Prompt 7 — Etapa 7: Falhas, replay e backfill

**Depende de:** Etapas 3 e 5.

```
[BLOCO DE CONTEXTO BASE]

INSUMO — RESULTADOS DAS ETAPAS 3 E 5:
[cole aqui as respostas dos Prompts 3 e 5]

ETAPA 7 DE 10 — RECUPERAÇÃO DE FALHAS, REPLAY E BACKFILL

TAREFA
Produza o procedimento que substitui o comportamento atual de "lote falhou, o próximo
processa o dobro":
- classificação de falhas (evento inválido, falha transitória, falha de dependência,
  falha de deploy) e resposta para cada uma;
- política de retentativa e fila de mensagens mortas (DLQ): critério de entrada,
  inspeção e reprocessamento;
- procedimento de replay a partir de um offset ou instante, com escopo limitado
  (por tenant, por tópico, por janela);
- procedimento de backfill histórico convivendo com o fluxo ao vivo, sem duplicar dados;
- runbook de plantão: sintoma → diagnóstico → ação, para os 5 modos de falha mais prováveis.

[COLE AQUI O FORMATO DE PROCEDIMENTO]
```

---

### Prompt 8 — Etapa 8: Observabilidade do novo Forge

**Depende de:** Etapas 2, 4, 5 e 7.

```
[BLOCO DE CONTEXTO BASE]

INSUMO — RESULTADOS DAS ETAPAS 2, 4, 5 E 7:
[cole aqui as respostas dos Prompts 2, 4, 5 e 7]

ETAPA 8 DE 10 — INSTRUMENTAÇÃO E ALERTING DO {{SISTEMA}}

TAREFA
Produza o procedimento para instrumentar o {{SISTEMA}} em streaming e alertar no Sentinel:
- métricas mínimas: atraso de consumo (lag) por partição, throughput, latência por
  micro-lote, frescor dos dados por tabela, tamanho do estado, taxa de DLQ, custo por hora;
- como medir o SLO de {{LATENCIA_ALVO}} de ponta a ponta e onde instrumentar cada marco;
- alertas: condição, limiar, janela, severidade e ação esperada do plantão — evitando
  alerta ruidoso durante a migração;
- painel de acompanhamento da migração (batch vs streaming lado a lado);
- teste dos alertas: como provocar cada condição de propósito em {{AMBIENTE}}.

[COLE AQUI O FORMATO DE PROCEDIMENTO]
```

---

### Prompt 9 — Etapa 9: Execução em paralelo e reconciliação

**Depende de:** Etapas 5, 6 e 8.

```
[BLOCO DE CONTEXTO BASE]

INSUMO — RESULTADOS DAS ETAPAS 5, 6 E 8:
[cole aqui as respostas dos Prompts 5, 6 e 8]

ETAPA 9 DE 10 — DUAL-RUN E RECONCILIAÇÃO ({{JANELA_DUAL_RUN}})

TAREFA
Produza o procedimento para rodar o pipeline em lote e o pipeline event-driven em
paralelo, sem que o novo afete os consumidores:
- como isolar as saídas do pipeline novo (tabelas espelho, schema separado);
- job de reconciliação: quais comparações rodar, com que frequência, em qual granularidade;
- relatório de divergências: como classificar (esperada, por timing, por bug) e
  como escalar quando passar de {{TOLERANCIA_DIVERGENCIA}};
- carga: como garantir que o dual-run não degrade o {{FONTE_EVENTOS}} nem o {{DW}};
- critério objetivo de "aprovado para cutover" ao fim de {{JANELA_DUAL_RUN}}.

[COLE AQUI O FORMATO DE PROCEDIMENTO]
```

---

### Prompt 10 — Etapa 10: Cutover incremental e desligamento do batch

**Depende de:** Etapas 7 e 9.

```
[BLOCO DE CONTEXTO BASE]

INSUMO — RESULTADOS DAS ETAPAS 7 E 9:
[cole aqui as respostas dos Prompts 7 e 9]

ETAPA 10 DE 10 — CUTOVER INCREMENTAL, ROLLBACK E APOSENTADORIA DO BATCH

TAREFA
Produza o procedimento de virada em fatias ({{FATIA_CUTOVER}}), sem big-bang:
- mecanismo de chaveamento por fatia (feature flag, roteamento por tenant) e onde ele mora;
- ondas de cutover: composição de cada onda, tempo mínimo de observação entre elas
  e critério para avançar;
- rollback por fatia: passos, tempo alvo de execução e o que acontece com os dados
  produzidos durante a fatia revertida;
- período de convivência: por quanto tempo o "forge-batch-ingest" continua ligado como rede
  de segurança, e sob quais condições ele é desligado;
- desligamento definitivo: remoção do cron, limpeza de tabelas espelho, remoção da camada
  de compatibilidade e atualização da documentação e do runbook.

[COLE AQUI O FORMATO DE PROCEDIMENTO]
```
