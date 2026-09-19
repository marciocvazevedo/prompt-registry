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

# Migração Batch para Streaming — Etapa 5: Escrita Incremental no Data Warehouse

Parte da cadeia [Migrar Pipeline de Dados de Batch para Streaming](../). Esta pasta contém o prompt isolado da etapa (`prompt.md` — frontmatter + o texto extraído sem alteração da Seção 5 do prompt-pai) e o harness de avaliação `promptfooconfig.yaml`. O frontmatter acima é idêntico ao do `prompt.md`.

## Objetivo

Produzir o procedimento para mudar a escrita de "um lote fecha a partição da hora" para escrita contínua no data warehouse: estratégia de escrita incremental (append, upsert/merge, tabela de staging + merge); como manter o particionamento por hora coerente enquanto a hora ainda está aberta e quando declarar a partição "fechada"; deduplicação e garantia de escrita idempotente sob reprocessamento; problema de arquivos pequenos (compactação, frequência, janela de manutenção); isolamento e leitura consistente para quem consulta durante a escrita; e impacto em custo de armazenamento e de consulta, com estimativa.

## Depende de

Etapa 4. A resposta da etapa anterior entra no `prompt.md` pelo placeholder `{{INSUMO_ETAPA_4}}`.

## Placeholders

- **Cenário** (compartilhado por toda a cadeia): `{{SISTEMA}}`, `{{FONTE_EVENTOS}}`, `{{DW}}`, `{{CONSUMIDORES}}`, `{{JANELA_ATUAL}}`, `{{DURACAO_JOB}}`, `{{N_ETAPAS}}`, `{{ENGINE}}`, `{{PARTICIONAMENTO}}`, `{{LATENCIA_ALVO}}`, `{{TAMANHO_MICRO_LOTE}}`, `{{FORMATO_SAIDA}}`.
- **Específicos desta etapa:** nenhum além do cenário (o título usa `{{DW}}`).
- **Insumos de etapas anteriores:** `{{INSUMO_ETAPA_4}}`.

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
- O `{{INSUMO_ETAPA_4}}` embutido no `promptfooconfig.yaml` é uma resposta-exemplo congelada da Etapa 4, usada só para a avaliação.

## Limitações conhecidas

- A cadeia é manual e sequencial: rodar fora de ordem, ou sem colar as respostas reais das etapas das quais esta depende, produz resposta genérica.
- O cenário está fixado na Aegis/Forge (Relay, Forge, Sentinel, Cerebro, Pepper); usar em outro contexto exige trocar todos os `{{...}}`.
- O `promptfooconfig.yaml` avalia uma única variação de entrada (o cenário-padrão, com um insumo fixo da etapa anterior); não cobre variações de parâmetros.
