# BACKLOG.md

> 16 issues prontas para abrir no GitHub do ListaCerta. Cada uma foi pensada como **uma branch + um PR + uma sessão do Claude Code**. Tamanho intencionalmente médio: pequeno demais aumenta overhead, grande demais aumenta risco de revisão.

## Convenções

- **ID:** `LC-XXX` (sequencial).
- **Prefixo de branch:** `feat/lc-XXX-slug-curto` ou `fix/lc-XXX-slug`.
- **Convenção de commit:** Conventional Commits. `feat(scope): mensagem`, `fix(scope):`, `chore(scope):`.
- **Tamanho estimado:** S (≤2h), M (2-6h), L (1 dia inteiro).
- **Labels GitHub:** `area/frontend`, `area/backend`, `area/db`, `area/edge-function`, `area/auth`, `area/ai`, `priority/p0`, `priority/p1`, `priority/p2`.

## Sprints (sequência sugerida)

```
Sprint 1 — Fundação Auth & Schools          → LC-001 a LC-004
Sprint 2 — Listas & Procon                   → LC-005 a LC-008
Sprint 3 — Jornada do pai                    → LC-009 a LC-013
Sprint 4 — Admin, observabilidade, polimento → LC-014 a LC-016
```

---

## Sprint 1 — Fundação Auth & Schools

### LC-001 · Setup Supabase client + Google OAuth + AuthContext
**Labels:** `area/auth`, `area/frontend`, `priority/p0` · **Estimate:** M · **Depends:** —

**Contexto:** A landing já existe com botão "Continuar com Google" placeholder. Esta issue conecta de fato.

**Acceptance Criteria:**
- [ ] Rodar `schema.sql` no SQL Editor do Lovable Cloud (cria todas as tabelas, triggers, RLS, RPC).
- [ ] Importar `lista_escolas_com_cep.csv` na tabela `inep_schools` via Edge Function paginada — passo a passo em `IMPORT-INEP-SCHOOLS.md` (Opção A: bucket `listaescolasinep` + função `import-inep-schools` + script de invocação no console).
- [ ] Validar import: `SELECT COUNT(*) FROM inep_schools WHERE uf='MT'` retorna >4000 linhas.
- [ ] Configurar provider Google OAuth no Supabase (Site URL e Redirect URLs).
- [ ] Criar `src/lib/supabase.ts` exportando o client tipado com `Database` (gerado via `supabase gen types`).
- [ ] Criar `src/contexts/AuthContext.tsx` com `useAuth()` retornando `{ user, profile, role, loading, signOut }`.
- [ ] Criar página `/auth/callback` que processa o redirect e roteia por role: `parent → /pais`, `school_admin → /escola/:firstSchoolId/dashboard`, `platform_admin → /admin`.
- [ ] `<ProtectedRoute requireRole? />` em `src/components/shared/ProtectedRoute.tsx`. Sem login → `/login`. Role insuficiente → página 403 amigável.
- [ ] Smoke test: login completo via Google funciona, profile é criado automaticamente pelo trigger `on_auth_user_created`, redirecionamento por role funciona.

**Files:**
- `src/lib/supabase.ts`, `src/types/database.ts` (gerado), `src/contexts/AuthContext.tsx`, `src/hooks/useAuth.ts`, `src/components/shared/ProtectedRoute.tsx`, `src/pages/AuthCallbackPage.tsx`, `src/pages/ForbiddenPage.tsx`.

**Notas:** O trigger `on_auth_user_created` em `schema.sql` cria automaticamente um registro em `profiles` com `role='parent'` quando um novo `auth.users` é criado.

---

### LC-002 · Cadastro de escola (busca INEP + form CEP)
**Labels:** `area/frontend`, `area/db`, `priority/p0` · **Estimate:** L · **Depends:** LC-001

**Contexto:** Qualquer usuário logado pode cadastrar uma escola. Ela entra como `pending_approval` e o time aprova depois.

**Acceptance Criteria:**
- [ ] Rota `/escola/cadastrar` (autenticada, qualquer role).
- [ ] Wizard 2 steps com indicador de progresso lc-blue.
- [ ] **Step 1 — Busca INEP:**
  - [ ] Search input com debounce 250ms, min 3 chars.
  - [ ] Chama RPC `search_inep_schools(q, 'MT', 10)` — já existe no schema.
  - [ ] Resultados em cards com `trade_name` (700) + `city/UF` mid + chip INEP.
  - [ ] Botão "Não encontrei minha escola — cadastrar do zero".
- [ ] **Step 2 — Form:**
  - [ ] Campos: `trade_name`*, `legal_name`, `cnpj` (mask), `cep`*, `city` (default Cuiabá), `state` (default MT), `neighborhood`, `address`, `phone`, `email`, `website`, `inep_code` (read-only se veio do step 1).
  - [ ] Validação com `zod` + `react-hook-form`. CNPJ via lib (sugestão: `cpf-cnpj-validator`). CEP exatamente 8 dígitos.
  - [ ] Auto-fill ao sair do CEP usando `cep-promise` (`npm install cep-promise`). Em caso de erro, toast "CEP não encontrado, preencha manualmente."
  - [ ] Box informativa azul: "Sua escola será publicada após aprovação do nosso time. Você recebe um email quando estiver liberada (em até 24h)."
- [ ] Ao submeter:
  - [ ] INSERT `schools` com `status='pending_approval'`, `created_by=auth.uid()`.
  - [ ] INSERT `school_admins` vinculando user à school com `role='admin'`.
  - [ ] UPDATE `profiles` SET `role='school_admin'` (se ainda for `parent`).
  - [ ] Redirect para `/escola/:id/aguardando`.

**Files:**
- `src/pages/SchoolRegistrationPage.tsx`, `src/components/school/InepSearchStep.tsx`, `src/components/school/SchoolFormStep.tsx`, `src/lib/cep.ts` (wrapper de cep-promise), `src/lib/validators.ts` (schemas zod).

---

### LC-003 · Página "Aguardando aprovação" + Dashboard escola básico
**Labels:** `area/frontend`, `priority/p1` · **Estimate:** M · **Depends:** LC-002

**Acceptance Criteria:**
- [ ] Rota `/escola/:id/aguardando` (somente para usuários com vínculo na `school_admins` daquela escola).
- [ ] Card centralizado com ícone `CircleDashed` mid, badge "Aguardando aprovação", H1 800 "A gente está validando sua escola.", texto explicativo.
- [ ] CTA secundário "Editar dados" → `/escola/:id/editar` (criar form de edição reutilizando `<SchoolFormStep />`).
- [ ] Botão WhatsApp verde com link `wa.me/5565996076018?text=Oi%2C+sou+da+escola+{trade_name}+%28ID+{id}%29`.
- [ ] Rota `/escola/:id/dashboard` (somente school_admin daquela escola ou platform_admin):
  - [ ] Sidebar md+ com items: Dashboard, Listas, Pais cadastrados, Comunicados, Configurações.
  - [ ] Bottom-nav mobile.
  - [ ] Header: nome da escola peso 800, chip de status (pending_approval coral / approved emerald).
  - [ ] Card "Status" mostrando o estado atual.
  - [ ] Card "Próximo passo" condicional: se approved → "Publicar primeira lista" → /escola/:id/listas/nova; se pending → "Aguardando nosso ok"; se rejected → motivo + botão suporte.

**Files:**
- `src/pages/SchoolWaitingPage.tsx`, `src/pages/SchoolDashboardPage.tsx`, `src/components/school/SchoolSidebar.tsx`, `src/components/school/StatusCard.tsx`.

---

### LC-004 · Painel admin de aprovação + Edge Function notify-school-approved
**Labels:** `area/frontend`, `area/edge-function`, `priority/p0` · **Estimate:** M · **Depends:** LC-003

**Acceptance Criteria:**
- [ ] Rota `/admin/escolas` (somente `platform_admin`, ProtectedRoute aplicada).
- [ ] Tabela paginada (10 por página) com filtro por status (default: `pending_approval`).
- [ ] Colunas: trade_name, city, neighborhood, created_by_email, created_at, ações.
- [ ] Ações inline: "Aprovar" (botão verde), "Rejeitar" (modal pedindo motivo).
- [ ] Aprovar: UPDATE `schools` SET status='approved', approved_by, approved_at + invoke `notify-school-approved` Edge Function.
- [ ] Rejeitar: UPDATE `schools` SET status='rejected', rejected_reason + invoke email com motivo.
- [ ] **Edge Function `notify-school-approved`** em `/supabase/functions/notify-school-approved/index.ts`:
  - Input: `{ school_id }`.
  - Busca escola + email do `created_by` (via JOIN com `profiles` + `auth.users`).
  - Envia email via Resend (`RESEND_API_KEY` do env). Template HTML brand-aware: header com logo C-Tick, título "Sua escola foi aprovada", CTA "Publicar primeira lista" linkando para `/escola/:id/listas/nova`.
  - Retorna `{ success: boolean, message_id?: string }`.
- [ ] Logging: invoke da função registra em `events` (tabela criada na LC-014, mas adicionar TODO para evolução).
- [ ] Smoke test: aprovar uma escola dispara email real no Resend (testar com email pessoal antes).

**Files:**
- `src/pages/admin/AdminSchoolsPage.tsx`, `src/components/admin/SchoolApprovalRow.tsx`, `src/components/admin/RejectModal.tsx`, `supabase/functions/notify-school-approved/index.ts`, `supabase/functions/_shared/email-templates.ts`.

---

## Sprint 2 — Listas & Procon

### LC-005 · Edge Function parse-list (Gemini OCR)
**Labels:** `area/edge-function`, `area/ai`, `priority/p0` · **Estimate:** M · **Depends:** LC-004

**Contexto:** Recebe um arquivo (PDF/imagem) de lista escolar e devolve JSON estruturado dos itens.

**Acceptance Criteria:**
- [ ] Edge Function em `/supabase/functions/parse-list/index.ts` (Deno).
- [ ] Input: `{ fileUrl: string, listId: string }`.
- [ ] Output: `{ items: Array<{ name, specification, quantity, unit, notes, position }>, raw_response: string }`.
- [ ] Lógica:
  - [ ] Baixa o arquivo do Storage.
  - [ ] Converte para base64 inline. PDF → renderiza primeira página como imagem (usar `pdfjs-serverless` ou enviar PDF direto se Gemini suportar inline_data PDF).
  - [ ] Chama Gemini 2.0 Flash via API direta `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={GOOGLE_AI_KEY}`.
  - [ ] System prompt: "Você é um extrator de listas escolares brasileiras. Extraia TODOS os itens. Para cada item identifique: name, specification, quantity (default 1), unit, notes, position. Retorne APENAS JSON válido { items: [...] }. Sem markdown, sem comentários."
  - [ ] Parse seguro do JSON (try/catch, fallback graceful).
  - [ ] INSERT em `list_items` para `list_id`.
- [ ] Tratamento de erro:
  - [ ] Quota Gemini estourada → retorna 429 com mensagem amigável.
  - [ ] Imagem ilegível → retorna 422 com sugestão "tire foto com mais luz".
  - [ ] Timeout > 60s → cancel.
- [ ] Smoke test: enviar foto real de lista escolar de Cuiabá → recupera ≥80% dos itens com nome legível.

**Files:**
- `supabase/functions/parse-list/index.ts`, `supabase/functions/_shared/gemini.ts` (cliente reusável), `supabase/functions/_shared/types.ts`.

---

### LC-006 · Edge Function validate-procon
**Labels:** `area/edge-function`, `area/ai`, `priority/p0` · **Estimate:** M · **Depends:** LC-005

**Contexto:** Classifica cada item de uma lista contra a Lei 12.886/2013.

**Acceptance Criteria:**
- [ ] Edge Function em `/supabase/functions/validate-procon/index.ts`.
- [ ] Input: `{ listId: string }`.
- [ ] Output: `{ severity: 'compliant'|'warning'|'violation', items: Array<{ list_item_id, status, reason }> }`.
- [ ] Lógica:
  - [ ] Busca todos `list_items` da lista.
  - [ ] Chama Gemini com prompt detalhado sobre Lei 12.886/2013 e regulamentos Procon-MT.
  - [ ] Classifica em batch (envia lista inteira de itens em uma chamada).
  - [ ] Para cada item: `compliant` (OK), `warning` (ambíguo), `violation` (proibido).
  - [ ] UPDATE `list_items` SET procon_status, procon_reason.
  - [ ] UPDATE `lists` SET procon_severity (max severity), procon_report (JSONB com sumário).
- [ ] Casos de teste obrigatórios:
  - [ ] "Papel higiênico" → violation
  - [ ] "Sabonete" → violation
  - [ ] "Lápis HB" → compliant
  - [ ] "Caderno marca XYZ" sem justificativa → warning

**Files:**
- `supabase/functions/validate-procon/index.ts`, `supabase/functions/_shared/procon-prompt.ts`.

---

### LC-007 · Wizard publicar lista (escola)
**Labels:** `area/frontend`, `priority/p0` · **Estimate:** L · **Depends:** LC-005, LC-006

**Acceptance Criteria:**
- [ ] Rota `/escola/:schoolId/listas/nova` (apenas school_admin daquela escola).
- [ ] Wizard 3 steps com indicador de progresso lc-blue.
- [ ] **Step 1 — Identificação:** grade*, teacher_name, school_year (default 2027).
- [ ] **Step 2 — Conteúdo:** tabs "Subir foto/PDF" (default) | "Digitar manualmente":
  - [ ] **Upload tab:** drag-and-drop area com border-dashed lc-blue, ícone Upload, "Subir PDF ou foto da lista". Tipos: image/jpeg, image/png, application/pdf. Max 10MB.
  - [ ] Após upload: AILoading rotativo, upload para Storage `lists-raw/`, INSERT `lists` com `source` apropriado, invoke `parse-list`, mostra preview da lista extraída em tabela editável com `react-hook-form` (allow user to fix typos).
  - [ ] **Manual tab:** tabela editável (name, specification, quantity, unit, notes). Botão "+ Adicionar item". Save → INSERT `lists` + `list_items`.
- [ ] **Step 3 — Validação Procon + Publicação:**
  - [ ] Após salvar, invoke `validate-procon`.
  - [ ] Tabela com resultado item-a-item: `CircleCheck` emerald (compliant), `CircleAlert` coral (warning), `CircleX` coral-700 (violation) + reason.
  - [ ] Banner topo dinâmico:
    - compliant → bg-emerald-50 "Lista 100% conforme. Pronto para publicar."
    - warning → bg-amber-50 "Alguns itens precisam de atenção."
    - violation → bg-coral-50 "Itens proibidos detectados. Remova antes de publicar."
  - [ ] Botão "Publicar agora" só ativo se severity != 'violation'. Ao clicar: UPDATE lists SET status='published', published_at + toast + redirect.

**Files:**
- `src/pages/PublishListPage.tsx`, `src/components/list/IdentificationStep.tsx`, `src/components/list/ContentStep.tsx`, `src/components/list/ValidationStep.tsx`, `src/components/list/EditableItemsTable.tsx`.

---

### LC-008 · Listagem de listas + comunicado para pais
**Labels:** `area/frontend`, `area/edge-function`, `priority/p1` · **Estimate:** M · **Depends:** LC-007

**Acceptance Criteria:**
- [ ] Rota `/escola/:schoolId/listas` (school_admin):
  - [ ] Tabela: grade, teacher, items count, procon severity badge, status, ações.
  - [ ] Ações: editar, arquivar, ver detalhes.
  - [ ] CTA primário "Nova lista" → `/escola/:schoolId/listas/nova`.
- [ ] Rota `/escola/:schoolId/comunicados/novo`:
  - [ ] Form: title*, body* (textarea max 500 chars), template select ("Lista publicada", "Lembrete de prazo", "Mudança em item").
  - [ ] Templates pré-preenchem o body.
  - [ ] Submit → INSERT `communications` + invoke `notify-parents` Edge Function.
- [ ] Edge Function `notify-parents` em `/supabase/functions/notify-parents/index.ts`:
  - [ ] Input: `{ communication_id }`.
  - [ ] Busca emails de `profiles` cujos `students` estão vinculados àquela escola (via `students.school_id`).
  - [ ] Envia email batch via Resend.
  - [ ] UPDATE `communications` SET sent_to_count.

**Files:**
- `src/pages/SchoolListsPage.tsx`, `src/pages/NewCommunicationPage.tsx`, `supabase/functions/notify-parents/index.ts`.

---

## Sprint 3 — Jornada do pai

### LC-009 · Busca de escola (autocomplete) + home /pais
**Labels:** `area/frontend`, `priority/p0` · **Estimate:** M · **Depends:** LC-001

**Acceptance Criteria:**
- [ ] Rota `/pais` (autenticada, role parent ou superior).
- [ ] Header com saudação "Oi, {first_name}" + avatar.
- [ ] Hero menor: H1 800 "Vamos encontrar a escola dos seus filhos." + sub.
- [ ] SearchBar grande com autocomplete:
  - [ ] Debounce 250ms, min 3 chars.
  - [ ] Query Postgres: `schools` com `status='approved'` + filtro full-text em `to_tsvector(...)`.
  - [ ] Resultados em dropdown: SchoolCard (avatar inicial bg lc-blue, trade_name 700, "neighborhood · city" mid, badge "Validada Procon" se tiver lista published).
  - [ ] Tap em resultado → `/pais/escola/:slug`.
- [ ] Chips abaixo: "Cuiabá", "Várzea Grande", "Rondonópolis" (filtros).
- [ ] Card destaque "Tem foto da lista?" → `/pais/lista/upload`.
- [ ] Card destaque WhatsApp verde → `wa.me/5565996076018`.

**Files:**
- `src/pages/ParentHomePage.tsx`, `src/components/parent/SchoolSearchBar.tsx`, `src/components/parent/SchoolCard.tsx`, `src/components/parent/CityChips.tsx`.

---

### LC-010 · Detalhe da escola + lista oficial + toggle "já tenho"
**Labels:** `area/frontend`, `priority/p0` · **Estimate:** M · **Depends:** LC-009

**Acceptance Criteria:**
- [ ] Rota `/pais/escola/:slug`:
  - [ ] Header bg lc-blue: voltar + nome da escola peso 800 + badge "Validada Procon-MT" se aplicável.
  - [ ] Listas disponíveis (cards): grade + teacher + items count + published_at + botão "Ver lista".
- [ ] Rota `/pais/escola/:slug/lista/:listId`:
  - [ ] Header similar ao mockup (App Pais 03 dos wireframes).
  - [ ] Stat row: "X de Y itens · Já tenho em casa" + "Economizou ~ R$ Z".
  - [ ] Lista vertical com stagger reveal:
    - [ ] `<ListItem />`: foto-padrão (ícone genérico colorido por categoria), name 600, specification mid, estimated_price tabular, botão "já tenho" (toggle).
    - [ ] Item já-tenho: line-through, badge "Reaproveitado" emerald.
  - [ ] Estado de "já tenho" persistido em URL params + localStorage (NÃO em cart até o usuário clicar para gerar carrinho).
- [ ] Sticky bottom CTA: "Total estimado R$ X" + botão grande blue "Montar carrinho com IA" → invoke `build-cart` (LC-012) → redirect para `/pais/carrinho/:shortCode`.

**Files:**
- `src/pages/SchoolDetailPage.tsx`, `src/pages/ListDetailPage.tsx`, `src/components/parent/ListItem.tsx`, `src/components/parent/StickyCartButton.tsx`.

---

### LC-011 · Upload direto pelo pai
**Labels:** `area/frontend`, `priority/p1` · **Estimate:** M · **Depends:** LC-007 (reusa componentes)

**Contexto:** Pai sobe foto da lista mesmo sem ter encontrado a escola publicada (ou se a escola ainda não está cadastrada).

**Acceptance Criteria:**
- [ ] Rota `/pais/lista/upload`:
  - [ ] Antes de processar: pergunta "De qual escola é essa lista?" com autocomplete em `schools` (status approved).
  - [ ] Se escola encontrada → segue normal.
  - [ ] Se não → input livre "Digite o nome da escola" + ação "Cadastrar essa escola" leva o pai pelo fluxo de LC-002. Após cadastrar, lista fica vinculada com `source='parent_upload'` e `status='draft'`. Pai recebe o cart, mas a lista não vira public até a escola ser approved.
- [ ] Componente de upload reutiliza `<ContentStep />` da LC-007.
- [ ] Após `parse-list` retornar, mostra preview, permite editar, e segue para fluxo de carrinho IA (skipa step de "publicar" porque lista de pai não publica).

**Files:**
- `src/pages/ParentUploadPage.tsx` (compõe componentes existentes).

---

### LC-012 · Edge Function build-cart (matching + 3 estratégias)
**Labels:** `area/edge-function`, `area/ai`, `priority/p0` · **Estimate:** L · **Depends:** LC-005

**Contexto:** Núcleo do produto. Recebe uma lista, faz matching com catálogo, gera 3 carrinhos otimizados.

**Acceptance Criteria:**
- [ ] Importar seed `catalog-seed.json` em `catalog_items` + `retailer_links` via Edge Function de seed (criar `seed-catalog/index.ts` que roda uma vez).
- [ ] Edge Function `build-cart` em `/supabase/functions/build-cart/index.ts`:
  - [ ] Input: `{ listId: string, alreadyOwnedItemIds?: string[] }`.
  - [ ] Output: `{ cartId, options: { cheapest, fastest, recommended } }`.
  - [ ] Lógica:
    - [ ] Busca `list_items` excluindo `alreadyOwnedItemIds`.
    - [ ] Para cada item, matching:
      1. **Match por keywords:** intersect tokens entre `item.name + specification` e `catalog_items.keywords` array. Score de overlap.
      2. **Fallback IA:** se score < threshold, chama Gemini Flash com prompt "Dado '[name] [spec]', escolha o melhor candidato de [lista do catálogo]. Retorne só o id ou 'none'."
    - [ ] Para cada item matchado, busca `retailer_links` (4 varejistas).
    - [ ] Constrói 3 estratégias:
      - **cheapest:** menor `estimated_price` por item, multi-store split.
      - **fastest:** tudo no mesmo varejista (priorizar Kalunga MT > Magalu > ML > Amazon), single-store.
      - **recommended:** balanço (preço + 0.3 × delivery_time_proxy). Default 1-2 stores.
    - [ ] Cada estratégia: `{ items: [{ list_item_id, retailer, search_url, estimated_price }], total, retailers: [...] }`.
    - [ ] Gerar `short_code` via `generate_short_code()`.
    - [ ] INSERT em `carts`, retornar.
- [ ] Performance alvo: <60s para lista de 30 itens.
- [ ] Telemetria: log via `events` (tabela em LC-014) — `cart_built` com properties.

**Files:**
- `supabase/functions/seed-catalog/index.ts`, `supabase/functions/build-cart/index.ts`, `supabase/functions/_shared/matching.ts`, `supabase/functions/_shared/strategies.ts`.

---

### LC-013 · UI dos 3 carrinhos IA + RetailerSplit + tracking deep links
**Labels:** `area/frontend`, `priority/p0` · **Estimate:** M · **Depends:** LC-012

**Acceptance Criteria:**
- [ ] Rota `/pais/carrinho/:shortCode`:
  - [ ] Loading inicial: AILoading fullscreen com texto rotativo (mín 2s).
  - [ ] Após pronto:
    - Header voltar + título "3 opções pra você"
    - Sub: "A IA comparou X varejistas em Y segundos. Sem itens abusivos."
    - 3 cards de carrinho com stagger (CartOption):
      - Cheapest (banner top lc-lime, badge "Mais barato · recomendado")
      - Fastest (banner slate, "Tudo num lugar só")
      - Recommended (banner slate, "Equilíbrio")
    - Cada card: total grande tabular, breakdown por varejista, sub-info (pickup, delivery), CTA → `/pais/carrinho/:shortCode/checkout?strategy=cheapest`.
- [ ] Rota `/pais/carrinho/:shortCode/checkout?strategy=...`:
  - [ ] Procon-safe seal no topo.
  - [ ] Para cada varejista da estratégia: card RetailerSplit com logo monocromático + contagem de itens + subtotal + botão "Comprar na [Varejista]".
  - [ ] onClick do botão: INSERT em `deep_link_clicks` + `window.open(search_url, '_blank', 'noopener')`.
  - [ ] Aviso rodapé: "Como funciona: você vai pra cada loja com a busca já feita. Paga lá. Em breve, pagamento único aqui."
- [ ] Rota `/pais/historico`: lista de carts criados pelo user, cada um reabre `/pais/carrinho/:shortCode`.

**Files:**
- `src/pages/CartOptionsPage.tsx`, `src/pages/CartCheckoutPage.tsx`, `src/pages/ParentHistoryPage.tsx`, `src/components/parent/CartOption.tsx`, `src/components/parent/RetailerSplit.tsx`.

---

## Sprint 4 — Admin, observabilidade, polimento

### LC-014 · Tabela events + useTrack hook + tela /admin/sessoes
**Labels:** `area/frontend`, `area/db`, `priority/p1` · **Estimate:** M · **Depends:** LC-001

**Acceptance Criteria:**
- [ ] Migration adicional: criar tabela `events`:
  ```sql
  CREATE TABLE public.events (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id),
    session_id text,
    name text not null,
    properties jsonb,
    created_at timestamptz default now()
  );
  CREATE INDEX idx_events_session ON public.events(session_id, created_at);
  CREATE INDEX idx_events_name ON public.events(name);
  ```
  + RLS: usuário insere os próprios eventos; só admin lê.
- [ ] Hook `useTrack()` em `src/hooks/useTrack.ts`:
  - [ ] Gera/lê session_id em sessionStorage.
  - [ ] Função `track(name, properties?)` que faz INSERT via supabase-js.
- [ ] Disparar eventos em momentos chave: `page_view`, `search`, `school_select`, `list_view`, `cart_generated`, `deep_link_click`.
- [ ] Rota `/admin/sessoes` (platform_admin):
  - [ ] Tabela últimas 100 sessões com filtro por user/email.
  - [ ] Click em sessão → `/admin/sessoes/:sessionId` mostra timeline de events com timestamp, name, properties JSON pretty.

**Files:**
- `supabase/migrations/002_events.sql`, `src/hooks/useTrack.ts`, `src/pages/admin/AdminSessionsPage.tsx`, `src/pages/admin/SessionDetailPage.tsx`.

---

### LC-015 · WhatsApp capture queue (admin manual)
**Labels:** `area/frontend`, `area/edge-function`, `priority/p1` · **Estimate:** M · **Depends:** LC-012

**Contexto:** No MVP não temos WhatsApp Business API. Pai manda mídia para +55 (65) 99607-6018, atendente humano cria entrada no admin, sistema processa.

**Acceptance Criteria:**
- [ ] Rota `/admin/whatsapp` (platform_admin):
  - [ ] Botão "Nova captura" → modal:
    - [ ] Input phone (placeholder "+55 65...")
    - [ ] Upload de imagem(ns) (multipart)
    - [ ] Hint de escola (texto livre)
    - [ ] Botão "Processar"
  - [ ] Ao processar: INSERT `whatsapp_captures` status='received', upload das imagens para Storage, invoke `parse-list`, status flow received → processing → done | failed.
  - [ ] Tabela com queue: phone, timestamp, status, hint, ações.
  - [ ] Click na linha → tela de revisão:
    - [ ] Imagens à esquerda
    - [ ] Resultado parsed_list à direita (editável via react-hook-form).
    - [ ] Search de escola para vincular (RPC `search_inep_schools` + lookup em `schools` approved).
    - [ ] Botão "Gerar carrinho IA": cria `lists` (source='whatsapp_capture') + invoke `build-cart` + UPDATE whatsapp_captures.cart_id.
    - [ ] Botão "Copiar link de resposta" — copia `Sua lista está pronta: listacertaescolar.com.br/c/{short_code}`.
    - [ ] Botão WhatsApp "Responder" — abre `wa.me/{phone}?text={msg pré-preenchida}`.
- [ ] Rota pública `/c/:shortCode` que abre carrinho (acessível sem login se cart for do pai não cadastrado, com prompt para cadastrar).

**Files:**
- `src/pages/admin/AdminWhatsAppPage.tsx`, `src/pages/admin/CaptureReviewPage.tsx`, `src/components/admin/CaptureForm.tsx`, `src/pages/PublicCartPage.tsx`.

---

### LC-016 · Páginas estáticas + meta tags + 404/500 polished
**Labels:** `area/frontend`, `priority/p2` · **Estimate:** S · **Depends:** —

**Acceptance Criteria:**
- [ ] Página `/sobre` — texto institucional curto, missão da ListaCerta, contato DPO, CNPJ (placeholder), endereço Cuiabá.
- [ ] Página `/privacidade` — renderiza PRIVACY.md como markdown (usar `react-markdown`).
- [ ] Página `/termos` — termos básicos de uso (criar conteúdo placeholder LGPD-aware).
- [ ] Página `/404` — já existe da inicialização Lovable, refinar com brand voice.
- [ ] Página `/500` — fallback genérico com retry.
- [ ] Meta tags OG/Twitter em todas as páginas usando `react-helmet-async` ou similar:
  - [ ] og:title, og:description, og:image (criar `og-default.png` 1200x630 com logo + headline).
  - [ ] twitter:card summary_large_image.
- [ ] Favicon completo em `/public/`.
- [ ] Robots.txt + sitemap.xml básico (apenas landing + /sobre + /privacidade + /termos no sitemap; resto noindex via meta).

**Files:**
- `src/pages/AboutPage.tsx`, `src/pages/PrivacyPage.tsx`, `src/pages/TermsPage.tsx`, `src/pages/InternalErrorPage.tsx`, `src/components/SEOHead.tsx`, `public/og-default.png`, `public/robots.txt`, `public/sitemap.xml`.

---

## Definition of Done geral

Aplicável a TODAS as issues:

- [ ] PR aprovado em revisão por humano (você).
- [ ] Sem warnings ou errors no `npm run type-check`.
- [ ] Sem warnings ou errors no `npm run lint`.
- [ ] Mobile-first: testado em viewport 380px sem scroll horizontal.
- [ ] Acessibilidade: alvos de toque ≥44px, contraste WCAG AA, focus visible.
- [ ] Reduzido motion: respeita `prefers-reduced-motion`.
- [ ] DESIGN.md respeitado: tokens, tipografia, anti-padrões.
- [ ] LGPD respeitada: nenhum dado de menor exposto além do estritamente necessário; auditoria em `students_access_log` se aplicável.
- [ ] Smoke test do happy-path documentado em comentário do PR.
- [ ] Rollback plan documentado se a issue altera schema (DROP / DOWN migration).

---

## Quando precisa fugir do backlog

Se durante uma issue você descobrir bug em código existente, scope creep ou refactor necessário:

1. **Bug crítico (bloqueia o PR):** abrir issue spike `LC-XXX-spike` no mesmo PR só com fix mínimo. Documentar no PR.
2. **Refactor médio:** pausar a issue, abrir nova issue de refactor, mergear primeiro, retomar.
3. **Scope creep:** documentar como follow-up issue. Não inflar PR.

A regra é: **PR pequeno mergeia rápido. PR gigante apodrece em revisão.**

---

**Versão:** 1.0 — abril 2026
**Para:** Claude Code via PRs no repositório GitHub do ListaCerta.
