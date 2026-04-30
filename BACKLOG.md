# BACKLOG.md

Itens não-bloqueantes de dívida técnica, slices futuras conhecidas, e protocolos firmados ao longo da execução. Atualizado conforme as slices fecham.

**Última atualização:** 2026-04-29 (pós LC-004)

---

## Dívida técnica (não-bloqueante)

### TD-01 — Substituir `cep-promise` por wrapper fetch direto
**Origem:** LC-002
**Custo do problema:** ~120 KB raw / ~35 KB gzip no bundle (cep-promise arrasta axios como peer).
**Solução:** wrapper de ~30 linhas que faz fallback ViaCEP → BrasilAPI → Postmon usando `fetch` puro.
**Quando atacar:** quando o bundle ultrapassar 1.2 MB raw, ou na primeira slice que mexer em `src/lib/cep.ts`.

### TD-02 — Cobertura de testes em hooks críticos
**Origem:** LC-002, LC-003, LC-004
**Estado atual:** 8 testes (1 example + 7 email-heuristics). Hooks `useSchool`, `useChangeSchoolStatus`, `useAdminSchoolsQueue`, polling de status, RPC `admin_change_school_status` — tudo sem teste.
**Solução:** suite de integração com `@testing-library/react` + Supabase mock. Foco em hooks que tocam dados sensíveis (mutações de status, promoção de role).
**Quando atacar:** antes de Phase 5 (temporada Y1) — sem isso, refactor cego em pico de janeiro vira incidente.

### TD-03 — AppShell com navbar global
**Origem:** LC-003
**Estado atual:** CTA de admin / minhas-escolas mora em `MinhaContaPage`. Funciona com 3 páginas protegidas, mas não escala.
**Solução:** componente `AppShell` com navbar lateral (desktop) / bottom nav (mobile), que envolve `<ProtectedRoute>`.
**Quando atacar:** quando atingirmos ≥ 5 páginas protegidas (provável em LC-006 ou LC-007).

### TD-04 — Sentry de verdade
**Origem:** LC-002 (assumido instalado em LC-001, mas nunca foi)
**Estado atual:** erros vão pra `console.error` apenas. Sem visibilidade em produção.
**Solução:** `npm install @sentry/react`, configurar DSN via env var, wrapping no `App.tsx`. Política de PII: nunca logar `email`, `cnpj`, `legal_name`, dados de menor.
**Quando atacar:** antes do primeiro acesso de usuário externo (escola amiga / pai beta).

### TD-05 — Setup local do Supabase CLI
**Origem:** LC-002, LC-004
**Estado atual:** dependemos do pipeline da Lovable pra regenerar `types.ts`. Quando o Lovable atrasa ou não dispara o pipeline, types ficam dessincronizados do banco e quebram type-check.
**Solução:** `npm install -D supabase` + `supabase login` + `supabase link --project-ref <ID>`. Aí qualquer pessoa do time roda `npx supabase gen types typescript --linked > src/integrations/supabase/types.ts` localmente.
**Quando atacar:** antes da próxima migration que envolva tabela ou RPC nova.

### TD-06 — Branch protection com migration check
**Origem:** lição da merge prematura do PR #9 (LC-004)
**Estado atual:** main aceita merge de PR com migration sem confirmação de aplicação no banco. Já causou quebra silenciosa de type-check duas vezes.
**Solução:** GitHub branch protection rule em `main` exigindo status check `migration_applied: confirmed` (manual ou via GitHub Action). Enquanto não tem CI: regra de hábito → comentar literalmente "migration aplicada e verificada" no PR antes de clicar Merge.
**Quando atacar:** próxima oportunidade de mexer em settings do GitHub. Pode ser aplicado em ~5min.

### TD-07 — Atualizar referências `Resend` → `Brevo`
**Origem:** decisão tomada no início, nunca refletida em docs.
**Estado atual:** este BACKLOG e qualquer menção a email anterior pode citar Resend.
**Solução:** grep no repo, substituir todas as ocorrências.
**Quando atacar:** com LC-004.5 (a primeira slice que de fato manda email).

### TD-08 — Refatorar `StatusActionPanel` em sub-componentes por status
**Origem:** LC-004
**Estado atual:** 242 linhas, 4 status branches (`pending_approval`, `approved`, `rejected`, `suspended`). No limite.
**Solução:** quebrar em `PendingActions`, `ApprovedActions`, etc. Próxima slice que tocar nesse arquivo deve fazer.
**Quando atacar:** quando LC-004.5 ou outra slice precisar adicionar nova ação.

### TD-09 — SEO técnico nas páginas públicas
**Origem:** LC-006 (primeira slice com superfície pública indexável)
**Estado atual:** `/buscar`, `/escola/:slug` e `/escola/:slug/lista/:listId` são acessíveis sem auth e renderizam dados reais, mas usam o `<title>` estático do `index.html`. Sem meta description dinâmica, sem OG image por escola, sem JSON-LD.
**Solução:** instalar `react-helmet-async` (ou `vite-plugin-ssg` se quisermos SSR), adicionar Helmet em cada página pública com `title`, `description`, `og:title`, `og:description`, `og:image`, `og:url` derivados de `school.trade_name + city`. JSON-LD `EducationalOrganization` em `/escola/:slug` e `Schema.org/ItemList` em `/escola/:slug/lista/:listId`.
**Quando atacar:** antes da primeira campanha de aquisição orgânica (provavelmente Phase 4).

### TD-10 — Revisão jurídica do termo de consentimento parental (BLOQUEANTE para onboarding externo)
**Origem:** LC-007
**Estado atual:** Termo placeholder conservador hardcoded como `v1.2026.04` em `src/lib/parental-consent.ts`. Sem revisão de advogado especializado em LGPD/menor.
**Solução:** contratar advogado LGPD para revisar texto do termo + termo de uso + RIPD. Versionar como `v2.YYYY.MM` após revisão.
**Quando atacar:** ANTES de onboardar primeiro pai externo (não-interno). Para MVP com sócios + escolas amigas, risco contido.
**Severidade:** 🔴 BLOQUEANTE para qualquer onboarding fora do círculo interno.

### TD-11 — Validar retention de 90 dias com DPO/advogado
**Origem:** LC-007
**Estado atual:** Soft delete com retention de 90 dias hardcoded na cópia da UI ("será removido em até 90 dias"). Sem base legal documentada e sem cron de purge real.
**Solução:** com advogado/DPO definir uma das duas opções: (a) reduzir para 24-48h e justificar como janela técnica de undo, OU (b) manter 90d com base legal explícita em RIPD (obrigação contratual, prevenção a fraude, etc). Implementar cron de purge real em qualquer dos dois cenários.
**Quando atacar:** junto com TD-10.
**Severidade:** 🔴 BLOQUEANTE — exposição direta a multa LGPD se ANPD auditar.

### TD-12 — "Marca paga prioridade" no Recommended
**Origem:** LC-008
**Estado atual:** Recommended faz score `0.5*price + 0.3*Full + 0.2*seller`. Nenhum sinal de receita.
**Solução:** quando catálogo próprio/parcerias virem, adicionar coluna `sponsored_priority` (0-1 ou enum) consumida pelo algoritmo como bônus capped (ex.: +0.1 ao score). Disclosure obrigatória na UI ("patrocinado").
**Quando atacar:** junto com primeiro contrato comercial de marca.

### TD-13 — Catálogo Kalunga real (substituir mock)
**Origem:** LC-008 (adendo mock visual)
**Estado atual:** preços Kalunga gerados deterministicamente a partir de ML real (`is_mock=true`). Banner "DEMO" + CTA desabilitado.
**Solução:** integrar API ou catálogo manual scraped, gravar em uma tabela `kalunga_catalog`. Substituir o branch de mock no `build-cart` por leitura real.
**Quando atacar:** após contrato comercial Kalunga assinado.

### TD-14 — Catálogo Magalu real (substituir mock)
**Origem:** LC-008 (adendo)
**Estado atual:** idêntico ao TD-13 mas para Magazine Luiza.
**Solução:** mesmo padrão de TD-13.
**Quando atacar:** após contrato comercial Magalu.

### TD-15 — Cron de purge `ml_search_cache`
**Origem:** LC-008
**Estado atual:** entradas com `expires_at < NOW()` ficam armazenadas indefinidamente como fallback stale (até 7d). Sem job de purge real após 7d.
**Solução:** Supabase scheduled function (`pg_cron` ou Edge Function por cron) que faz `DELETE FROM ml_search_cache WHERE fetched_at < NOW() - INTERVAL '7 days'` diariamente.
**Quando atacar:** quando `ml_search_cache` ultrapassar ~10k linhas em produção.

### TD-16 — Métricas operacionais de carrinho
**Origem:** LC-008
**Estado atual:** `cart_strategies` armazena `unavailable_items` e `has_partial_strategy` por geração, mas nada agrega em painel admin.
**Solução:** view `admin_cart_health` com `% unavailable`, `% partial_strategies`, `avg latency build-cart`. Dashboard simples no painel admin.
**Quando atacar:** quando volume passar de ~50 carrinhos/dia.

### TD-17 — Contract tests para ML API
**Origem:** LC-008
**Estado atual:** `searchML()` parsea `id, title, price, permalink, thumbnail, seller.*, shipping.logistic_type, available_quantity` confiando que ML mantém o shape. Mudança no contrato quebra silenciosamente.
**Solução:** snapshot test do shape (Vitest com `toMatchInlineSnapshot`). Roda contra fixture local + opcionalmente contra ML real em CI nightly.
**Quando atacar:** após primeira incidência de quebra ou antes de plano free virar pago.

### TD-18 — Substituir mock Kalunga por catálogo real
**Origem:** LC-008 (adendo) — duplica TD-13 com nuance
**Estado atual:** branch de mock no `build-cart` quando `ENABLE_RETAILER_MOCKS=true`.
**Solução:** flag desligada + tabela `kalunga_catalog` populada (ver TD-13).
**Quando atacar:** com TD-13.

### TD-19 — Substituir mock Magalu por catálogo real
**Origem:** LC-008 (adendo) — duplica TD-14 com nuance
**Estado atual:** análogo a TD-18.
**Solução:** análogo a TD-14.
**Quando atacar:** com TD-14.

### TD-20 — Feature flag de demo por usuário
**Origem:** LC-008 (adendo)
**Estado atual:** flag `VITE_ENABLE_RETAILER_MOCKS` é global.
**Solução:** quando reclamação de pai aparecer ("achei que era preço real"), gate a flag por user ou por escola via tabela `feature_flags`. Pais opt-in para ver demo, default off.
**Quando atacar:** apenas se houver reclamação. Sem investimento preventivo.

---

## Slices futuras conhecidas

### LC-002.5 — Co-admin flow
**Origem:** LC-002
**Premissa:** dois coordenadores da mesma escola tentam cadastrar. Hoje cai em "essa escola já está cadastrada" sem caminho de co-admin.
**Escopo:**
- Detectar conflito de `inep_code` no INSERT.
- Oferecer "Solicitar acesso como co-admin".
- Criar entry pendente em `school_admins` com `pending_owner_approval=true`.
- Adicionar role `'owner'` no schema com backfill: para cada `school_id`, o `school_admin` mais antigo (`MIN(created_at)`) vira `'owner'`.
- Painel admin (LC-004) já existente pra aprovar.

**Esforço estimado:** ~1h Claude Code + 15min review.
**Quando atacar:** só quando houver caso real de conflito esperando.

### LC-004.5 — Email de notificação via Brevo
**Origem:** LC-004 (ficou out of scope deliberadamente)
**Premissa:** quando admin aprova/rejeita escola, owner recebe email automático. Hoje só descobre via polling de 30s.
**Escopo:**
- Edge function `send-status-email` (Deno).
- Integração Brevo via API key em env var.
- Templates HTML pra `approved` (parabéns + próximos passos) e `rejected` (motivo + caminho de reanálise).
- RPC `admin_change_school_status` chama a edge function após mudança de status.
- Logs estruturados de envio (entregue / falhou / bounced).

**Esforço estimado:** ~1h30 Claude Code + 30min review + setup Brevo (API key, domínio verificado, sender configurado).
**Quando atacar:** antes de onboardar primeira escola real.

---

## Protocolos firmados (lições aprendidas)

### Protocolo de migrations
Toda slice que altera schema entrega 3 artefatos:
1. Arquivo de migration em `supabase/migrations/<NNN>_<slice>_<descrição>.sql` com SQL idempotente (`IF EXISTS` / `IF NOT EXISTS`).
2. Augment manual em `types.ts` com marcador `// [LC-XXX manual augment — pending CLI regen]`.
3. PR description com checklist de pós-merge:
   - [ ] Aplicar migration no SQL Editor
   - [ ] Confirmar via queries SQL no PR description que tabela/RPC/view foram criadas
   - [ ] Pedir ao Lovable pra rodar migration no-op (COMMENT ON ...) pra forçar regen do types.ts
   - [ ] Confirmar via GitHub que augments com marcador sumiram do types.ts
   - [ ] Smoke test

**Regra crítica:** PR com migration NÃO mergeia até a migration estar aplicada e verificada. Pular essa regra causa quebra silenciosa de type-check em main.

### Numeração sequencial de migrations
Convenção: `001_*`, `002_*`, `003_*`. Migrations no-op de regen (forçadas pelo Lovable) ocupam um número da sequência. Próxima slice deve usar o número seguinte ao último real.

### Augment manual de `types.ts`
Sandbox do Claude Code não tem Supabase CLI. Quando edita `types.ts` manualmente, sempre marca o bloco com `// [LC-XXX manual augment — pending CLI regen]` pra futuro regen poder identificar e remover. Migration no-op via Lovable resolve regen pós-merge.

### Smoke test obrigatório antes de mergear
Toda slice define entre 5 e 15 critérios de aceite no PR description. Testes manuais são executados no preview do Lovable. PR não mergeia sem pelo menos os 7-8 critérios críticos passando.

### Bootstrap de admin manual
`platform_admin` é promovido manualmente no SQL Editor:

```sql
UPDATE public.profiles
SET role = 'platform_admin'
WHERE id = (SELECT id FROM auth.users WHERE LOWER(email) = LOWER('email@aqui.com'));
```

Sem UI de promoção. Quando atingir 5+ admins, criar UI de gestão (out of scope até lá).
