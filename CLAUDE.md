# CLAUDE.md

> **Briefing permanente do agente Claude Code** dentro do repositório ListaCerta. Leia toda sessão antes de começar a trabalhar. Quando este arquivo conflita com qualquer outra fonte (issue, comentário de PR, sugestão), o conflito DEVE ser apontado ao humano antes de prosseguir.

---

## 1. Quem é o produto

**ListaCerta** — plataforma neutra que conecta pais brasileiros à lista oficial de material escolar dos filhos, com IA que monta carrinhos otimizados em múltiplos varejistas (Kalunga, Magalu, Mercado Livre, Amazon).

**Geografia inicial:** Cuiabá, Mato Grosso (e região metropolitana).
**Domínio futuro:** `listacertaescolar.com.br`
**Stage:** MVP pré-soft-launch. Sem usuários reais ainda.
**Pagamento:** ❌ NÃO existe no MVP. Plataforma é redirecionadora, não checkout. Não criar lógica de pagamento sem ordem explícita.

---

## 2. Stack canônica

Não troque libs sem permissão.

```
Frontend:
- React 18 + Vite + TypeScript strict
- Tailwind CSS com tokens customizados (lc-*)
- shadcn/ui (Button, Card, Input, Badge, Toast, Dialog, etc)
- Framer Motion (animações)
- lucide-react (ícones — único pack permitido)
- react-router-dom v6
- @tanstack/react-query (data fetching)
- react-hook-form + zod (forms)
- vite-plugin-pwa (PWA)
- cep-promise (auto-fill de CEP)

Backend:
- Lovable Cloud (Supabase wrapper) — Postgres + Auth + Storage + Edge Functions
- @supabase/supabase-js (cliente)
- Edge Functions: Deno, TypeScript

IA:
- Google Gemini 2.0 Flash (chave própria do usuário em GOOGLE_AI_KEY)
- Chamadas via fetch direto da Edge Function

Auth:
- Google OAuth via Supabase

Email:
- Resend (RESEND_API_KEY)

Deploy:
- Lovable Cloud (preview URLs automáticas)
- Domínio próprio configurado quando o produto for público
```

**Não introduzir:** Redux, MobX, Zustand (use react-query + context), styled-components, Material UI, Bootstrap, Chakra, Storybook, Cypress, Jest (sem testes formais no MVP).

---

## 3. Documentos canônicos do projeto

Leia/consulte sempre que apropriado:

| Arquivo | Leia quando |
|---|---|
| `DESIGN.md` | Antes de criar qualquer UI. Tokens, tipografia, motion, anti-padrões. **Vinculante.** |
| `BACKLOG.md` | Antes de começar uma issue. As issues estão lá numeradas LC-XXX. |
| `HANDOFF.md` | Primeira sessão sua no repo, ou quando precisar revisar a transição Lovable → Claude Code. |
| `PRIVACY.md` | Quando trabalhar em qualquer feature que toque dados pessoais (especialmente menores). |
| `RIPD.md` | Mesma situação acima — quando precisar entender mitigações LGPD. |
| `schema.sql` | Antes de qualquer mudança em banco. NÃO modifique sem migration. |
| `catalog-seed.json` | Quando trabalhar em matching IA, build-cart, ou catálogo. |

---

## 4. Estrutura do repositório

```
/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn primitives — não modificar à toa
│   │   ├── shared/          # Logo, AuroraBackground, AILoading, NumberCounter, ProtectedRoute
│   │   ├── landing/         # Hero, HowItWorks, ProconBanner, RetailersMarquee, ForSchools, Footer, Header
│   │   ├── parent/          # SchoolSearchBar, SchoolCard, ListItem, CartOption, RetailerSplit
│   │   ├── school/          # InepSearchStep, SchoolFormStep, SchoolSidebar, StatusCard
│   │   ├── admin/           # SchoolApprovalRow, RejectModal, CaptureForm
│   │   └── list/            # IdentificationStep, ContentStep, ValidationStep, EditableItemsTable
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── ParentHomePage.tsx
│   │   ├── SchoolDashboardPage.tsx
│   │   ├── admin/
│   │   └── ...
│   ├── lib/
│   │   ├── supabase.ts      # client + helpers
│   │   ├── cep.ts           # wrapper de cep-promise
│   │   ├── validators.ts    # schemas zod
│   │   └── utils.ts         # cn, formatters
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTrack.ts
│   │   └── useReducedMotion.ts
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── types/
│   │   └── database.ts      # gerado via supabase gen types
│   └── styles/
│       └── globals.css
├── supabase/
│   ├── functions/
│   │   ├── _shared/         # email-templates, gemini, types, matching, strategies
│   │   ├── notify-school-approved/
│   │   ├── parse-list/
│   │   ├── validate-procon/
│   │   ├── build-cart/
│   │   ├── notify-parents/
│   │   └── seed-catalog/
│   └── migrations/
│       ├── 001_initial.sql  # = schema.sql
│       └── 002_events.sql
├── public/
│   ├── manifest.webmanifest
│   ├── logo-listacerta.svg
│   └── icons/
├── DESIGN.md
├── BACKLOG.md
├── HANDOFF.md
├── PRIVACY.md
├── RIPD.md
├── CLAUDE.md (este arquivo)
└── README.md
```

**Regra estrutural:** Quando uma issue do backlog citar `Files:`, esse é o ground truth de onde colocar código. Se você precisar criar arquivo fora dessa lista, **explique no PR por quê**.

---

## 5. Convenções de código

### TypeScript
- `strict: true`. Sem `any` implícito. Sem `// @ts-ignore` (use `// @ts-expect-error` com comentário explicando).
- Tipos do Supabase em `src/types/database.ts`, gerados via `npx supabase gen types typescript --linked > src/types/database.ts`.
- Imports absolutos via alias `@/*` apontando para `src/*`. Nunca `../../../`.

### Estilo
- Tailwind classes ordenadas: layout → spacing → sizing → typography → colors → effects.
- Use a função `cn()` de `lib/utils.ts` para merge de classes condicionais.
- **Nunca** estilo inline (`style={{}}`) exceto para CSS vars dinâmicas.
- Cores SEMPRE via tokens lc-* (ou shadcn semantic). Nunca cores hex inline.

### Componentes
- Functional components com TypeScript. `export default function ComponentName({ ... }: Props) { ... }`.
- Props interface no topo do arquivo: `interface ComponentNameProps { ... }`.
- Server components (Edge Functions) em Deno: imports via URL ESM.

### Naming
- Componentes: `PascalCase.tsx`.
- Hooks: `useThing.ts`.
- Utilitários: `kebab-case.ts` ou `camelCase.ts`.
- Constantes: `SCREAMING_SNAKE_CASE`.
- Eventos disparados via `useTrack()`: `snake_case` (ex: `cart_generated`, `deep_link_click`).

### Forms
- Sempre `react-hook-form` + `zod` para validação.
- Schemas zod em `src/lib/validators.ts`.
- Mensagens de erro em pt-BR, voz da marca (microcopia em `DESIGN.md` seção 9).

### Data fetching
- `@tanstack/react-query` para tudo que vem do Supabase.
- Query keys padronizadas: `['schools', 'pending']`, `['lists', schoolId]`, `['cart', shortCode]`.
- Mutations sempre com `onSuccess` invalidando queries relacionadas.

---

## 6. Regras de Banco de Dados

- **Toda mudança de schema = migration nova em `supabase/migrations/00X_descricao.sql`.** Nunca edite o `schema.sql` diretamente após o setup inicial.
- **RLS é mandatório.** Nunca crie tabela sem RLS habilitada. Se for tabela com dados públicos, a policy explícita é `FOR SELECT USING (TRUE)`.
- **Dados de menor (`students`)** têm regime reforçado:
  - RLS isola por `parent_id`.
  - Toda leitura/edição passa por log em `students_access_log` (criar trigger se ainda não existir).
  - Nunca expor sobrenome, foto, CPF, RG, biometria.
  - Nunca usar dados de menor para personalização de marketing.
- **Indexação:** sempre que criar coluna FK, criar index. Use GIN para busca full-text.
- **Tipos:** UUID via `uuid_generate_v4()`. Timestamps `timestamptz`. Texto curto sem limite (`text`, não `varchar(N)`).

---

## 7. Edge Functions

- Sempre em `supabase/functions/<nome>/index.ts`.
- Compartilhamento de código em `supabase/functions/_shared/`.
- Variáveis de ambiente via `Deno.env.get('NOME_VAR')`. Nunca hardcode keys.
- Tratamento de erro padrão:
  ```ts
  try {
    // ...
  } catch (err) {
    console.error('[function-name] error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  ```
- CORS: usar helper compartilhado em `_shared/cors.ts`. Origins permitidas: `localhost:5173`, preview URL Lovable, domínio prod.
- Timeout: 60s padrão Supabase. Operações IA potencialmente longas → considerar streaming ou job queue.

---

## 8. Como começar uma sessão

```
1. Ler CLAUDE.md (este arquivo) — você está fazendo isso ✓
2. Ler issue específica do BACKLOG.md (ex: LC-005)
3. Ler arquivos referenciados na issue (DESIGN.md, schema.sql, etc)
4. Criar branch: git checkout -b feat/lc-005-parse-list-edge-fn
5. Listar plano de ataque em comentário no PR antes de codar
6. Trabalhar em commits pequenos e bem nomeados (Conventional Commits)
7. Antes de pedir review: rodar npm run type-check && npm run lint
8. Abrir PR com template (próxima seção)
9. Marcar issues bloqueadas/desbloqueadas no BACKLOG.md
```

---

## 9. Template de PR

```markdown
## Issue
Closes #X (LC-XXX)

## What
Resumo de 1-2 frases do que muda.

## Why
Por que essa mudança importa, qual problema resolve.

## How
Decisões técnicas relevantes:
- Por que escolhi X em vez de Y
- Trade-offs feitos
- Coisas que poderiam ser melhoradas no futuro

## Smoke test
Passos manuais para validar:
1. Subir dev server
2. Acessar /rota
3. Esperado: ...

## Screenshots / Videos
[se aplicável]

## Checklist
- [ ] DESIGN.md respeitado
- [ ] type-check passa
- [ ] lint passa
- [ ] Mobile 380px testado
- [ ] Acessibilidade ≥ AA
- [ ] LGPD respeitada (se aplicável)
- [ ] Sem TODO ou console.log órfãos
```

---

## 10. Política "Ask first, act second"

**Pergunte antes de:**
- Adicionar dependência nova ao `package.json`.
- Criar tabela ou alterar schema fora de migration explícita.
- Criar arquivo fora dos `Files:` listados na issue.
- Modificar política de RLS.
- Tocar em código de Auth ou tratamento de dados de menor.
- Refatorar arquivo que outras issues dependem.
- Mudar tokens de design ou anti-padrões do `DESIGN.md`.

**Pode agir direto para:**
- Implementar exatamente o escopo da issue.
- Adicionar tipos auxiliares.
- Refatorar dentro do mesmo arquivo (sem mudar contrato público).
- Criar testes (quando houver).
- Adicionar comentários de código.

---

## 11. Anti-padrões — NUNCA

- ❌ Criar mascote, ilustração isométrica, ícones literais de papelaria.
- ❌ Aplicar gradiente sunset (rosa-laranja-amarelo) ou gradiente AI violet-rosa-azul.
- ❌ Misturar Coral e Emerald na mesma peça.
- ❌ Usar fonte que não seja Inter.
- ❌ Logar dados de menor (nome, escola) em console, Sentry, eventos de analytics.
- ❌ Compartilhar dados pessoais com varejistas no MVP.
- ❌ Implementar checkout, Pix, ou qualquer coisa de pagamento (não existe no MVP).
- ❌ Bypassar RLS via service_role no client.
- ❌ Hardcode de URLs de produção em código, EXCETO valores públicos por design (anon JWTs, URLs públicas) quando a plataforma de build não suporta env vars build-time. Quando aplicar essa exceção, documentar inline com comentário explícito. Hoje aplicada em `src/integrations/supabase/client.ts`. Issue follow-up para reverter quando Lovable Cloud suportar env vars.
- ❌ Console.log órfão em commit final.
- ❌ TODO sem issue número associada.
- ❌ Commits "WIP" ou "fix" sem mensagem útil.

---

## 12. Comandos úteis

```bash
# Dev
npm run dev              # vite dev server
npm run build            # build produção
npm run preview          # preview build

# Quality
npm run type-check       # tsc --noEmit
npm run lint             # eslint
npm run format           # prettier --write

# Supabase
npx supabase start                                    # local instance
npx supabase db reset                                 # reseta DB local
npx supabase gen types typescript --linked > src/types/database.ts
npx supabase functions deploy <name>                  # deploy edge function
npx supabase functions invoke <name> --body '{}'      # testar edge function

# Git
git checkout -b feat/lc-XXX-slug-curto
git commit -m "feat(scope): mensagem clara"
git push -u origin feat/lc-XXX-slug-curto
```

---

## 13. Quando algo der errado

- **Build quebra após pull:** rode `rm -rf node_modules && npm ci`.
- **Types do Supabase desatualizados:** rode `npx supabase gen types typescript --linked > src/types/database.ts`.
- **RLS bloqueia query inesperadamente:** logue `auth.uid()` no client, confira role em `profiles`, ajuste policy com migration.
- **Edge Function timeout:** verifique se Gemini está respondendo, considere quebrar em múltiplas chamadas, ou aumentar timeout (limite Supabase 60s).
- **CORS error:** confira `_shared/cors.ts` e adicione origin se necessário.
- **Conflict em migration:** nunca edite migration já mergeada. Crie nova migration com fix.

---

## 14. Comunicação com o humano

- Cada PR tem **um** propósito. PR pequeno > PR gigante.
- Use comentários inline no PR para explicar decisões não-óbvias.
- Se uma issue está mal especificada, peça esclarecimento ANTES de codar — não infira.
- Se descobriu que outra issue precisa ser feita primeiro (dep oculta), pause e avise.
- Mantenha logs de progresso no thread do PR — não em chat externo.

---

## 15. Roadmap pós-MVP

Para ter contexto. **Não implemente nada disso sem ordem explícita.**

- Phase 6: Expansão geográfica (BH, SP, Curitiba) — só código de mudança simples (filtro UF na busca).
- Phase 7: Master agreement com Kalunga ou Magalu — substituir deep links de busca por API real de carrinho.
- Phase 8: WhatsApp Business API — substituir o queue manual.
- Phase 9: Retail media — anchor advertisers (CPG-01).
- Phase 10: Pagamento próprio (Pix agregado).

---

**Última revisão deste arquivo:** abril 2026
**Próxima revisão:** após cada sprint completo do BACKLOG.md.
