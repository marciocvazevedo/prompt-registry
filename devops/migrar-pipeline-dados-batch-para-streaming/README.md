---
nome: Migrar Pipeline de Dados de Batch para Streaming
descricao: Cadeia de 11 prompts Least-to-Most (1 de decomposição + 10 de execução, um por etapa) para planejar e executar a migração de um pipeline de dados de processamento em lote para event-driven, do inventário inicial ao cutover incremental e desligamento do batch.
versao: 1.0.0
tags: [migracao, pipeline-de-dados, streaming, engenharia-de-dados, sre]
inputs:
  - nome: SISTEMA
    descricao: Sistema sendo migrado.
  - nome: FONTE_EVENTOS
    descricao: De onde vêm os eventos consumidos pelo sistema.
  - nome: DW
    descricao: Destino de escrita (data warehouse) das transformações.
  - nome: CONSUMIDORES
    descricao: Sistemas e relatórios downstream que quebram se o sistema mudar.
  - nome: JANELA_ATUAL
    descricao: Intervalo do cron atual de ingestão em lote.
  - nome: DURACAO_JOB
    descricao: Duração média do lote atual.
  - nome: N_ETAPAS
    descricao: Número de etapas encadeadas de transformação no pipeline atual.
  - nome: ENGINE
    descricao: Motor de processamento usado nas transformações.
  - nome: PARTICIONAMENTO
    descricao: Particionamento atual das tabelas de destino.
  - nome: LATENCIA_ALVO
    descricao: Meta de frescor (latência-alvo) do novo pipeline em streaming.
  - nome: TAMANHO_MICRO_LOTE
    descricao: Bloco de processamento (janela) do novo modelo em streaming.
  - nome: AMBIENTE
    descricao: Ambientes disponíveis para testar e promover a migração.
  - nome: JANELA_DUAL_RUN
    descricao: Tempo rodando o pipeline em lote e em streaming em paralelo antes do cutover.
  - nome: FATIA_CUTOVER
    descricao: Unidade de virada incremental usada no cutover (ex.: por tenant).
  - nome: TOLERANCIA_DIVERGENCIA
    descricao: Divergência aceita entre a saída do pipeline em lote e em streaming.
  - nome: FORMATO_SAIDA
    descricao: Formato exigido nas respostas de cada prompt da cadeia.
---

# Migrar Pipeline de Dados de Batch para Streaming

## Objetivo

Conduzir, por meio de uma cadeia de prompts Least-to-Most (1 prompt de decomposição + 10 prompts de execução, um por etapa), o planejamento detalhado da migração de um pipeline de dados de processamento em lote (cron + engine batch) para processamento contínuo em streaming — do inventário inicial ao cutover incremental e desligamento do batch.

## Quando usar

- Ao planejar a migração de um pipeline de ingestão/transformação de dados de batch para streaming, sem big-bang.
- Quando é preciso quebrar uma migração grande em etapas independentes e encadeadas, cada uma resolvida como um procedimento técnico executável — não "considerações gerais".
- Quando múltiplos sistemas downstream dependem do pipeline e precisam continuar funcionando durante toda a transição.
- Em contextos didáticos, para demonstrar a técnica Least-to-Most aplicada a uma migração de arquitetura de dados real.

## Exemplo de uso

Como operar a cadeia (adaptado da Seção 1 do material original):

1. Preencher a tabela de parâmetros uma única vez (os valores-padrão já vêm preenchidos com o cenário fictício da Aegis/Forge — ajustar o que mudar).
2. Colar o Bloco de Contexto Base no início de todo prompt da cadeia — ele é sempre o mesmo.
3. Rodar o Prompt 0 (decomposição) e guardar a resposta como a lista oficial de etapas.
4. Rodar os Prompts 1 a 10, um de cada vez, na ordem.
5. Antes de rodar o prompt de uma etapa, colar junto as respostas das etapas das quais ela depende — sem isso a resposta sai genérica.
6. Guardar cada resposta em um arquivo próprio (ex.: `E04-transformacoes.md`); elas viram insumo dos prompts seguintes.

Grafo de dependências entre as etapas:

```mermaid
flowchart LR
    E1["E1<br/>Inventário e baseline"] --> E2["E2<br/>Metas e SLOs"]
    E1 --> E3["E3<br/>Contrato de consumo<br/>do Relay"]
    E2 --> E3
    E2 --> E4["E4<br/>Redesenho das<br/>14 transformações"]
    E3 --> E4
    E4 --> E5["E5<br/>Escrita incremental<br/>no DW"]
    E5 --> E6["E6<br/>Compatibilidade<br/>com consumidores"]
    E2 --> E6
    E3 --> E7["E7<br/>Falhas, replay<br/>e backfill"]
    E5 --> E7
    E4 --> E8["E8<br/>Observabilidade<br/>e alerting"]
    E5 --> E8
    E7 --> E8
    E2 --> E8
    E5 --> E9["E9<br/>Dual-run e<br/>reconciliação"]
    E6 --> E9
    E8 --> E9
    E9 --> E10["E10<br/>Cutover incremental<br/>e desligamento"]
    E7 --> E10
```

Checklist de execução:

- [ ] Parâmetros preenchidos
- [ ] Prompt 0 rodado e decomposição aprovada pelo time
- [ ] E1 Inventário e baseline
- [ ] E2 Metas, SLOs e critérios de equivalência
- [ ] E3 Contrato de consumo do Relay
- [ ] E4 Redesenho das transformações
- [ ] E5 Escrita incremental no DW
- [ ] E6 Camada de compatibilidade
- [ ] E7 Falhas, replay e backfill
- [ ] E8 Observabilidade e alerting
- [ ] E9 Dual-run e reconciliação
- [ ] E10 Cutover incremental e desligamento do batch

## Limitações conhecidas

Cadeia manual: é preciso rodar um prompt por vez, colar as respostas das etapas dependentes antes de cada novo prompt e guardar cada resposta em arquivo próprio — sem isso, segundo o próprio material, a resposta "sai genérica". Os valores-padrão da tabela de parâmetros já assumem o cenário fictício da Aegis/Forge (Relay, Forge, Sentinel, Cerebro); usos fora desse cenário exigem substituir todos os `{{...}}` pelos dados reais.
