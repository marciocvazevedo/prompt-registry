---
nome: 'Migração Batch para Streaming — Etapa 8: Observabilidade do Novo Forge'
descricao: Procedimento técnico para instrumentar o pipeline em streaming e alertar — métricas mínimas, medição do SLO fim a fim, alertas sem ruído e painel batch vs streaming.
versao: 1.0.0
tags: [migracao, streaming, observabilidade, alerting, slo]
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
  - nome: INSUMO_ETAPA_2
    descricao: Resposta produzida na Etapa 2 (metas, SLOs e critérios de equivalência), colada como insumo.
  - nome: INSUMO_ETAPA_4
    descricao: Resposta produzida na Etapa 4 (redesenho das transformações), colada como insumo.
  - nome: INSUMO_ETAPA_5
    descricao: Resposta produzida na Etapa 5 (escrita incremental no data warehouse), colada como insumo.
  - nome: INSUMO_ETAPA_7
    descricao: Resposta produzida na Etapa 7 (falhas, replay e backfill), colada como insumo.
  - nome: AMBIENTE
    descricao: Ambientes disponíveis para testar e promover a migração.
---

# Prompt — Etapa 8 de 10: Instrumentação e Alerting do {{SISTEMA}}

**Depende de:** Etapas 2, 4, 5 e 7.

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

INSUMO — RESULTADOS DAS ETAPAS 2, 4, 5 E 7:
{{INSUMO_ETAPA_2}}

{{INSUMO_ETAPA_4}}

{{INSUMO_ETAPA_5}}

{{INSUMO_ETAPA_7}}

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
