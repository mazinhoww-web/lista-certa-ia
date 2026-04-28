# HANDOFF.md

> Carta de transição entre o **Lovable** (onde foi gerada a fundação do produto) e o **Claude Code** (que continua a construção via PRs no GitHub). Este documento é lido uma vez, no início — e revisitado se algo do "esperado" estiver muito divergente do encontrado.

---

## O que esperar do repositório quando o Claude Code entrar

Após você executar com sucesso o `PROMPT-LOVABLE-INITIAL.md`, o repositório deve ter:

### Fundação técnica
- ✅ Vite + React 18 + TypeScript em modo strict
- ✅ Tailwind configurado com tokens `lc-*`
- ✅ shadcn/ui instalado (pelo menos Button, Card, Input, Badge, Toast)
- ✅ Framer Motion + lucide-react instalados
- ✅ react-router-dom v6 com rotas `/`, `/login`, `/auth/callback` (placeholder), `*`
- ✅ vite-plugin-pwa com manifest válido
- ✅ Path aliases `@/*` em `tsconfig.json` e `vite.config.ts`
- ✅ ESLint + Prettier configurados
- ✅ `.env.example` documentado

### Componentes prontos
- ✅ `src/components/shared/Logo.tsx` com SVG inline do C-Tick
- ✅ `src/components/shared/AuroraBackground.tsx` (blue + lime apenas)
- ✅ `src/components/shared/AILoading.tsx` (overlay com texto rotativo)
- ✅ `src/components/shared/NumberCounter.tsx`
- ✅ `src/components/landing/*` — Header, Hero, HowItWorks, ProconBanner, RetailersMarquee, ForSchools, Footer

### Páginas
- ✅ `LandingPage.tsx` totalmente animada e visualmente impactante
- ✅ `LoginPage.tsx` placeholder com botão Google
- ✅ `NotFoundPage.tsx`

### Banco e backend
- ❌ **Schema NÃO foi rodado** — o usuário roda como primeiro passo da issue LC-001.
- ❌ **Edge Functions NÃO foram criadas** — vêm em LC-004 em diante.
- ❌ **Tabela `inep_schools` NÃO foi populada** — passo manual em LC-001.

---

## Diferenças prováveis entre o esperado e o real

O Lovable é IA criativa — ele costuma fazer pequenos desvios do prompt. Lista de coisas que o Claude Code deve esperar e ajustar logo no primeiro PR de "saneamento":

### Suspeitas comuns

1. **TypeScript pode estar em strict false ou config minimalista.** Verifique `tsconfig.json` e force `strict: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`.

2. **Ícones de papelaria infiltrados.** Lovable adora colocar ícone de lápis, caderno, mochila. Audite `src/components/landing/HowItWorks.tsx` e troque por Search, Sparkles, ShoppingCart conforme `DESIGN.md`.

3. **Cores fora do design system.** Lovable pode ter colocado classes Tailwind com `bg-blue-600` em vez de `bg-lc-blue`. Procure por classes Tailwind padrão e troque por tokens `lc-*`.

4. **Inter pode não estar carregando.** Verifique `globals.css` e `index.html`. Se faltar `@import` Google Fonts ou `<link>`, adicione.

5. **Footer faltando em algumas páginas.** Lovable tende a colocar Footer só na Landing. Mova para um `<Layout>` que envolve todas as rotas.

6. **PWA pode estar incompleto.** Verifique se `vite-plugin-pwa` foi instalado e configurado em `vite.config.ts` com manifest correto.

7. **AuroraBackground pode estar com cores erradas (purple/pink em vez de blue+lime).** Audite e corrija.

8. **Pode ter colocado animações exageradas.** Audite e respeite `prefers-reduced-motion`.

9. **Configuração de Supabase pode estar usando string literal em vez de env vars.** Verifique `src/lib/supabase.ts`.

10. **Pode ter criado componentes/pastas extras não pedidos.** Mantenha o que faz sentido, mas alinhe com a estrutura prescrita.

### Não desperdice tempo com

- Documentos `.md` que o Lovable criou por iniciativa (`COMPONENTS.md`, `STYLE_GUIDE.md` etc) — apague.
- Rotas extras que o Lovable inventou (`/dashboard`, `/sobre`) sem você ter pedido — apague ou mova para placeholder.
- README inflado — substitua por versão concisa apontando para `CLAUDE.md`, `DESIGN.md`, `BACKLOG.md`.

---

## Primeiro PR do Claude Code

Antes de atacar a issue LC-001, abra um **PR de saneamento** com escopo único:

### PR #0 — Sanitização do bootstrap

```
Título: chore(bootstrap): align project with CLAUDE.md conventions
Branch: chore/bootstrap-sanitization
Closes: nada (housekeeping)
```

**Acceptance Criteria:**

- [ ] Adicionar `CLAUDE.md`, `BACKLOG.md`, `HANDOFF.md`, `DESIGN.md`, `PRIVACY.md`, `RIPD.md`, `schema.sql`, `catalog-seed.json` à raiz do repo.
- [ ] Auditar e corrigir desvios da fundação:
  - [ ] `tsconfig.json` com `strict: true` etc.
  - [ ] Tokens `lc-*` aplicados em todo lugar (sem `bg-blue-600` solto).
  - [ ] Inter carregando.
  - [ ] AuroraBackground com cores corretas.
  - [ ] PWA configurado.
  - [ ] Path aliases funcionando.
  - [ ] `.env.example` completo.
- [ ] Criar `<Layout>` que envolve todas as rotas e renderiza Header + outlet + Footer.
- [ ] Substituir README com versão concisa apontando para os docs canônicos.
- [ ] Apagar arquivos `.md` órfãos que o Lovable criou.
- [ ] Apagar rotas/componentes inventados que não estão no escopo.
- [ ] Confirmar que `npm run dev` sobe sem warnings.
- [ ] Confirmar que `npm run type-check` passa.
- [ ] Confirmar que `npm run lint` passa.

**Resultado:** repositório alinhado com `CLAUDE.md`, pronto para sprint 1.

---

## Como configurar Supabase types automaticamente

Antes de começar LC-001:

```bash
# Instalar CLI do Supabase
npm install -g supabase

# Linkar ao projeto Lovable Cloud
npx supabase link --project-ref <project-ref-do-lovable-cloud>

# Após rodar schema.sql, gerar types
npx supabase gen types typescript --linked > src/types/database.ts
```

Adicionar ao `package.json`:
```json
"scripts": {
  "types:generate": "supabase gen types typescript --linked > src/types/database.ts"
}
```

Rodar `npm run types:generate` toda vez que mexer em schema. Idealmente adicionar como pre-commit hook (Husky) — mas pode ficar manual no MVP.

---

## Como criar Edge Functions

```bash
# Criar nova função
npx supabase functions new <nome>

# Deploy
npx supabase functions deploy <nome>

# Testar localmente
npx supabase functions serve <nome>

# Invocar
curl -X POST 'https://<project>.supabase.co/functions/v1/<nome>' \
  -H 'Authorization: Bearer <ANON_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Funções usam segredos do Supabase Cloud (Settings → Edge Functions → Secrets):
- `GOOGLE_AI_KEY`
- `RESEND_API_KEY`
- `WA_NUMBER`
- `ADMIN_EMAIL`

Em código Deno:
```ts
const apiKey = Deno.env.get('GOOGLE_AI_KEY');
if (!apiKey) throw new Error('GOOGLE_AI_KEY not configured');
```

---

## Branching e PR strategy

```
main          ← branch protegida, só recebe PRs aprovados
└── feat/lc-XXX-slug-curto
└── chore/bootstrap-sanitization
└── fix/lc-XXX-slug
```

**Regras:**
- 1 issue = 1 branch = 1 PR.
- PR descreve "what + why + how + smoke test".
- Squash merge.
- Nunca force push em `main`.
- Reverts via novo PR (`git revert`), não force.

---

## Onde ficam segredos

| Onde | O que |
|---|---|
| `.env.local` (gitignored) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WHATSAPP_NUMBER`, `VITE_SITE_URL` |
| Supabase Cloud → Edge Functions Secrets | `GOOGLE_AI_KEY`, `RESEND_API_KEY`, `WA_NUMBER`, `ADMIN_EMAIL` |
| GitHub Secrets (CI/CD futuro) | mesmas chaves do Supabase, replicadas para deploy automatizado |

⚠️ **Nunca commitar `.env.local`.** Verifique `.gitignore`.

---

## Convenções de PR para o Claude Code

Quando o agente abrir um PR, espere ver:

1. **Título** em formato Conventional Commit: `feat(auth): add Google OAuth callback handler`.
2. **Descrição** seguindo o template do `CLAUDE.md` seção 9.
3. **Diff focado** — apenas arquivos relevantes para a issue.
4. **Smoke test** descrito.
5. **Screenshots** se mexeu em UI.
6. **Lista de TODOs deixados intencionalmente**, com link para issue follow-up.

Se um PR vier sem isso, peça antes de revisar.

---

## Comunicação durante PRs

- O agente lê comentários do PR como instruções.
- Use **comentário inline** para feedback localizado.
- Use **comentário geral** para mudanças de direção.
- Se o agente discordar de um pedido, ele DEVE explicar por quê com referências (DESIGN.md, BACKLOG.md, etc).

---

## Quando dar reset no agente

Se o Claude Code entrar em loop, fizer mudanças não pedidas, ou estiver claramente off-script:

1. Peça para o agente **parar** e listar o que entendeu.
2. Aponte o que está fora do escopo.
3. Se persistir, **abra nova sessão** e cole apenas o `CLAUDE.md` + a issue específica.
4. Se continuar errado, **escreva você mesmo** o trecho problemático e peça pro agente continuar a partir dali.

---

## Métricas de sucesso da transição

Você sabe que a transição foi bem-sucedida quando:

- ✅ Após PR #0, o `npm run dev` sobe sem warnings.
- ✅ Lighthouse mobile da landing > 85 performance, > 95 acessibilidade.
- ✅ Os 16 itens do `BACKLOG.md` parecem viáveis e bem dimensionados.
- ✅ A primeira sessão do Claude Code consegue ler `CLAUDE.md` + LC-001 e começar a trabalhar sem perguntas óbvias.

---

**Boa transição.** Quando fechar o PR #0, abra a issue LC-001 e siga.

---

**Versão:** 1.0 — abril 2026
