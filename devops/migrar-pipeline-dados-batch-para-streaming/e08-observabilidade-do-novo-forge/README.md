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

# Migração Batch para Streaming — Etapa 8: Observabilidade do Novo Forge

Parte da cadeia [Migrar Pipeline de Dados de Batch para Streaming](../). Esta pasta contém o prompt isolado da etapa (`prompt.md` — frontmatter + o texto extraído sem alteração da Seção 5 do prompt-pai) e o harness de avaliação `promptfooconfig.yaml`. O frontmatter acima é idêntico ao do `prompt.md`.

## Objetivo

Produzir o procedimento para instrumentar o Forge em streaming e alertar no Sentinel: métricas mínimas (atraso de consumo — lag — por partição, throughput, latência por micro-lote, frescor dos dados por tabela, tamanho do estado, taxa de DLQ, custo por hora); como medir o SLO de latência-alvo de ponta a ponta e onde instrumentar cada marco; alertas com condição, limiar, janela, severidade e ação esperada do plantão, evitando alerta ruidoso durante a migração; painel de acompanhamento da migração (batch vs streaming lado a lado); e teste dos alertas (como provocar cada condição de propósito no ambiente).

## Depende de

Etapas 2, 4, 5 e 7. As respostas das etapas anteriores entram no `prompt.md` pelos placeholders `{{INSUMO_ETAPA_2}}`, `{{INSUMO_ETAPA_4}}`, `{{INSUMO_ETAPA_5}}` e `{{INSUMO_ETAPA_7}}`.

## Placeholders

- **Cenário** (compartilhado por toda a cadeia): `{{SISTEMA}}`, `{{FONTE_EVENTOS}}`, `{{DW}}`, `{{CONSUMIDORES}}`, `{{JANELA_ATUAL}}`, `{{DURACAO_JOB}}`, `{{N_ETAPAS}}`, `{{ENGINE}}`, `{{PARTICIONAMENTO}}`, `{{LATENCIA_ALVO}}`, `{{TAMANHO_MICRO_LOTE}}`, `{{FORMATO_SAIDA}}`.
- **Específicos desta etapa:** `{{AMBIENTE}}` (o título usa `{{SISTEMA}}`).
- **Insumos de etapas anteriores:** `{{INSUMO_ETAPA_2}}`, `{{INSUMO_ETAPA_4}}`, `{{INSUMO_ETAPA_5}}`, `{{INSUMO_ETAPA_7}}`.

Todos aparecem no campo `inputs` do frontmatter, idêntico em `prompt.md` e neste `README.md`.

## Avaliação (promptfoo)

Da própria pasta:

```bash
npx promptfoo eval
```

- Alvo avaliado: `prompt.md`, respondido por `anthropic:messages:claude-haiku-4-5-20251001` (temperature 0, max_tokens 40000, stream).
- Juiz: `../rubric/judge-forge-streaming.xml` (LLM-as-judge, `openai:gpt-5`).
- Rubrica: 4 critérios de 0 a 2 — **C1** aderência à etapa e uso dos insumos, **C2** procedimento executável e verificável, **C3** reversibilidade e proteção do que já está no ar, **C4** honestidade sobre o que não se sabe. `nota_total` de 0 a 8.
- PASS = `nota_total >= 6` **e** nenhum critério com nota 0. O assert `llm-rubric` usa `threshold: 0.75` (equivale a 6/8).
- Os `{{INSUMO_ETAPA_*}}` embutidos no `promptfooconfig.yaml` são respostas-exemplo congeladas das etapas anteriores, usadas só para a avaliação.

## Limitações conhecidas

- A cadeia é manual e sequencial: rodar fora de ordem, ou sem colar as respostas reais das etapas das quais esta depende, produz resposta genérica.
- O cenário está fixado na Aegis/Forge (Relay, Forge, Sentinel, Cerebro, Pepper); usar em outro contexto exige trocar todos os `{{...}}`.
- O `promptfooconfig.yaml` avalia uma única variação de entrada (o cenário-padrão, com insumos fixos das etapas anteriores); não cobre variações de parâmetros.
