# AUDIT-AND-PR0-PATCHES.md

> **Auditoria do repo `mazinhoww-web/lista-certa-ia` após Lovable + lista de patches específicos para o PR #0.**
> Data: abril 2026.
> Baseado no estado do repo no momento desta análise (zip extraído).

---

## 🚦 Resumo executivo (placar)

```
✅ VERDE   30+ pontos — Lovable acertou na maior parte
🟡 AMARELO  4 pontos  — melhorias úteis, não bloqueantes
🔴 VERMELHO 5 pontos  — corrigir no PR #0 antes de seguir
```

**Veredicto:** o repo **está pronto para começar a LC-001 imediatamente após aplicar os 5 patches vermelhos**. O resto é polish.

---

## ✅ O que o Lovable entregou bem

### Estrutura
- `src/components/landing/` com Header, Hero, HowItWorks, ProconBanner, RetailersMarquee, ForSchools, Footer ✓
- `src/components/shared/` com Logo, AuroraBackground, AILoading, NumberCounter ✓
- `src/components/ui/` shadcn completo (60+ primitives) ✓
- `src/pages/` com LandingPage, LoginPage, PrivacyPage, TermsPage, NotFoundPage ✓
- `src/integrations/supabase/` autogerado pelo Lovable Cloud (client + types vazios) ✓
- `src/integrations/lovable/` wrapper de Auth do Lovable (Google OAuth) ✓
- `src/lib/supabase.ts` re-exportando o client ✓
- `src/content/privacy.md` com **a versão integral do PRIVACY.md** que entreguei ✓
- `src/hooks/useReducedMotion.ts` ✓

### Design system aplicado
- Tokens `lc-*` corretos em `tailwind.config.ts` ✓
- CSS vars + tokens `lc-*` em `src/index.css` ✓
- Inter via Google Fonts no `index.html` com `preconnect` ✓
- `:focus-visible` com outline `lc-blue` 2px ✓
- `prefers-reduced-motion` respeitado ✓
- Classe `lc-flag-br` (bandeira do Brasil sem emoji) implementada ✓
- `.lc-num` para tabular-nums ✓
- `.lc-grad-lime` para destaque do "certa" no hero ✓

### PWA (parcialmente)
- `vite-plugin-pwa` configurado em `vite.config.ts` com manifest completo ✓
- Service worker com **guard inteligente para preview Lovable** (não registra em iframe ou hosts `lovableproject.com`) ✓
- Ícones 192/512 + maskable + apple-touch-icon presentes em `public/` ✓
- `<html lang>`, theme-color e OG tags em `index.html` ✓
- **Mas:** o pacote `vite-plugin-pwa` **não está no `package.json`** (patch crítico abaixo).

### Login
- `LoginPage.tsx` chama `lovable.auth.signInWithOAuth("google", ...)` corretamente ✓
- Trata erro com `sonner` toast ✓
- Comentário `// TODO: LC-001` apontando para a próxima issue ✓

### Stack confirmada
- React 18 + Vite + TypeScript ✓
- Tailwind + shadcn/ui ✓
- Framer Motion v12 ✓
- lucide-react ✓
- @tanstack/react-query ✓
- react-hook-form + zod ✓
- react-router-dom v6 ✓
- @supabase/supabase-js ✓

### Bonus inesperados
- Vitest + Testing Library + jsdom instalados (não pedi, mas fica útil) ✓
- `lovable-tagger` em dev (component identifier para HMR) ✓
- `next-themes` (não usaremos no MVP, mas não atrapalha)
- `recharts`, `embla-carousel`, `vaul` (drawer), todos shadcn primitives ✓

### Documentação útil
- `.lovable/plan.md` lista o que **o próprio Lovable sabe que faltou** — boa transparência ✓
- README placeholder (precisa reescrever) — ✓ existe

---

## 🔴 PATCHES CRÍTICOS (PR #0 — aplicar AGORA)

### Patch 1 — Segurança: `.env` no repo

**Problema:** `.env` foi commitado com chaves reais. `.gitignore` não tem `.env`.

**Impacto:** baixo (a chave é `anon`, pública por design — qualquer usuário do frontend a tem). Mas é prática ruim e dificulta gerenciar múltiplos ambientes.

**Patch:**

```bash
# 1. Adicionar ao .gitignore
echo "" >> .gitignore
echo "# Environment files" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore

# 2. Renomear .env atual para .env.local (não versionado)
mv .env .env.local

# 3. Remover .env do tracking
git rm --cached .env 2>/dev/null || true

# 4. Commit
git add .gitignore .env.local
git commit -m "chore(security): move .env to .env.local and gitignore env files"
```

> ⚠️ **Sobre rotacionar a chave:** não é necessário (anon key é pública por design), mas se quiser ser zero-risk, regenere em Lovable Cloud → Settings → API.

---

### Patch 2 — `vite-plugin-pwa` ausente no `package.json`

**Problema:** `vite.config.ts` importa `VitePWA` de `"vite-plugin-pwa"`, mas o pacote não está em `dependencies` nem `devDependencies` do `package.json`. `npm ci` em ambiente limpo vai falhar.

**Patch:**

```bash
npm install -D vite-plugin-pwa workbox-window
git add package.json package-lock.json
git commit -m "fix(deps): add missing vite-plugin-pwa to devDependencies"
```

---

### Patch 3 — TypeScript strict habilitado

**Problema:** `tsconfig.app.json` está com `"strict": false`, `"noImplicitAny": false`, `"strictNullChecks": false`. O prompt original pedia strict. O `.lovable/plan.md` deixou explícito que isso ficou pendente: *"vou ligar com cuidado para não quebrar shadcn"*. Não ligaram.

**Impacto:** bugs vão passar batido em runtime. Especialmente crítico quando começarmos a lidar com dados de menor (LC-002+).

**Patch:** edite `tsconfig.app.json`:

```diff
     /* Linting */
-    "strict": false,
-    "noUnusedLocals": false,
-    "noUnusedParameters": false,
-    "noImplicitAny": false,
+    "strict": true,
+    "strictNullChecks": true,
+    "noImplicitAny": true,
+    "noUncheckedIndexedAccess": true,
+    "noUnusedLocals": true,
+    "noUnusedParameters": false,
     "noFallthroughCasesInSwitch": false,
```

E em `tsconfig.json` da raiz:

```diff
   "compilerOptions": {
     "paths": {
       "@/*": ["./src/*"]
     },
-    "noImplicitAny": false,
-    "noUnusedParameters": false,
     "skipLibCheck": true,
     "allowJs": true,
-    "noUnusedLocals": false,
-    "strictNullChecks": false
+    "noUnusedParameters": false,
+    "noUnusedLocals": false
   }
```

⚠️ **Atenção:** após habilitar, `npx tsc --noEmit -p tsconfig.app.json` vai apontar erros — o Claude Code precisa corrigir. Provavelmente só erros de `null`/`undefined` em handlers + alguns props opcionais. Tempo estimado: 30-60min.

---

### Patch 4 — Script `type-check` no `package.json`

**Problema:** sem script `npm run type-check`. CLAUDE.md exige isso antes de cada PR.

**Patch:** edite `package.json`, na seção `scripts`:

```diff
   "scripts": {
     "dev": "vite",
     "build": "vite build",
     "build:dev": "vite build --mode development",
     "lint": "eslint .",
+    "type-check": "tsc --noEmit -p tsconfig.app.json",
+    "format": "prettier --write \"src/**/*.{ts,tsx,css,md}\"",
     "preview": "vite preview",
     "test": "vitest run",
     "test:watch": "vitest"
   },
```

E instale prettier (se não houver):

```bash
npm install -D prettier
echo '{"printWidth": 100, "semi": true, "singleQuote": false, "tabWidth": 2}' > .prettierrc.json
git add package.json .prettierrc.json
git commit -m "chore(tooling): add type-check and format scripts"
```

---

### Patch 5 — Padronizar variáveis de ambiente

**Problema:** o `.env` real do Lovable usa `VITE_SUPABASE_PUBLISHABLE_KEY`, mas `src/integrations/supabase/client.ts` lê `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`, e `.env.example` documenta `VITE_SUPABASE_ANON_KEY`. Resultado: confusão futura.

**Decisão:** seguir o **padrão do Lovable Cloud** (`PUBLISHABLE_KEY`) já que é o que o client autogerado usa. Atualizar `.env.example` e adicionar `WHATSAPP_NUMBER` + `SITE_URL`.

**Patch:** reescrever `.env.example`:

```env
# Lovable Cloud (preenchido automaticamente em produção)
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=

# ListaCerta — produto
VITE_WHATSAPP_NUMBER=5565996076018
VITE_SITE_URL=https://listacertaescolar.com.br
```

---

## 🟡 PATCHES DE POLISH (não bloqueantes — incluir no PR #0 se sobrar tempo)

### Polish 1 — `<html lang="en">` → `pt-BR`

Em `index.html`, linha 2:
```diff
-<html lang="en">
+<html lang="pt-BR">
```

### Polish 2 — README útil

Substituir `README.md` por uma versão concisa apontando para os docs canônicos:

```markdown
# ListaCerta

Plataforma neutra que conecta pais brasileiros à lista oficial de material escolar dos filhos, com IA que monta carrinhos otimizados em múltiplos varejistas. Foco inicial: Cuiabá, MT.

## Quick start

\`\`\`bash
npm install
cp .env.example .env.local  # preencher com credenciais Lovable Cloud
npm run dev
\`\`\`

## Documentos canônicos

- `CLAUDE.md` — convenções e constituição do agente Claude Code
- `BACKLOG.md` — 16 issues estruturadas (LC-001 a LC-016)
- `DESIGN.md` — sistema de design vinculante
- `HANDOFF.md` — playbook da transição Lovable → Claude Code
- `schema.sql` — schema Postgres com RLS
- `IMPORT-INEP-SCHOOLS.md` — import one-shot da base INEP
- `PRIVACY.md` / `RIPD.md` — governança LGPD

## Stack

React 18 + Vite + TypeScript strict + Tailwind + shadcn/ui + Framer Motion + Supabase (Lovable Cloud) + Gemini 2.0 Flash.

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run type-check` — verificação de tipos sem emitir
- `npm run lint` — ESLint
- `npm run test` — Vitest

Domínio futuro: listacertaescolar.com.br · WhatsApp: +55 (65) 99607-6018
```

### Polish 3 — `NavLink.tsx` órfão

`src/components/NavLink.tsx` não é usado por ninguém. Confirme com `grep -r "from.*NavLink" src/` antes de deletar.

### Polish 4 — Atualizar dedupe no `vite.config.ts`

`framer-motion` não está em `dedupe`. Adicione:

```diff
   resolve: {
     alias: { "@": path.resolve(__dirname, "./src") },
-    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
+    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core", "framer-motion"],
   },
```

---

## 📦 Adições canônicas (arquivos da raiz do repo)

Antes de mergear o PR #0, copie para a raiz do repo:

| Arquivo | De onde | Por quê |
|---|---|---|
| `CLAUDE.md` | pacote outputs | constituição do Claude Code |
| `BACKLOG.md` | pacote outputs | 16 issues |
| `HANDOFF.md` | pacote outputs | playbook transição |
| `DESIGN.md` | pacote outputs | design system canônico |
| `RIPD.md` | pacote outputs | governança LGPD |
| `schema.sql` | pacote outputs | schema Postgres |
| `catalog-seed.json` | pacote outputs | catálogo SKU base |
| `IMPORT-INEP-SCHOOLS.md` | pacote outputs | import one-shot |
| `NEXT-STEPS.md` | pacote outputs | índice operacional |
| `CLAUDE-START.md` | pacote outputs | kickoff PR #0 e LC-001 |
| `AUDIT-AND-PR0-PATCHES.md` | este arquivo | histórico da auditoria |

> **`PRIVACY.md`:** já está renderizado em `src/content/privacy.md`. **Crie cópia também na raiz** (referência canônica + reuso fora da app).

---

## 🎯 Pronto para LC-001?

**Sim, após o PR #0**. O repo tem fundação robusta:

- Login Google funciona (`lovable.auth.signInWithOAuth`)
- Supabase client tipado (types regeneráveis com schema real)
- Estrutura de pastas conforme `CLAUDE.md`
- Design system aplicado
- PWA configurado (precisa só do patch 2)

**O que falta para LC-001:**
- Rodar `schema.sql` no SQL Editor (humano)
- Importar CSV via `IMPORT-INEP-SCHOOLS.md` (humano + edge function)
- Regenerar `src/integrations/supabase/types.ts` com `npx supabase gen types`
- Implementar `AuthContext`, `ProtectedRoute`, `AuthCallbackPage`, `ForbiddenPage`

Tudo isso está detalhado na issue LC-001 do `BACKLOG.md` e nos prompts do `CLAUDE-START.md`.

---

## 🤖 Prompt único para o Claude Code aplicar TODOS os patches do PR #0

**Cole isso na CLI do Claude Code** dentro de `lista-certa-ia/`:

````
Você é o Claude Code aplicando o PR #0 — saneamento do bootstrap — no repo da ListaCerta. A auditoria foi feita externamente e está em AUDIT-AND-PR0-PATCHES.md.

PASSO 1 — Leia, em ordem:
1. CLAUDE.md (constituição)
2. AUDIT-AND-PR0-PATCHES.md (auditoria + 5 patches críticos + 4 polishes)
3. .lovable/plan.md (contexto histórico do que o Lovable entregou)

PASSO 2 — Confirme que entendeu listando para mim:
- Os 5 patches críticos em uma frase cada
- Os 4 polishes em uma frase cada
- Sua estimativa de quanto tempo vai levar

PASSO 3 — Após meu OK, aplique os patches NESTA ORDEM, cada um em commit separado:

a) Patch 1 — Segurança .env (mover .env → .env.local, atualizar .gitignore, git rm --cached)
b) Patch 2 — Adicionar vite-plugin-pwa + workbox-window em devDependencies (npm install -D)
c) Patch 5 — Reescrever .env.example padronizando VITE_SUPABASE_PUBLISHABLE_KEY
d) Patch 4 — Adicionar scripts type-check e format no package.json + criar .prettierrc.json (npm install -D prettier)
e) Patch 3 — Habilitar TypeScript strict em tsconfig.app.json e ajustar tsconfig.json da raiz. Após habilitar, rode npx tsc --noEmit -p tsconfig.app.json e CORRIJA os erros que aparecerem em código nosso (src/components/landing/*, src/components/shared/*, src/pages/*, src/lib/*, src/hooks/*). NÃO toque em src/components/ui/* (shadcn) — se houver erro lá, adicione esses arquivos a um exclude temporário em tsconfig.app.json e me reporte.
f) Polish 1 — index.html: lang="pt-BR"
g) Polish 4 — adicionar framer-motion ao dedupe em vite.config.ts

PASSO 4 — Polish 2 (README) e Polish 3 (NavLink órfão):
- Reescrever README.md com a versão da auditoria.
- Confirmar com `grep -r "from.*NavLink" src/` se NavLink é usado. Se não for, deletar.

PASSO 5 — Adicionar arquivos canônicos à raiz (eu vou colá-los manualmente, mas você cria os placeholders apenas dos ainda inexistentes). Os arquivos esperados estão na seção "Adições canônicas" do AUDIT-AND-PR0-PATCHES.md.

Se algum dos arquivos canônicos já estiver na raiz quando você for aplicar, NÃO sobrescreva — apenas pule e me avise.

PASSO 6 — Smoke test final:
- `npm run dev` sobe sem warnings
- `npm run type-check` passa com zero erros
- `npm run lint` passa com zero erros
- `npm run build` finaliza sem erros
- Landing renderiza visualmente igual ao antes

PASSO 7 — Quando tudo passar, prepare a descrição do PR seguindo o template do CLAUDE.md seção 9 e me dê o comando exato para abrir (gh pr create...) ou me liste os passos manuais.

NÃO comece nenhum dos patches sem meu OK explícito após PASSO 2.
````

---

## 📋 Issues seguintes — preview rápido

Após PR #0 mergeado, o fluxo segue conforme `BACKLOG.md`:

```
✓ PR #0  — Saneamento (este patch)
☐ LC-001 — Auth + AuthContext + ProtectedRoute + types Supabase
☐ LC-002 — Cadastro de escola (busca INEP + cep-promise)
☐ LC-003 — Aguardando aprovação + Dashboard escola básico
☐ LC-004 — Painel admin + Edge Function notify-school-approved
... (mais 12 issues)
```

A LC-001 vai precisar:
1. Rodar `schema.sql` (humano)
2. Importar CSV via `IMPORT-INEP-SCHOOLS.md` (humano + função)
3. `npx supabase gen types typescript --linked > src/integrations/supabase/types.ts` (humano)
4. Implementar Auth + ProtectedRoute (Claude Code)

---

**Versão:** 1.0 — abril 2026
**Auditor:** Claude (Anthropic) via análise externa do zip
**Próxima ação:** humano → cola o prompt do PASSO 7 acima na CLI do Claude Code dentro do repo.
