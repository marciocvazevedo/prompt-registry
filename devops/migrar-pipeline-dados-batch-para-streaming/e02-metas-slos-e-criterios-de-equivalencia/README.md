---
nome: 'Migração Batch para Streaming — Etapa 2: Metas, SLOs e Critérios de Equivalência'
descricao: Procedimento técnico para definir SLOs, semântica de entrega, critério de equivalência batch/streaming, orçamento de erro com gatilho de rollback e SLAs herdados que não podem ser quebrados.
versao: 1.0.0
tags: [migracao, streaming, slo, equivalencia, sre]
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
  - nome: INSUMO_ETAPA_1
    descricao: Resposta produzida na Etapa 1 (inventário e baseline), colada como insumo.
  - nome: TOLERANCIA_DIVERGENCIA
    descricao: Divergência aceita entre a saída do pipeline em lote e em streaming.
---

# Migração Batch para Streaming — Etapa 2: Metas, SLOs e Critérios de Equivalência

Parte da cadeia [Migrar Pipeline de Dados de Batch para Streaming](../). Esta pasta contém o prompt isolado da etapa (`prompt.md` — frontmatter + o texto extraído sem alteração da Seção 5 do prompt-pai) e o harness de avaliação `promptfooconfig.yaml`. O frontmatter acima é idêntico ao do `prompt.md`.

## Objetivo

Produzir o procedimento para definir e formalizar: os SLOs do novo Forge (frescor, completude, disponibilidade do consumo, tempo de recuperação após falha); a semântica de entrega alvo (at-least-once com idempotência, exactly-once etc.) e o que ela implica para cada consumidor; a definição de "streaming equivalente ao batch" (quais consultas comparar, em qual granularidade, com qual tolerância de divergência); o orçamento de erro e o gatilho objetivo de rollback; e os SLAs herdados que não podem ser quebrados (ex.: billing da Pepper de madrugada).

> Reforço específico no `prompt.md` desta etapa: não apresentar como fatos SLAs atuais e baselines não fornecidos ou marcados como `[SUPOSIÇÃO]`.

## Depende de

Etapa 1. A resposta da etapa anterior entra no `prompt.md` pelo placeholder `{{INSUMO_ETAPA_1}}`.

## Placeholders

- **Cenário** (compartilhado por toda a cadeia): `{{SISTEMA}}`, `{{FONTE_EVENTOS}}`, `{{DW}}`, `{{CONSUMIDORES}}`, `{{JANELA_ATUAL}}`, `{{DURACAO_JOB}}`, `{{N_ETAPAS}}`, `{{ENGINE}}`, `{{PARTICIONAMENTO}}`, `{{LATENCIA_ALVO}}`, `{{TAMANHO_MICRO_LOTE}}`, `{{FORMATO_SAIDA}}`.
- **Específicos desta etapa:** `{{TOLERANCIA_DIVERGENCIA}}`.
- **Insumos de etapas anteriores:** `{{INSUMO_ETAPA_1}}`.

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
- O `{{INSUMO_ETAPA_1}}` embutido no `promptfooconfig.yaml` é uma resposta-exemplo congelada da Etapa 1, usada só para a avaliação.

## Limitações conhecidas

- A cadeia é manual e sequencial: rodar fora de ordem, ou sem colar as respostas reais das etapas das quais esta depende, produz resposta genérica.
- O cenário está fixado na Aegis/Forge (Relay, Forge, Sentinel, Cerebro, Pepper); usar em outro contexto exige trocar todos os `{{...}}`.
- O `promptfooconfig.yaml` avalia uma única variação de entrada (o cenário-padrão, com um insumo fixo da etapa anterior); não cobre variações de parâmetros.
