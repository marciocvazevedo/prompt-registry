---
nome: 'Migração Batch para Streaming — Etapa 7: Recuperação de Falhas, Replay e Backfill'
descricao: Procedimento técnico para recuperação de falhas em streaming — classificação de falhas, retentativa e DLQ, replay por offset, backfill sem duplicar e runbook de plantão.
versao: 1.0.0
tags: [migracao, streaming, replay, backfill, runbook]
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
  - nome: INSUMO_ETAPA_3
    descricao: Resposta produzida na Etapa 3 (contrato de consumo da fonte de eventos), colada como insumo.
  - nome: INSUMO_ETAPA_5
    descricao: Resposta produzida na Etapa 5 (escrita incremental no data warehouse), colada como insumo.
---

# Migração Batch para Streaming — Etapa 7: Recuperação de Falhas, Replay e Backfill

Parte da cadeia [Migrar Pipeline de Dados de Batch para Streaming](../). Esta pasta contém o prompt isolado da etapa (`prompt.md` — frontmatter + o texto extraído sem alteração da Seção 5 do prompt-pai) e o harness de avaliação `promptfooconfig.yaml`. O frontmatter acima é idêntico ao do `prompt.md`.

## Objetivo

Produzir o procedimento que substitui o comportamento atual de "lote falhou, o próximo processa o dobro": classificação de falhas (evento inválido, falha transitória, falha de dependência, falha de deploy) e resposta para cada uma; política de retentativa e fila de mensagens mortas (DLQ) — critério de entrada, inspeção e reprocessamento; procedimento de replay a partir de um offset ou instante, com escopo limitado (por tenant, por tópico, por janela); procedimento de backfill histórico convivendo com o fluxo ao vivo, sem duplicar dados; e runbook de plantão (sintoma → diagnóstico → ação) para os 5 modos de falha mais prováveis.

## Depende de

Etapas 3 e 5. As respostas das etapas anteriores entram no `prompt.md` pelos placeholders `{{INSUMO_ETAPA_3}}` e `{{INSUMO_ETAPA_5}}`.

## Placeholders

- **Cenário** (compartilhado por toda a cadeia): `{{SISTEMA}}`, `{{FONTE_EVENTOS}}`, `{{DW}}`, `{{CONSUMIDORES}}`, `{{JANELA_ATUAL}}`, `{{DURACAO_JOB}}`, `{{N_ETAPAS}}`, `{{ENGINE}}`, `{{PARTICIONAMENTO}}`, `{{LATENCIA_ALVO}}`, `{{TAMANHO_MICRO_LOTE}}`, `{{FORMATO_SAIDA}}`.
- **Específicos desta etapa:** nenhum além do cenário.
- **Insumos de etapas anteriores:** `{{INSUMO_ETAPA_3}}`, `{{INSUMO_ETAPA_5}}`.

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
