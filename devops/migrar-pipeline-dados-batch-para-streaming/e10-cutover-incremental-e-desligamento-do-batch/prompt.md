---
nome: 'Migração Batch para Streaming — Etapa 10: Cutover Incremental e Desligamento do Batch'
descricao: Procedimento técnico para o cutover incremental por fatias, com rollback por fatia, período de convivência do batch e desligamento definitivo.
versao: 1.0.0
tags: [migracao, streaming, cutover, rollback, desligamento]
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
  - nome: INSUMO_ETAPA_7
    descricao: Resposta produzida na Etapa 7 (falhas, replay e backfill), colada como insumo.
  - nome: INSUMO_ETAPA_9
    descricao: Resposta produzida na Etapa 9 (dual-run e reconciliação), colada como insumo.
  - nome: FATIA_CUTOVER
    descricao: Unidade de virada incremental usada no cutover (ex.: por tenant).
---

# Prompt — Etapa 10 de 10: Cutover Incremental, Rollback e Aposentadoria do Batch

**Depende de:** Etapas 7 e 9.

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

INSUMO — RESULTADOS DAS ETAPAS 7 E 9:
{{INSUMO_ETAPA_7}}

{{INSUMO_ETAPA_9}}

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
