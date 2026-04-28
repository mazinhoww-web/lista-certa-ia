# RIPD — Relatório de Impacto à Proteção de Dados Pessoais

**Plataforma:** ListaCerta
**Versão do documento:** 1.0 (MVP)
**Data:** abril de 2026
**Próxima revisão:** outubro de 2026

> Documento elaborado em conformidade com o Art. 5º, XVII e Art. 38 da Lei nº 13.709/2018 (LGPD). O RIPD é obrigatório para tratamentos que possam gerar risco às liberdades civis e direitos fundamentais — e tratamento de dados de menores se enquadra explicitamente nessa hipótese (Art. 14).

---

## 1. Identificação do controlador

- **Nome:** ListaCerta — [Razão Social]
- **CNPJ:** [a preencher]
- **Endereço:** Cuiabá, Mato Grosso, Brasil
- **DPO:** dpo@listacertaescolar.com.br
- **Contato geral:** contato@listacertaescolar.com.br

---

## 2. Finalidade e necessidade do tratamento

### 2.1 Finalidade

A ListaCerta intermedia o ciclo de volta às aulas no Brasil, permitindo que escolas publiquem listas oficiais de material e responsáveis encontrem essas listas, recebam carrinhos otimizados gerados por IA em múltiplos varejistas e tenham clareza sobre conformidade Procon.

### 2.2 Necessidade

A coleta e processamento de dados são **estritamente necessários** para:

1. Vincular um responsável a uma escola e à série/turma do filho (sem isso, não há lista a exibir).
2. Permitir que a IA leia listas digitalizadas (PDF/foto) e proponha SKUs em varejistas.
3. Validar se itens de lista violam a Lei nº 12.886/2013 (Procon).

A plataforma adota o princípio da **minimização** (LGPD Art. 6º, III): coleta apenas o necessário e não mais.

---

## 3. Mapeamento dos dados tratados

| Dado | Categoria | Origem | Base legal | Operador |
|---|---|---|---|---|
| Nome do responsável | Identificação | Cadastro Google Auth | Consentimento + execução de contrato | Lovable Cloud |
| E-mail do responsável | Identificação | Cadastro Google Auth | Consentimento + execução de contrato | Lovable Cloud, Resend |
| Telefone (opcional) | Identificação | Preenchido pelo usuário | Consentimento | Lovable Cloud |
| CEP do responsável | Localização | Preenchido pelo usuário | Consentimento | Lovable Cloud |
| Nome do aluno (apenas primeiro nome) | **Dado de menor** | Preenchido pelo responsável | **Consentimento parental específico (Art. 14)** | Lovable Cloud |
| Série/turma do aluno | **Dado de menor** | Preenchido pelo responsável | Consentimento parental específico | Lovable Cloud |
| Escola do aluno | **Dado de menor** | Preenchido pelo responsável | Consentimento parental específico | Lovable Cloud |
| Listas oficiais (sem identificação do aluno) | Dado de escola | Publicado pela escola | Legítimo interesse + execução de contrato | Lovable Cloud |
| Imagem/PDF de lista enviado | Conteúdo | Upload do usuário ou WhatsApp | Consentimento | Lovable Cloud Storage, Google AI Studio (processamento transitório) |
| Logs técnicos (IP, navegador) | Técnico | Automático | Legítimo interesse (segurança) | Lovable Cloud, Sentry |
| Eventos de uso pseudonimizados | Técnico | Automático | Legítimo interesse (melhoria) | PostHog |

---

## 4. Avaliação de riscos

### 4.1 Riscos identificados

| ID | Risco | Probabilidade | Impacto | Severidade |
|---|---|---|---|---|
| R-01 | Vazamento de dados de menor (nome+escola) | Baixa | Alto | **Alto** |
| R-02 | Acesso não autorizado de terceiros à conta do responsável | Média | Alto | **Alto** |
| R-03 | Uso indevido pelo Google AI Studio (Gemini) de imagens enviadas | Baixa | Médio | Médio |
| R-04 | Perfilamento publicitário de menores | Muito baixa | Alto | Médio |
| R-05 | Erro de matching SKU sugerindo produto inadequado | Média | Baixo | Baixo |
| R-06 | Conteúdo de lista contendo dado sensível inadvertido (foto de criança em PDF da lista) | Baixa | Alto | **Alto** |
| R-07 | Indisponibilidade do serviço durante temporada de pico | Média | Médio | Médio |

### 4.2 Medidas de mitigação

| Risco | Mitigação |
|---|---|
| R-01 | Criptografia AES-256 em repouso; TLS 1.3 em trânsito; RLS no Postgres isolando dados por `tenant_id`; auditoria de acesso a tabela `students`. |
| R-02 | Auth via Google OAuth (sem senha custodiada); sessão com expiração; alerta em login de novo dispositivo. |
| R-03 | Configuração Gemini para não usar dados em treinamento (quando a chave do projeto é própria do controlador, conforme T&C do Google AI Studio); imagens excluídas após processamento; somente metadata estruturada persistida. |
| R-04 | Plataforma **não exibe publicidade direcionada a menores**. Retail media, quando ativa, é segmentada por região/categoria, nunca por aluno individual. |
| R-05 | Sugestões da IA apresentadas como "sugestão", não como prescrição; responsável sempre confirma antes do redirecionamento. Especificações técnicas (gramatura, dimensão) explícitas. |
| R-06 | Aviso pré-upload: "não envie fotos que mostrem rostos de crianças"; pipeline de moderação assistida por IA detecta rostos e bloqueia o upload se identificados; equipe de curadoria orientada a remover qualquer dado pessoal incidental. |
| R-07 | Lovable Cloud com SLA Supabase; rate limiting; observabilidade Sentry; plano de incidente documentado. |

---

## 5. Direitos dos titulares (Art. 18 LGPD)

A plataforma implementa, no MVP, os seguintes mecanismos:

| Direito | Implementação no MVP |
|---|---|
| Acesso aos dados | Página "Minha conta" com download em JSON |
| Correção | Edição inline em "Minha conta" |
| Eliminação | Botão "Excluir minha conta" com confirmação dupla; exclusão lógica imediata + exclusão física em 30 dias |
| Portabilidade | Export em JSON |
| Revogação de consentimento | Toggle por finalidade em "Minha conta" |
| Consulta sobre compartilhamento | Lista de operadores nesta política, atualizada |

Resposta a requisições por e-mail (`dpo@listacertaescolar.com.br`) em até **15 dias corridos**.

---

## 6. Ciclo de vida dos dados

```
Coleta → Validação → Armazenamento → Uso → Retenção → Eliminação
```

| Fase | Descrição |
|---|---|
| Coleta | Apenas o estritamente necessário. Imagens enviadas para IA são processadas em memória e estruturadas em JSON; o blob original é mantido por 30 dias para auditoria e depois excluído. |
| Validação | Validador automático bloqueia upload de listas com indícios de dado sensível incidental (foto de criança). |
| Armazenamento | Postgres com RLS por tenant; Storage com chaves geradas por usuário. |
| Uso | Estritamente conforme finalidade declarada. |
| Retenção | Conforme tabela na seção 6 da Política de Privacidade. |
| Eliminação | Automática (jobs scheduled) ou por solicitação do titular. |

---

## 7. Transferência internacional (Art. 33 LGPD)

Operadores localizados fora do Brasil:

- **Lovable Cloud (Supabase):** EUA. Salvaguarda contratual via cláusulas padrão e DPA.
- **Google AI Studio (Gemini):** EUA. Salvaguarda contratual via T&C do Google AI; configuração de não-treino.
- **Resend (e-mail):** EUA. Salvaguarda contratual.
- **PostHog (analytics):** UE/EUA. Pseudonimização aplicada.
- **Sentry:** EUA. Captura apenas erros técnicos, sem PII no payload.

**Dados de menores não são transferidos** para jurisdições sem salvaguardas. As salvaguardas adotadas correspondem ao previsto no Art. 33, II da LGPD (cláusulas padrão contratuais).

---

## 8. Plano de resposta a incidentes

Em caso de incidente de segurança envolvendo dados pessoais:

1. **Detecção:** monitoramento Sentry + alertas Supabase + revisão semanal de logs.
2. **Contenção:** isolamento da causa em até 4h após detecção.
3. **Avaliação de impacto:** classificação do incidente (alto/médio/baixo) em até 24h.
4. **Comunicação à ANPD:** notificação em até 72h se houver risco relevante a direitos dos titulares (Art. 48 LGPD).
5. **Comunicação aos titulares:** se o incidente atingir seus direitos, comunicação direta no mesmo prazo.
6. **Pós-incidente:** RCA documentado e medidas corretivas aplicadas em até 30 dias.

---

## 9. Reavaliação

Este RIPD será **reavaliado a cada 6 meses** ou imediatamente em caso de:

- Inclusão de nova categoria de dado pessoal.
- Mudança de finalidade do tratamento.
- Novo operador ou nova transferência internacional.
- Alteração relevante na arquitetura técnica.
- Incidente de segurança relevante.

---

## 10. Aprovações

| Responsável | Função | Data |
|---|---|---|
| [Nome] | DPO | abril/2026 |
| [Nome] | Diretor(a) de Produto | abril/2026 |
| [Nome] | Diretor(a) Jurídico ou consultor LGPD | abril/2026 |

---

> Este RIPD é documento interno de governança e demonstra a postura proativa da ListaCerta em proteção de dados, especialmente de menores. Disponível para autoridades competentes mediante requisição.
