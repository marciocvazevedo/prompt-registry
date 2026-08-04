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

# Corrigir NetworkPolicy Kubernetes Permissiva

## Objetivo

Corrigir um manifesto de NetworkPolicy do Kubernetes vetado por segurança/compliance por ser permissivo demais, produzindo uma versão mínima e auditável através de um ciclo de rascunho, verificação (Chain-of-Verification) e refino (Self-Refine) em até 3 iterações, alinhada a um padrão de referência da organização.

## Quando usar

- Quando um manifesto de NetworkPolicy foi rejeitado em revisão de segurança por conceder acesso mais amplo do que o necessário.
- Ao padronizar as regras de rede de um serviço conforme um padrão de referência já adotado pela organização.
- Quando é preciso uma trilha auditável de verificação (perguntas OK/FALHA por iteração), não apenas o YAML final.
- Em contextos didáticos, para demonstrar Chain-of-Verification + Self-Refine aplicados à correção de um artefato de infraestrutura real.

## Exemplo de uso

_A preencher_

## Limitações conhecidas

O prompt nunca inventa nomes de namespace, label, porta ou protocolo — usa apenas o que vier nos parâmetros; se faltar informação, escolhe a alternativa mais restritiva e registra como pendência, em vez de arriscar. O ciclo de verificação/refino para em até 3 iterações mesmo que restem falhas — nesse caso, entrega a melhor versão e destaca as pendências, exigindo validação humana antes do `kubectl apply`.
