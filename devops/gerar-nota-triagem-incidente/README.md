---
nome: Gerar Nota de Triagem de Incidente
descricao: Transforma um alerta de monitoramento em uma nota de triagem de cinco campos (alerta, impacto, hipótese, ação, escalação) para abrir incidentes de plantão.
versao: 1.1.0
tags: [sre, observabilidade, incidentes, plantão, alertas]
inputs:
  - nome: MENSAGEM_DE_ALERTA
    descricao: Texto bruto do alerta em inglês (estruturado tipo alertmanager ou linha de log) a ser triado.
  - nome: CONTEXTO_ADICIONAL
    descricao: Informações adicionais do plantão (deploys, incidentes em curso, janelas de manutenção); usar "nenhum" se não houver.
---

# Gerar Nota de Triagem de Incidente

## Objetivo

Apoiar um SRE de plantão na Aegis (SaaS de observabilidade usado como cenário de referência) a
converter um alerta bruto em uma nota de triagem padronizada de seis campos — ALERTA, IMPACTO,
HIPÓTESE INICIAL, AÇÃO IMEDIATA, ESCALAR PARA e CHECKLIST — cruzando o sintoma com a topologia dos
sistemas (Relay, Forge, Sentinel, Cerebro) para localizar a causa provável, definir a prioridade de
escalação e deixar um checklist de diagnóstico com quatro passos.

## Quando usar

- Ao receber um alerta de monitoramento e precisar abrir a nota inicial do incidente no canal de plantão.
- Quando o alerta cita um sintoma isolado e é preciso raciocinar sobre o efeito a jusante na topologia do sistema.
- Para padronizar o formato de abertura de incidentes: texto puro, seis campos, sem preâmbulo.
- Quando há mais de um alerta na mesma mensagem, ou um alerta de recuperação (RESOLVED).
- Para deixar um checklist de diagnóstico pronto para quem assumir a investigação em seguida.

## Exemplo de uso

Entrada (alerta em inglês):
```
[FIRING:1] RelayEdgeAuthFailureSpike (relay, prod, us-east-1)
Severity: P2
Summary: OTLP/HTTP ingest endpoint returning 401 for 34% of requests over the last 8m
Description: relay_ingest_auth_failures_total rate jumped from 0.2/s to 210/s at 03:42 UTC.
Affected: 47 tenants. gRPC ingest path unaffected. Edge pods restarted 03:38 UTC.
```

Saída:
```
ALERTA: Relay - 34% das requisições OTLP/HTTP retornando 401 há 8min em us-east-1 (210/s de falhas de auth)
IMPACTO: 47 tenants sem ingestão via OTLP/HTTP, com perda de telemetry na origem; caminho gRPC íntegro
HIPÓTESE INICIAL: restart dos edge pods às 03:38 recarregou cache de chaves com kid desatualizado, rejeitando tokens válidos
AÇÃO IMEDIATA: comparar kid ativo entre réplicas de borda e forçar refetch do JWKS nos pods reiniciados
ESCALAR PARA: @relay-core se a taxa de 401 não cair abaixo de 1% em 10min
```

(exemplo extraído diretamente do próprio prompt, que traz mais três casos — Forge, Sentinel e Cerebro.
Nota: esse exemplo específico do prompt ainda não foi atualizado para mostrar o campo CHECKLIST na
saída, mesmo o formato RESULT já exigindo os seis campos.)

## Limitações conhecidas

- Fortemente acoplado à topologia fictícia usada como cenário (sistemas Relay, Forge, Sentinel,
  Cerebro e seus owners); para usar em outro contexto real, é preciso adaptar a tabela de
  sistemas/owners.
- Espera o alerta em inglês como entrada; a nota de saída é sempre em português do Brasil.
- Exige que o alerta traga unidades e limiares mínimos — o próprio prompt proíbe preencher
  lacunas com dados inventados.
- Os quatro exemplos (Relay, Forge, Sentinel, Cerebro) dentro do prompt ainda mostram saídas de
  cinco campos, sem o CHECKLIST — pendência a corrigir em uma próxima revisão do texto do prompt.
