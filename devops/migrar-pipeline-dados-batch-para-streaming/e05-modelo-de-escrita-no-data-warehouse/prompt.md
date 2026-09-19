---
nome: 'Migração Batch para Streaming — Etapa 5: Escrita Incremental no Data Warehouse'
descricao: Procedimento técnico para trocar a escrita "um lote fecha a partição" por escrita incremental no data warehouse, com dedup, compactação, isolamento de leitura e estimativa de custo.
versao: 1.0.0
tags: [migracao, streaming, data-warehouse, escrita-incremental, particionamento]
inputs:
  - nome: SISTEMA
    descricao: Sistema sendo migrado.
  - nome: JANELA_ATUAL
    descricao: Intervalo do cron atual de ingestão em lote.
  - nome: N_ETAPAS
    descricao: Número de etapas encadeadas de transformação no pipeline atual.
  - nome: ENGINE
    descricao: Motor de processamento usado nas transformações.
  - nome: DURACAO_JOB
    descricao: Duração média do lote atual.
  - nome: DW
    descricao: Destino de escrita (data warehouse) das transformações.
  - nome: PARTICIONAMENTO
    descricao: Particionamento atual das tabelas de destino.
  - nome: CONSUMIDORES
    descricao: Sistemas e relatórios downstream que quebram se o sistema mudar.
  - nome: FONTE_EVENTOS
    descricao: De onde vêm os eventos consumidos pelo sistema.
  - nome: TAMANHO_MICRO_LOTE
    descricao: Bloco de processamento (janela) do novo modelo em streaming.
  - nome: LATENCIA_ALVO
    descricao: Meta de frescor (latência-alvo) do novo pipeline em streaming.
  - nome: FORMATO_SAIDA
    descricao: Formato exigido nas respostas de cada prompt da cadeia.
  - nome: INSUMO_ETAPA_4
    descricao: Resposta produzida na Etapa 4 (redesenho das transformações), colada como insumo.
---

# Prompt — Etapa 5 de 10: Escrita Incremental no {{DW}}

**Depende de:** Etapa 4.

---

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

INSUMO — RESULTADO DA ETAPA 4:
{{INSUMO_ETAPA_4}}

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

Todo valor assumido deve vir marcado como [SUPOSIÇÃO] e com a razão de ter sido assumido;
o output deve dizer quais dados faltam e para quê (por exemplo: tamanho real do estado por tenant,
retenção configurada no Relay, custo atual por lote) e o que confirmaria ou derrubaria as escolhas feitas;
nenhum sistema, tabela, tópico, número ou SLA fora do INPUT e do GABARITO devem aparecer como fato.
```
