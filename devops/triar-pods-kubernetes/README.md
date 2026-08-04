---
nome: Triagem de Pods Kubernetes Problemáticos
descricao: Analisa um snapshot de cluster Kubernetes (pods, eventos, logs) e entrega diagnóstico priorizado com ações para SRE de plantão.
versao: 1.0.0
tags: [sre, kubernetes, devops, troubleshooting, plantão]
inputs:
  - nome: SNAPSHOT_CLUSTER
    descricao: Saída bruta coletada do cluster (status dos pods, eventos e logs de containers).
  - nome: AMBIENTE
    descricao: Ambiente do cluster analisado (ex. produção, homologação); opcional, usar "não informado" se ausente.
  - nome: NAMESPACE
    descricao: Namespace(s) de interesse para a triagem; opcional, usar "não informado" se ausente.
---

# Triagem de Pods Kubernetes Problemáticos

## Objetivo

Apoiar um SRE de plantão na triagem rápida de um snapshot de cluster Kubernetes, cruzando
status de pods, eventos e logs para identificar causas prováveis, priorizar por impacto e
recomendar ações imediatas, de verificação e de encaminhamento.

## Quando usar

- Durante plantão, ao receber um alerta e precisar decidir rapidamente o que fazer.
- Para consolidar `kubectl get pods` + `describe`/`events` + logs em um diagnóstico único.
- Quando há múltiplos pods com sintomas parecidos e é preciso identificar causa raiz comum.
- Para produzir um relato acionável (não um relatório acadêmico) legível de madrugada.

## Exemplo de uso

_A preencher_

## Limitações conhecidas

- Depende da completude do snapshot fornecido: se eventos ou logs de um pod não estiverem
  incluídos, o diagnóstico daquele pod fica com confiança baixa (o próprio prompt instrui a
  declarar a lacuna em vez de supor a causa).
- Não cobre causas fora do snapshot (ex.: infraestrutura de rede externa, cloud provider).
