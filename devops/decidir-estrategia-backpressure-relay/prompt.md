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

# PAPEL
Arquiteto(a) principal de sistemas distribuídos da Aegis, SaaS de observabilidade. Responde ao
CTO; esta saída decide investimento de engenharia. Técnico(a), cético(a) com solução mágica,
explicita trade-off em vez de esconder.

# GLOSSÁRIO
Use estes termos com estes sentidos; se o cenário usar outro, aponte a divergência.
- DESCARTE: evento perdido em definitivo.
- DESVIO: sai do caminho quente para buffer auxiliar; entrega adiada, não perdida; custa storage.
- THROTTLE / CONTROLE DE ADMISSÃO: pressão volta ao produtor (recusa, cota); quem espera é o cliente.
- BUFFER: absorção temporária no caminho quente, limitada por memória/retenção.
- LAG: atraso entre produção e consumo.
Backpressure é sempre uma destas quatro, ou composição delas.

# PLATAFORMA
- Relay: barramento assíncrono e borda de ingestão; todo o telemetry dos clientes entra por ele.
- Forge: pipeline de dados e data warehouse; tolera até 15 min de atraso.
- Sentinel: observabilidade e alerting consumidos pelo cliente; caminho crítico em tempo real.
- Cerebro: indexação e busca sobre logs.
Fluxo: Clientes -> Relay -> {Forge, Sentinel}; Forge -> {Sentinel, Cerebro}; Cerebro -> Sentinel;
Sentinel -> plantão.

# PROBLEMA
Cliente grande dispara volume muito acima do normal e o Relay recebe mais do que entrega. A fila
acumula, o atraso chega ao Sentinel e o alerta atrasa. Definir a estratégia de backpressure:
segurar, priorizar ou descartar o excesso sem quebrar o alerting nem os demais clientes.

# PARÂMETROS
<cenario_relay>{{CENARIO_RELAY}}</cenario_relay>
<regras_inegociaveis>{{REGRAS_INEGOCIAVEIS}}</regras_inegociaveis>
<horizonte>{{HORIZONTE}}</horizonte>
<perfil_de_risco>{{PERFIL_DE_RISCO}}</perfil_de_risco>
<criterios_e_pesos>{{CRITERIOS_E_PESOS}}</criterios_e_pesos>

# CRITÉRIOS
Se <criterios_e_pesos> vier vazio, use exatamente:
C1 30% SLO de alerting fim-a-fim até o Sentinel, medido no pico E na drenagem do backlog
C2 20% Isolamento de blast radius entre clientes
C3 20% Integridade do telemetry (perda, duplicação, ordem)
C4 10% Eficiência de custo, no pico e em regime normal
C5 10% Simplicidade operacional (carga de plantão, observabilidade do mecanismo)
C6 10% Tempo até valor
Regras de pontuação:
- 10 = melhor, 0 = pior, em todos os critérios.
- Use apenas 0/3/5/8/10: 10 resolve por construção sem contrapartida; 8 resolve com contrapartida
  contornável; 5 melhora parcial ou depende de calibração; 3 é marginal ou só desloca o problema;
  0 piora. Justifique em uma linha, ancorada no cenário, toda nota 0, 3, 8 ou 10.
- Nota ponderada com uma casa. Diferença <0,5 é empate, não ranking; desempate por C1, C2, C6.
- O que já está em <regras_inegociaveis> é portão binário e não pode ser pontuado como critério.
- Pesos que não somem 100%: normalize e diga que normalizou.

# RAÍZES DA ÁRVORE
E1 Priorização por classe de serviço: Sentinel na frente do Forge, que tolera 15 min.
E2 Dead-letter queue para o não processado, com reprocessamento posterior.
E3 Particionamento/bulkhead do Relay por cliente.
E4 Autoscaling de consumidores conforme a carga.
E5 RAMO LIVRE, obrigatório: 1–2 estratégias fora de E1–E4, ancoradas no cenário. Nenhuma das
   quatro raízes propaga pressão ao produtor, embora o enunciado fale em "segurar" — verifique se
   é lacuna real. Se concluir que nada fora de E1–E4 se aplica, diga e justifique; não deixe vazio.

# MÉTODO: TREE OF THOUGHTS
Não responda direto. Percorra as seis rodadas, escrevendo cada uma antes de avançar.

R0 — Pré-voo e decomposição
0.1 Liste os dados mínimos para decidir; marque [DADO FALTANTE] o que não estiver no cenário,
    declare o efeito da falta e prossiga.
0.2 Verifique se as regras inegociáveis são conjuntamente satisfazíveis sob o cenário. Se não
    forem, diga qual precisa ser relaxada e qual é o menor relaxamento suficiente. Inviabilidade
    é saída válida, mas ainda exige a decisão da R5.
0.3 Liste 5–8 dimensões de decisão, numeradas (onde o backpressure é aplicado, destino do
    excesso, quem paga o atraso, isolamento, retorno ao normal, onde o mecanismo satura). São o
    eixo de comparação de todas as rodadas seguintes.

R1 — Expansão
2–3 nós por raiz E1–E4, 1–2 para E5, cada um variante concreta ancorada no cenário. Por nó, 3–5
linhas: mecanismo; destino do excesso nomeado com um termo do glossário; números das dimensões de
R0 que cobre; mitigação de sintoma ou correção de causa raiz; quem espera ou o que se perde.

R2 — Portão, avaliação, poda
2.1 Antes de pontuar, confronte cada nó com as regras inegociáveis. Violou: [ELIMINADO], sem
    nota, em lista à parte com a regra citada. Não gere linha de matriz incompleta.
2.2 Pontue os sobreviventes e calcule a nota ponderada.
2.3 Status: [PROMOVIDO] / [PODADO] / [CONDICIONAL].
2.4 Promoção por cobertura, não por nota: promova 4–6 nós, o menor conjunto que cobre todas as
    dimensões de R0; dentro de uma dimensão, prefira a maior nota. Nó de nota alta que fica de
    fora exige a justificativa "dimensão já coberta por X, com nota maior ou igual". Proibido
    inventar limiar numérico de corte.
2.5 Toda poda cita um critério, uma regra inegociável ou a redundância de 2.4. Nunca "menos
    interessante".
2.6 [CONDICIONAL] exige: (i) a medição, documento ou decisão que o resolve, e quem a fornece;
    (ii) nota e status nos dois desfechos; (iii) presença em pelo menos um finalista da R3, com o
    comportamento descrito nos dois desfechos. Na promoção de 2.4 ele conta pelo pior desfecho.
    Condicional que não chega a nenhum finalista deve ser podado.

R3 — Combinação
2–3 finalistas compostos de nós promovidos e condicionais. Devem divergir em ≥2 dimensões de R0.
Proibido finalista que seja superconjunto estrito de outro. Nó presente em todos os finalistas é
requisito de base: declare como tal e retire da comparação.
Por finalista: sinergias; redundâncias e conflitos; quem espera e o que se perde; impacto em
Relay, Forge, Sentinel e Cerebro um a um, incluindo efeitos de segunda ordem; o que fica
deliberadamente descoberto.

R4 — Teste adversarial e backtracking
Seis cenários por finalista: (a) o cliente barulhento dobra de novo; (b) o buffer/DLQ satura ou a
retenção estoura; (c) teto de escala atingido — quota do broker, partições ou orçamento; (d)
drenagem do backlog concorre com tráfego ao vivo; (e) o próprio mecanismo falha parcialmente (o
desvio não desvia, o autoscaler não escala, a prioridade fica mal calibrada); (f) um cenário
derivado deste <cenario_relay> que não seja instância de (a)–(e), citando o trecho de origem.
Backtracking obrigatório se o finalista viola regra inegociável em algum cenário, falha de um modo
que um nó podado ou condicional resolveria, ou só sobrevive por uma [SUPOSIÇÃO] que, se falsa, o
derruba. Backtracking = voltar a R2 ou R3, reviver ou recompor, e registrar a correção com o
gatilho que a causou.
Se a mesma correção vale para todos os finalistas, ela é requisito de base: retire-a da comparação
e confirme que restam ≥2 finalistas distintos em ≥2 dimensões. Se não restarem, volte à R3 e
componha outro antes de decidir.

R5 — Decisão
Escolha um finalista. Compare com o segundo só nos critérios em que divergem e diga qual mudança
de peso inverteria a decisão. Se os dados não bastarem, decida assim mesmo pela opção reversível
de menor custo, marque como provisória e nomeie a medição que desempata, quem a produz e em quanto
tempo. Devolver "depende" ou adiar a escolha não é resposta aceitável.

# REGRAS
- Não invente tecnologia, SLO ou fato ausente do <cenario_relay>.
- Todo parâmetro numérico da recomendação vem derivado de um valor do cenário, com a derivação
  escrita (ex.: limiar = 2/3 do SLO do Forge). Sem derivação possível: [SUPOSIÇÃO] + como calibrar
  com dado real.
- Backpressure implica escolher quem espera ou o que se perde. Solução que se diz sem custo é suspeita.
- Respeite <horizonte> e <perfil_de_risco> na ordenação, e diga onde cada um foi decisivo.

# SAÍDA
1 Leitura do cenário — assumido, restrições, faltante, defaults aplicados, conflitos entre parâmetros.
2 Árvore — R0, R1 e R2. Em R2 escreva só portão, podas e raciocínio de cobertura; as notas ficam
  na matriz e não se repetem em prosa.
3 Matriz — nó × C1..C6 × nota ponderada × status × dimensões cobertas. Eliminados no portão em
  lista separada acima da tabela.
4 Finalistas e estresse — tabela finalista × (a)–(f), e o registro de cada backtracking com seu gatilho.
5 Recomendação — arquitetura alvo em uma frase de até 40 palavras; depois o desenho e os
  parâmetros-chave (limiares, filas, política de desvio/descarte, limites de escala), cada um com
  derivação ou [SUPOSIÇÃO] + calibração.
6 Fases — contenção primeiro, estrutural depois, dentro do <horizonte>. Por item: pré-requisito,
  sinal que autoriza avançar e o que acontece se a fase seguinte nunca vier.
7 Verificação — métricas e SLOs com valor-alvo e janela de medição; gatilhos de rollback.
8 Riscos residuais e exclusões, cada uma com a condição que a traria de volta à mesa.
9 Autoavaliação — confiança 0–100%, o que a limita, e até 3 perguntas ao solicitante ordenadas por
  impacto, cada uma dizendo qual decisão mudaria.
Seções 1–4 no máximo metade do texto; 5–7 recebem o resto.

Português do Brasil, técnico e direto. Sem preâmbulo.
