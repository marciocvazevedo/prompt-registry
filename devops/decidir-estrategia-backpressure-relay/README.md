---
nome: Decidir Estratégia de Backpressure em Pipeline de Ingestão
descricao: Conduz uma análise Tree-of-Thoughts em seis rodadas para decidir a estratégia de backpressure (throttle, desvio, buffer ou descarte) de um pipeline de ingestão de telemetria, com árvore de opções, matriz de critérios ponderados, teste adversarial e recomendação final acionável.
versao: 1.0.0
tags: [arquitetura, sre, backpressure, tree-of-thoughts, tomada-de-decisao]
inputs:
  - nome: CENARIO_RELAY
    descricao: Cenário técnico do Relay — tecnologia da fila, partições/consumidores, throughput normal e de pico, latência, retenção, distribuição de tráfego entre clientes e comportamento observado no incidente.
  - nome: REGRAS_INEGOCIAVEIS
    descricao: Restrições inegociáveis do negócio e da plataforma — SLOs contratuais, perda de dados permitida ou não, orçamento, compliance, limites de time e tecnologia.
  - nome: HORIZONTE
    descricao: Prazo para a solução estar em produção, separando contenção imediata de solução estrutural.
  - nome: PERFIL_DE_RISCO
    descricao: Apetite a risco que deve orientar a ordenação das fases e a escolha entre finalistas.
  - nome: CRITERIOS_E_PESOS
    descricao: Critérios de avaliação e pesos alternativos aos defaults C1–C6 já embutidos no prompt.
---

# Decidir Estratégia de Backpressure em Pipeline de Ingestão

## Objetivo

Apoiar a decisão de arquitetura de backpressure (segurar, priorizar, desviar ou descartar o excesso de eventos) em um pipeline de ingestão de telemetria, usando um raciocínio Tree-of-Thoughts em seis rodadas — da decomposição do problema à decisão final com fases e verificação — sobre uma plataforma fictícia de referência (Relay, Forge, Sentinel, Cérebro da "Aegis") parametrizada pelo cenário real informado.

## Quando usar

- Ao decidir como um pipeline de ingestão deve reagir quando uma fonte ou cliente dispara um pico de volume muito acima do normal.
- Quando é preciso comparar estratégias de backpressure (priorização por classe de serviço, DLQ, bulkhead por cliente, autoscaling e opções livres) sob critérios ponderados e regras inegociáveis (SLO, compliance, orçamento, time).
- Quando a decisão exige rastreabilidade: árvore de opções, matriz de pontuação, teste adversarial com backtracking e justificativa — não apenas uma recomendação isolada.
- Em contextos didáticos, para demonstrar Tree-of-Thoughts aplicado a uma decisão de arquitetura de confiabilidade.

## Exemplo de uso

Preenchimento ilustrativo (adaptado do material original — não enviar junto com os parâmetros reais):

- `CENARIO_RELAY`: Relay sobre Kafka gerenciado, 48 partições, dois consumer groups (sentinel-cg, forge-cg); normal 1,2M eventos/s, p99 de alerta em 9s; incidente com cliente enterprise saltando de 80k para 700k eventos/s em 4 min, lag do sentinel-cg chegando a 22 min.
- `REGRAS_INEGOCIAVEIS`: SLO contratual de alerta em até 60s p99 para Enterprise; telemetry de Enterprise não pode ser descartado silenciosamente; aumento de custo em regime normal limitado a 15%; time de 4 engenheiros, nada manual de madrugada.
- `HORIZONTE`: Contenção em 2 semanas; estrutural em 1 trimestre.
- `PERFIL_DE_RISCO`: Conservador — nada que possa interromper ingestão em produção.
- `CRITERIOS_E_PESOS`: vazio (usa os defaults C1–C6 do prompt).

## Limitações conhecidas

A plataforma de referência (Relay, Forge, Sentinel, Cérebro da "Aegis") é fixa e fictícia dentro do prompt — cenários com arquitetura muito diferente exigem adaptar essa seção manualmente. O estilo telegráfico desta versão (v3) reduz a redundância que ajudaria modelos menores ou execuções com contexto muito longo a manter a instrução até o fim da geração; se aparecer degradação (poda sem justificativa, condicional abandonado, finalistas que viram superconjunto), o próprio autor recomenda repetir as regras 2.4, 2.6 e R3 imediatamente antes da seção SAÍDA.
