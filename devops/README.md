# DevOps

Prompts voltados a **infraestrutura, automação e operação** de sistemas: pipelines de CI/CD, containers, orquestração, provisionamento, observabilidade, confiabilidade e segurança operacional.

## Escopo

Entram aqui prompts relacionados a:

- Pipelines de CI/CD (GitHub Actions, GitLab CI, Jenkins etc.).
- Containers e orquestração (Docker, Kubernetes, Helm).
- Infraestrutura como código (Terraform, Pulumi, Ansible).
- Provedores de nuvem (AWS, GCP, Azure) e seus recursos.
- Observabilidade (logs, métricas, tracing, alertas, dashboards).
- Confiabilidade, SRE, postmortems e análise de incidentes.
- Segurança operacional (hardening, secrets, políticas de acesso).

## Fora de escopo

- Escrita de código de aplicação → usar `desenvolvimento/`.
- Conteúdo educacional sobre DevOps (aulas, artigos, vídeos) → usar `criacao-conteudo/`.

## Prompts

- [triar-pods-kubernetes](./triar-pods-kubernetes/) — Analisa um snapshot de cluster Kubernetes (pods, eventos, logs) e entrega diagnóstico priorizado com ações para SRE de plantão.
- [gerar-nota-triagem-incidente](./gerar-nota-triagem-incidente/) — Transforma um alerta de monitoramento em uma nota de triagem de cinco campos (alerta, impacto, hipótese, ação, escalação) para abrir incidentes de plantão.
- [investigar-causa-raiz-elasticsearch](./investigar-causa-raiz-elasticsearch/) — Conduz uma RCA passo a passo (CoT) sobre degradação de latência de busca em um cluster Elasticsearch, cruzando config, métricas e logs para apontar causa-raiz, sintomas e ações.
- [decidir-estrategia-backpressure-relay](./decidir-estrategia-backpressure-relay/) — Conduz uma análise Tree-of-Thoughts em seis rodadas para decidir a estratégia de backpressure (throttle, desvio, buffer ou descarte) de um pipeline de ingestão de telemetria, com árvore de opções, matriz de critérios ponderados, teste adversarial e recomendação final acionável.
