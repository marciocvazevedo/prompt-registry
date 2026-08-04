---
nome: Investigar Causa-Raiz de Degradação no Elasticsearch
descricao: Conduz uma RCA passo a passo (CoT) sobre degradação de latência de busca em um cluster Elasticsearch, cruzando config, métricas e logs para apontar causa-raiz, sintomas e ações.
versao: 1.0.0
tags: [elasticsearch, sre, causa-raiz, observabilidade, diagnostico]
inputs:
  - nome: cluster_config_yaml
    descricao: Configuração do cluster Elasticsearch em YAML (shards, réplicas, heap, job de reindexação, cache de query).
  - nome: metrics_table
    descricao: Tabela de métricas do cluster em CSV (timestamp_utc, search_p99_ms, indexed_docs_per_s, heap_used_pct, cache_hit_pct), janela de 2h com ponto a cada 30 min.
  - nome: logs
    descricao: Logs do cluster em UTC relevantes ao período investigado.
---

# Investigar Causa-Raiz de Degradação no Elasticsearch

## Objetivo

Conduzir uma investigação de causa-raiz (RCA) de degradação de latência de busca em um cluster Elasticsearch, por meio de um raciocínio estruturado em 7 passos que cruza configuração do cluster, métricas de série temporal e logs para chegar a uma causa-raiz com nível de confiança justificado.

## Quando usar

- Quando o `search_p99_ms` do cluster subiu e é preciso identificar a causa antes de agir.
- Ao investigar se um pico de indexação, reindex, GC ou distribuição de shards está por trás de uma degradação de busca.
- Quando já se tem em mãos a config do cluster, uma janela de métricas (~2h) e os logs do período, e se quer uma RCA estruturada e auditável (linha do tempo, evidências, ações).
- Em contextos didáticos, para demonstrar um raciocínio Chain-of-Thought de troubleshooting SRE passo a passo.

## Exemplo de uso

_A preencher_

## Limitações conhecidas

Depende inteiramente dos dados fornecidos (config YAML, métricas CSV, logs) — não coleta dados por conta própria nem acessa o cluster. Se as entradas não cobrirem o período do incidente ou faltarem métricas relevantes (ex.: merges/s, CPU/I/O por nó), a causa-raiz pode ficar com confiança baixa ou indeterminada, conforme a seção "Lacunas" do próprio prompt.
