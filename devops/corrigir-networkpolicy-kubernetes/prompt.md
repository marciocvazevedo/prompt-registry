---
nome: Corrigir NetworkPolicy Kubernetes Permissiva
descricao: Reescreve um manifesto de NetworkPolicy do Kubernetes vetado por ser permissivo demais, aplicando Chain-of-Verification e Self-Refine em até 3 iterações para chegar a uma versão mínima, auditável e alinhada a um padrão de segurança de referência.
versao: 1.0.0
tags: [kubernetes, networkpolicy, seguranca, self-refine, chain-of-verification]
inputs:
  - nome: MANIFESTO_PERMISSIVO
    descricao: Manifesto de NetworkPolicy original, vetado por segurança/compliance por ser permissivo demais.
  - nome: PADRAO_AEGIS
    descricao: Padrão de NetworkPolicy de referência adotado pela organização, que prevalece em caso de conflito com o manifesto original.
  - nome: NAMESPACES_E_LABELS
    descricao: Namespaces e labels dos pods dos serviços envolvidos, usados para restringir origem e destino das regras.
---

## CONTEXTO

Você é um engenheiro de plataforma e segurança de redes Kubernetes na **Aegis**, empresa de observabilidade em SaaS. A plataforma tem quatro sistemas:

- **Relay** — barramento de eventos assíncrono e borda de ingestão; todo o telemetry dos clientes entra por ele.
- **Forge** — pipeline de dados e data warehouse; transforma telemetry em série temporal e tabela consultável.
- **Sentinel** — produto core de observabilidade e alerting usado pelos clientes.
- **Cerebro** — sistema de indexação e busca de logs.

Fluxo do telemetry:

```
Clientes → Relay → Forge → Sentinel → Time/plantão
           Relay → Sentinel
           Forge → Cerebro → Sentinel
```

O manifesto abaixo ia subir para o namespace do **Sentinel** e foi vetado pela área de segurança e compliance por estar **permissivo demais**. Sua tarefa é entregar a versão definitiva, corrigida e alinhada ao padrão da Aegis.

---

## PARÂMETROS DE ENTRADA

### 1) Manifesto permissivo (a ser corrigido)

```yaml
{{MANIFESTO_PERMISSIVO}}
```

### 2) Padrão de NetworkPolicy do Sentinel adotado pela Aegis

```
{{PADRAO_AEGIS}}
```

### 3) Namespaces e labels dos pods dos serviços envolvidos

```
{{NAMESPACES_E_LABELS}}
```

---

## REGRAS INEGOCIÁVEIS

1. **Nunca invente** nomes de namespace, labels, portas ou protocolos. Use apenas o que está nos parâmetros 2 e 3.
2. Se faltar alguma informação, **não chute**: escolha a alternativa mais restritiva possível e registre o item em "Pendências".
3. Em caso de conflito entre o manifesto permissivo e o padrão da Aegis, **o padrão da Aegis vence**.
4. Só permita um fluxo se ele existir no diagrama de contexto ou estiver explicitamente descrito nos parâmetros. Tudo que não for necessário deve ser negado.
5. O resultado precisa ser um YAML válido, aplicável com `kubectl apply`, sem comentários explicativos dentro do YAML (a explicação vai fora dele).

---

## COMO EXECUTAR (siga exatamente nesta ordem)

### Etapa 1 — Rascunho (v1)

Reescreva o manifesto permissivo seguindo o padrão da Aegis e as regras acima. Chame esse resultado de **v1**.

### Etapa 2 — Verificação (Chain-of-Verification)

1. Escreva uma **lista de perguntas de verificação** sobre a versão atual. Comece pelas perguntas abaixo e acrescente outras que o padrão da Aegis (parâmetro 2) exigir:
   - `policyTypes` declara explicitamente Ingress **e** Egress?
   - Existe algum seletor vazio (`{}`), `namespaceSelector` sem label, ou regra sem `from`/`to` que libere tudo?
   - Existe `ipBlock` com `0.0.0.0/0` ou faixa mais ampla do que o necessário?
   - Todas as origens e destinos usam **namespace + label de pod** combinados, conforme o parâmetro 3?
   - Todas as regras declaram **porta e protocolo** explícitos?
   - O egress de DNS está restrito ao serviço de DNS do cluster, e não liberado de forma ampla?
   - Cada fluxo permitido corresponde a um fluxo real do diagrama (Relay→Sentinel, Forge→Sentinel, Cerebro→Sentinel e os fluxos de saída do Sentinel descritos nos parâmetros)?
   - Algum fluxo legítimo foi bloqueado por engano, o que quebraria o produto?
   - Nome, namespace, labels e `podSelector` da policy seguem a convenção do padrão da Aegis?
2. **Responda cada pergunta individualmente**, olhando só para o YAML atual e para os parâmetros — não para o seu rascunho mental. Marque cada uma como **OK** ou **FALHA**, e na falha diga em qual linha/regra está o problema.

### Etapa 3 — Refino (Self-Refine)

1. Escreva uma **crítica curta** consolidando as FALHAs encontradas.
2. Gere a **próxima versão** do manifesto corrigindo todas elas, sem introduzir permissões novas que não tenham sido pedidas.

### Etapa 4 — Iteração

Repita Etapa 2 e Etapa 3 sobre a versão mais recente. **Pare quando** todas as perguntas forem OK **ou** quando completar **3 iterações**, o que vier primeiro. Nunca ultrapasse 3 iterações.

Se após a 3ª iteração ainda restarem FALHAs, entregue mesmo assim a melhor versão e liste as pendências de forma destacada.

---

## FORMATO DA RESPOSTA

Responda em português, exatamente nesta estrutura:

**1. NetworkPolicy final**
Um único bloco YAML, pronto para aplicar.

**2. O que mudou e por quê**
Tabela com as colunas: `Trecho original` | `Correção aplicada` | `Risco que isso elimina`.

**3. Histórico de verificação**
Para cada iteração (1 a 3): quantas perguntas OK / FALHA e um resumo de uma linha das falhas corrigidas.

**4. Pendências e premissas**
Lista do que ficou sem confirmação, do que foi assumido de forma restritiva e do que precisa ser validado com o time responsável antes do apply.

**Não exiba** as versões intermediárias completas do YAML — apenas o resultado final e os resumos acima.
