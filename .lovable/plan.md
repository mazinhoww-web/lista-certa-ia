## Diagnóstico — o que falta vs. último prompt

A landing v1 já entregue cobre boa parte do brief (design system 70/20/10, Inter, aurora, hero, how-it-works, Procon banner, marquee, for-schools, footer, NumberCounter, AILoading, Header sticky, Login placeholder). O ZIP traz **assets oficiais** que ainda não foram usados, e várias exigências técnicas do prompt canônico ficaram pendentes. Lista do gap real:

**Marca / assets**
- C-Tick atual é um SVG inline aproximado. O ZIP traz os arquivos **oficiais** (`symbol-ctick.svg`, `logo-listacerta.svg`, `logo-listacerta-white.svg`, PNGs de favicon e ícone 512). É preciso usar esses como fonte da verdade.

**PWA**
- Hoje só temos manifest + `<link rel="manifest">`. O prompt exige `vite-plugin-pwa` com `registerType: 'autoUpdate'` e service worker registrado (instalável de verdade). Precisa de guard para não rodar SW no preview Lovable (iframe).

**Auth**
- `/login` é placeholder com botão desativado. O prompt exige o botão chamando `lovable.auth.signInWithOAuth("google", …)` (Google OAuth gerenciado do Cloud).

**Páginas estáticas**
- Faltam `/privacidade` (renderizando o PRIVACY.md) e `/termos` (placeholder simples). Os links do footer apontam para elas.
- `404` atual é o template Lovable; trocar por versão da marca (ícone `CircleAlert` lc-coral, CTA voltar).

**Estrutura / qualidade**
- `tsconfig.app.json` está com `strict: false` e `strictNullChecks: false`. O prompt pede `strict: true` + `noUncheckedIndexedAccess`. Vou ligar com cuidado para não quebrar shadcn (mantenho `noImplicitAny: false` se necessário).
- Criar `.env.example`, `src/types/`, `src/hooks/useReducedMotion.ts` (hoje usamos o do Framer Motion direto), `src/lib/supabase.ts` re-exportando o client gerado.
- Renomear `Landing.tsx` → `LandingPage.tsx`, `Login.tsx` → `LoginPage.tsx`, `NotFound.tsx` → `NotFoundPage.tsx` para casar com a spec.

**Conteúdo**
- O subtítulo do hero hoje diz "Você busca a escola. A IA monta o carrinho. Você retira em 2h." — o prompt pede a versão completa "…ou recebe em 24h".
- O ProconBanner precisa do chip "Validador automático" lc-emerald-100 acima do título.
- Footer: hoje a coluna 1 fica isolada no mobile; ajustar grid 4-cols / 2-cols / 1-col.

**Fora de escopo (NÃO fazer agora, conforme proibições):**
Edge Functions, SQL, busca real, callback `/auth/callback`, telas logadas. Deixo apenas comentário `// TODO: LC-001` no Login para o callback futuro.

---

## Plano de execução

### 1. Trazer os assets oficiais para o projeto
- Copiar do ZIP para `public/`:
  - `symbol-ctick.svg` → `public/symbol-ctick.svg`
  - `logo-listacerta.svg` → `public/logo-listacerta.svg`
  - `logo-listacerta-white.svg` → `public/logo-listacerta-white.svg`
  - `icon-512.png`, `favicon-96x96.png`, `apple-touch-icon.png` → substituem os atuais.
- Reescrever `src/components/shared/Logo.tsx`: passa a ser **wrapper de `<img>`** que aponta para os SVGs oficiais conforme `variant`. Mantém props `size`, `variant ('default' | 'reverse-white' | 'mono-black' | 'icon')`. Variant `icon` usa `symbol-ctick.svg`.

### 2. PWA real com `vite-plugin-pwa`
- `bun add -d vite-plugin-pwa workbox-window`
- Atualizar `vite.config.ts` com `VitePWA({ registerType: 'autoUpdate', devOptions: { enabled: false }, workbox: { navigateFallbackDenylist: [/^\/~oauth/] }, manifest: {…} })`.
- Em `src/main.tsx`: registrar SW **apenas fora de iframe e fora de hosts de preview Lovable** (guard recomendado pela própria doc Lovable, evita travar o preview).
- Remover `public/manifest.webmanifest` (o plugin gera) e o `<link rel="manifest">` manual de `index.html`.

### 3. Conectar Google OAuth no `/login`
- Chamar a tool de configuração social para gerar `src/integrations/lovable/`.
- `LoginPage.tsx`: card centralizado com `<Logo />`, H1 "Entrar para continuar", sub "Você usa sua conta Google. Em segundos.", botão "Continuar com Google" branded (fundo branco, borda, ícone G colorido inline SVG, texto medium) que chama:
  ```ts
  lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })
  ```
  com tratamento de erro via `sonner` toast. Link pequeno para `/privacidade`.

### 4. Páginas estáticas
- `src/pages/PrivacyPage.tsx`: renderiza o conteúdo do PRIVACY.md (Markdown convertido manualmente em JSX seções, ou via `react-markdown` se aceitar instalar — vou usar **react-markdown + remark-gfm** com `prose` do Tailwind Typography que já está instalado). Header simples + Footer.
- `src/pages/TermsPage.tsx`: placeholder com headline "Termos de uso" + parágrafo "Documento em finalização. Para dúvidas: dpo@listacertaescolar.com.br". Header + Footer.
- `src/pages/NotFoundPage.tsx`: ícone `CircleAlert` lc-coral, H1 "Algo não saiu como esperado.", sub mid, botão "Voltar para o início" → `/`. Footer.

### 5. Roteamento e estrutura
- Renomear `Landing.tsx`/`Login.tsx`/`NotFound.tsx` → `LandingPage.tsx`/`LoginPage.tsx`/`NotFoundPage.tsx`.
- Atualizar `App.tsx` com rotas: `/`, `/login`, `/privacidade`, `/termos`, `*`.
- Criar `src/lib/supabase.ts` re-exportando o client autogerado (camada estável de import).
- Criar `src/types/index.ts` com placeholders de `Profile`, `School`, `ListItem`.
- Criar `src/hooks/useReducedMotion.ts` (re-export do Framer Motion para padronizar imports).
- Criar `.env.example` documentando `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WHATSAPP_NUMBER`, `VITE_SITE_URL`.

### 6. Ajustes de conteúdo / acabamento
- Hero: subtítulo passa a ser "Você busca a escola do seu filho. A IA monta o carrinho. Você retira em 2 horas ou recebe em 24."
- ProconBanner: adicionar chip "Validador automático" lc-emerald-100 antes do título.
- Footer: ajustar grid para `grid-cols-2 md:grid-cols-4` com a coluna 1 ocupando linha cheia em mobile (já está, validar).
- Substituir `<img>` do favicon por referência aos novos arquivos no `index.html`.

### 7. tsconfig
- `tsconfig.app.json`: ligar `strict: true`, `strictNullChecks: true`, `noUncheckedIndexedAccess: true`. Manter `noImplicitAny: false` se shadcn quebrar (decisão pragmática). Rodar typecheck do harness; se houver erro em código nosso, corrigir.

---

## Detalhes técnicos

**Estrutura final esperada:**
```text
src/
  components/
    landing/   Header Hero HowItWorks ProconBanner RetailersMarquee ForSchools Footer
    shared/    Logo AuroraBackground AILoading NumberCounter
    ui/        (shadcn — já existe)
  pages/       LandingPage  LoginPage  PrivacyPage  TermsPage  NotFoundPage
  hooks/       useReducedMotion
  lib/         supabase  utils
  types/       index
  integrations/
    supabase/  (autogerado — não tocar)
    lovable/   (gerado pela tool de social auth — não tocar)
```

**Service worker guard (evita travar preview):**
```ts
const isInIframe = (() => { try { return window.self !== window.top } catch { return true } })();
const isPreviewHost = location.hostname.includes('lovableproject.com') || location.hostname.includes('id-preview--');
if (!isInIframe && !isPreviewHost && 'serviceWorker' in navigator) {
  // registerSW from virtual:pwa-register
}
```

**Rotas:**
```text
/             LandingPage
/login        LoginPage   (Google OAuth via lovable.auth)
/privacidade  PrivacyPage (PRIVACY.md em prose Tailwind)
/termos       TermsPage
*             NotFoundPage
```

## Critérios de aceite
- [ ] Logo em todos os pontos usa o SVG oficial (Header, Footer, Login, NotFound).
- [ ] PWA instalável fora do iframe (manifest válido, ícones, SW autoUpdate).
- [ ] `/login` dispara OAuth Google real.
- [ ] `/privacidade` renderiza o PRIVACY.md em layout prose; `/termos` placeholder; `/404` da marca.
- [ ] Hero subtítulo com "ou recebe em 24"; ProconBanner com chip "Validador automático".
- [ ] tsconfig `strict: true`, sem erros novos no harness.
- [ ] `.env.example` presente; `src/lib/supabase.ts` exporta o client.
- [ ] Footer aparece em Landing, Login, Privacy, Terms, NotFound.