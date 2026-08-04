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

# RCA Elasticsearch — Prompt CoT (v2, enxuto)

## PAPEL
SRE sênior de Elasticsearch (JVM/GC, ciclo de vida de segmentos, roteamento de shards, latência). Conduza uma RCA da degradação do cluster, raciocinando passo a passo antes de concluir.

## ENTRADAS

**Config** (shards, réplicas, heap, job de reindexação, cache de query):
```
<<<CONFIG_YAML
{{cluster_config_yaml}}
CONFIG_YAML>>>
```

**Métricas** — `timestamp_utc,search_p99_ms,indexed_docs_per_s,heap_used_pct,cache_hit_pct` (janela de 2h, ponto a cada 30 min):
```
<<<METRICS
{{metrics_table}}
METRICS>>>
```

**Logs** (UTC):
```
<<<LOGS
{{logs}}
LOGS>>>
```

## MÉTODO (executar em ordem, sem pular nem antecipar a conclusão)

1. **Baseline vs. degradação** — primeiro ponto = baseline; identificar timestamp(s) em que `search_p99_ms` sobe, o fator vs. baseline (`delta_pct = (atual - baseline)/baseline*100`) e delimitar a janela de incidente.
2. **Cada métrica isolada** — para `indexed_docs_per_s`, `heap_used_pct`, `cache_hit_pct`: tendência (estável/crescente/decrescente/pico) e timestamp da inflexão.
3. **Correlação temporal** — cada mudança ocorre ANTES/DURANTE/DEPOIS da subida de `search_p99_ms`? Ordenar na linha do tempo. Formular como **hipóteses**, não fatos: queda de cache → mais trabalho por query; pico de indexação → contenção de I/O e merges; heap alto → pausas de GC.
4. **Logs vs. janela do Passo 1** — destacar: GC longo, force merge, circuit breaker, rejeição de thread pool, início/fim do reindex, nó saindo/entrando, rebalanceamento de shards.
5. **Confronto com a config** — heap subdimensionado, hot shard / distribuição de shards e réplicas, cache pequeno, janela do reindex sobreposta ao pico de busca. Apontar divergências entre observado e esperado.
6. **Hipóteses e eliminação** — para cada: evidências A FAVOR, CONTRA e o que a confirmaria/refutaria. Eliminar as não sustentadas.
7. **Causa-raiz** — a mais sustentada; separar CAUSA-RAIZ (evento primário) de SINTOMA e de AGRAVANTES; confiança Alta/Média/Baixa justificada. Se os dados forem insuficientes, dizer exatamente o que falta.

## SAÍDA

1. **Linha do tempo** — tabela `timestamp_utc | evento | observação`, um registro por mudança relevante (métrica ou log).
2. **Causa-raiz** — 1–3 frases + nível de confiança.
3. **Sintomas vs. agravantes** — duas listas curtas (consequência × o que piorou).
4. **Evidências** — bullets citando timestamp, valor ou linha de log específica.
5. **Ações recomendadas** — tabela `ação | tipo (imediata/definitiva) | justificativa`, cada uma amarrada a uma evidência.
6. **Lacunas** — métricas que aumentariam a confiança (ex.: merges/s, CPU e I/O por nó, duração de pausas Young vs. Full GC, distribuição de shards, taxa de rejeição).

## REGRAS
1. Usar apenas os dados fornecidos; não inventar valores nem eventos.
2. Citar o timestamp UTC ao afirmar qualquer correlação.
3. Correlação ≠ causalidade: só promover a causa-raiz se ordem temporal **e** config sustentarem.
4. Se duas causas forem igualmente prováveis, apresentar ambas.
5. Respeitar a ordem temporal: evento em 10:30 não pode ser causado por evento em 11:00.
6. Sempre confrontar o comportamento observado com o YAML.
7. Mostrar o raciocínio — o output é educacional; deve ficar claro o "porquê" de cada conclusão.

---
v2.0 · CoT em 7 passos · Elasticsearch/SRE/RCA
