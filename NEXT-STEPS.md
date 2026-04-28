# NEXT-STEPS.md — ListaCerta MVP

> **O caminho completo, em um só lugar.** Cada checkbox é um passo. Estimativa total: ~3 semanas até MVP rodando com 5 escolas piloto em Cuiabá.

**Repositório:** https://github.com/mazinhoww-web/lista-certa-ia
**Stack:** Lovable + Lovable Cloud (Supabase) + Google Gemini + Claude Code via PRs
**Geografia:** Cuiabá / Várzea Grande, MT

---

## 📋 Mapa do pacote — qual doc consultar para cada coisa

| Doc | Quando ler |
|---|---|
| **NEXT-STEPS.md** (este) | Sempre. É o índice operacional. |
| `DESIGN.md` | Antes de criar QUALQUER UI. Sistema de design vinculante. |
| `BACKLOG.md` | Antes de começar uma issue. As 16 issues estão lá numeradas LC-001 a LC-016. |
| `CLAUDE.md` | Vai pra raiz do repo. Claude Code lê em toda sessão. |
| `HANDOFF.md` | Lido pelo Claude Code na primeira sessão. Lista 10 desvios típicos do Lovable a corrigir. |
| `IMPORT-INEP-SCHOOLS.md` | One-shot pra importar o CSV das escolas. |
| `PRIVACY.md` / `RIPD.md` | Governança LGPD. Vira página `/privacidade` e doc interno. |
| `schema.sql` | Você roda no SQL Editor do Lovable Cloud na Etapa 4. |
| `catalog-seed.json` | Importado por Edge Function depois (LC-012). |
| `PROMPT-LOVABLE-INITIAL.md` | Único prompt no Lovable. Etapa 2. |

---

## ⚙️ ETAPA 1 — Configurações (30 min, único dia)

### 1.1 Lovable Cloud
- [ ] Ativar Lovable Cloud no projeto.
- [ ] Confirmar SQL Editor, Storage, Edge Functions e Auth habilitados.

### 1.2 Google OAuth
- [ ] Google Cloud Console → criar OAuth 2.0 Client ID.
- [ ] **Authorized JavaScript origins:** URL preview Lovable + `https://listacertaescolar.com.br`.
- [ ] **Authorized redirect URIs:** `https://[seu-projeto].supabase.co/auth/v1/callback`.
- [ ] No Lovable Cloud → Auth Providers → Google → habilitar com Client ID + Secret.

### 1.3 Secrets em Lovable Cloud (Edge Functions Secrets)

| Nome | Valor |
|---|---|
| `GOOGLE_AI_KEY` | sua chave do Google AI Studio (gratuita) |
| `RESEND_API_KEY` | crie conta gratuita em resend.com |
| `WA_NUMBER` | `5565996076018` |
| `ADMIN_EMAIL` | seu email |

### 1.4 Anthropic API key (para Claude Code)
- [ ] Conta ativa em https://console.anthropic.com com pelo menos $5 de crédito ou plano Pro.
- [ ] Gere uma API key e guarde no seu gerenciador de senhas. **Nunca cole em lugar nenhum além do `claude-code auth` localmente.**

### 1.5 Anexar ao Lovable Knowledge

No painel do Lovable, em **Project Knowledge**, suba:

- [ ] `DESIGN.md`
- [ ] `PRIVACY.md`
- [ ] `ListaCerta — Brand Book.pdf`
- [ ] `logo-listacerta.svg` (extraído do Brand Book página 02)
- [ ] Favicons (`favicon.ico`, `icon-192.png`, `icon-512.png`, `icon-maskable-432.png`, `apple-touch-icon-180.png`) — gerar em https://realfavicongenerator.net

⚠️ **Não suba o CSV das escolas.** Ele já está no bucket `listaescolasinep`.

---

## 🚀 ETAPA 2 — Lovable (1-2 dias)

### 2.1 Colar o prompt
- [ ] Abrir o projeto no Lovable.
- [ ] Copiar **integral** o conteúdo de `PROMPT-LOVABLE-INITIAL.md` (do começo do bloco ` ``` ` até o fim do bloco).
- [ ] Colar no chat do Lovable e enviar. **Não fragmentar.**

### 2.2 Validar o resultado

O Lovable vai gerar a fundação. Após terminar, valide:

- [ ] Hero da landing visível em mobile 380px sem scroll horizontal.
- [ ] Aurora background (azul + lime) animada suavemente, não distrai.
- [ ] Inter carregando como font-family principal.
- [ ] Botão "Entrar com Google" presente em /login (sem fluxo completo ainda).
- [ ] Estrutura de pastas em `src/` confere com o que o prompt pediu.
- [ ] PWA instalável (testar no Chrome mobile).

Se algo essencial estiver desviado, dê prompts curtos no Lovable para corrigir. Ex: *"Faltou aplicar Inter como font-family base. Configure no globals.css e tailwind.config.js."*

---

## 🔗 ETAPA 3 — Conectar GitHub (15 min)

### 3.1 Conexão automática
- [ ] No painel do Lovable, "Connect to GitHub" → selecionar `mazinhoww-web/lista-certa-ia`.
- [ ] Confirmar que o código foi sincronizado.

### 3.2 Clone local
```bash
git clone https://github.com/mazinhoww-web/lista-certa-ia.git
cd lista-certa-ia
npm install
npm run dev   # confirma que sobe sem erros
```

### 3.3 Copiar arquivos canônicos para a raiz do repo

Da pasta de outputs deste pacote, copie para a raiz do repo:

- [ ] `CLAUDE.md`
- [ ] `BACKLOG.md`
- [ ] `HANDOFF.md`
- [ ] `DESIGN.md`
- [ ] `PRIVACY.md`
- [ ] `RIPD.md`
- [ ] `schema.sql`
- [ ] `catalog-seed.json`
- [ ] `IMPORT-INEP-SCHOOLS.md`

### 3.4 PR #0 — Sanitização
```bash
git checkout -b chore/bootstrap-sanitization
git add .
git commit -m "chore(bootstrap): add canonical docs and align project conventions"
git push -u origin chore/bootstrap-sanitization
```

Abra PR no GitHub, leia o `HANDOFF.md` (seção "PR #0 — Sanitização do bootstrap") e aplique correções de desvios típicos do Lovable (TypeScript strict, tokens lc-*, Inter, AuroraBackground com cores certas, etc). Mergeie.

---

## 🗄 ETAPA 4 — Schema + CSV (30-60 min)

### 4.1 Rodar schema.sql

- [ ] Lovable Cloud → SQL Editor.
- [ ] Cole **todo** o conteúdo de `schema.sql` e execute.
- [ ] Verifique no Table Editor que essas tabelas existem: `profiles`, `schools`, `school_admins`, `lists`, `list_items`, `catalog_items`, `retailer_links`, `students`, `students_access_log`, `carts`, `deep_link_clicks`, `communications`, `whatsapp_captures`, `inep_schools`.

### 4.2 Importar o CSV das escolas

Veja **`IMPORT-INEP-SCHOOLS.md`** — passo a passo completo. Resumo:

- [ ] Criar Edge Function `import-inep-schools` (código completo no doc).
- [ ] Pegar `service_role` key em Lovable Cloud → Settings → API.
- [ ] Abrir console do navegador, colar o script JS do doc, trocar a key, executar.
- [ ] Aguardar ~10-15 min (37 chunks × ~20s).
- [ ] Validar:
   ```sql
   SELECT COUNT(*) FROM public.inep_schools;        -- ~181000
   SELECT COUNT(*) FROM public.inep_schools WHERE uf = 'MT';   -- 4000-7000
   SELECT * FROM public.search_inep_schools('emef', 'MT', 5);  -- retorna escolas
   ```
- [ ] Apagar o CSV do bucket após validar.

---

## 🤖 ETAPA 5 — Claude Code: Sprint 1 (3-4 dias)

A partir daqui, **toda implementação é via PR** com Claude Code rodando localmente na sua máquina.

### 5.1 Setup do Claude Code (uma vez só)

```bash
# Instalar a CLI
npm install -g @anthropic-ai/claude-code

# Autenticar com sua API key (não me passe — você cola só uma vez localmente)
claude

# Na primeira execução, ele pede a key e salva localmente
```

### 5.2 Primeira sessão — Issue LC-001

Dentro da pasta do repo:

```bash
cd lista-certa-ia
claude
```

E dê o prompt inicial:

> **"Leia CLAUDE.md e HANDOFF.md, depois leia a issue LC-001 do BACKLOG.md. Faça um plano de ataque sucinto e abra um PR para a issue. Não comece a codar até eu confirmar o plano."**

Esse padrão (ler-planejar-confirmar-implementar) deve ser seguido em **todas** as issues. Reduz erro e retrabalho.

### 5.3 Sprint 1 — fluxo de issues

| Issue | O que entrega | Estimativa |
|---|---|---|
| **LC-001** | Auth Google + Supabase types + ProtectedRoute + redirecionamento por role | M (4h) |
| **LC-002** | Cadastro de escola (busca INEP + form com cep-promise) | L (8h) |
| **LC-003** | Tela "aguardando aprovação" + Dashboard escola básico | M (4h) |
| **LC-004** | Painel admin + Edge Function notify-school-approved | M (5h) |

Para cada uma:
1. Crie nova branch: `git checkout -b feat/lc-XXX-slug-curto`
2. Rode `claude` no terminal e peça pra resolver a issue
3. Revise o diff antes de commit
4. Rode `npm run type-check && npm run lint` antes de push
5. Abra PR seguindo o template do `CLAUDE.md`
6. Mergeie após smoke test passar
7. Próxima issue

### 5.4 Sprints seguintes (referência rápida)

| Sprint | Issues | Foco |
|---|---|---|
| Sprint 2 | LC-005 a LC-008 | IA OCR, validador Procon, publicar lista, comunicados |
| Sprint 3 | LC-009 a LC-013 | Jornada do pai (busca, lista, carrinho IA, deep links) |
| Sprint 4 | LC-014 a LC-016 | Admin observabilidade, WhatsApp queue, polimento |

Tudo detalhado no `BACKLOG.md`.

---

## 🚨 Quando algo der errado

| Sintoma | Causa provável | Ação |
|---|---|---|
| Lovable gera layout genérico | Knowledge não anexado | Re-anexar arquivos e dar prompt curto: *"Use o DESIGN.md anexado, especificamente os tokens lc-*"* |
| Inter não carrega | Falta `<link>` no index.html | Adicionar manualmente em `index.html` |
| Lovable inventou rotas extras | Comportamento normal | Apague no PR #0 |
| RLS bloqueia tudo | `auth.uid()` vazio | Logar `useAuth()` no client, conferir `profiles.role` |
| Gemini retorna 403 | `GOOGLE_AI_KEY` inválida | Regenerar em Google AI Studio |
| Edge Function timeout | Imagem muito grande | Resize no client antes do upload, max 1024px |
| Resend não envia | Domínio não verificado | Adicionar `listacertaescolar.com.br` no painel Resend (SPF/DKIM) |
| Claude Code modifica arquivos não pedidos | Não leu CLAUDE.md | Encerre a sessão, re-abra com prompt: *"Leia CLAUDE.md primeiro. Aplique a regra Ask first, act second."* |
| Build quebra após `git pull` | Dependências desatualizadas | `rm -rf node_modules && npm ci` |
| Types do Supabase desatualizados | Schema mudou | `npx supabase gen types typescript --linked > src/types/database.ts` |

---

## ✅ Definição de pronto do MVP

Você sabe que o MVP está pronto para soft launch quando:

- [ ] 5 escolas amigas em Cuiabá têm conta criada e lista publicada validada Procon.
- [ ] 50 pais cadastrados de pelo menos 3 dessas 5 escolas.
- [ ] 20 carrinhos IA gerados, accuracy de matching > 80%.
- [ ] 10 cliques em deep link de varejista (Kalunga + Magalu) com tracking.
- [ ] 5 capturas via WhatsApp processadas com sucesso.
- [ ] PWA instalável em iOS Safari e Android Chrome.
- [ ] Política de privacidade publicada, DPO nomeado, RIPD documentada.
- [ ] Funil completo no admin: home → busca → lista → carrinho → deep link.
- [ ] Lighthouse mobile > 85 performance, > 95 acessibilidade.

---

## 🎯 Cronograma agregado

```
Semana 1:
  D1     Etapa 1 (configs)
  D1     Etapa 2 (Lovable cola prompt + revisa)
  D2-3   Etapa 3 (PR #0 saneamento)
  D3     Etapa 4 (schema + import CSV)
  D4-7   Sprint 1 (LC-001 a LC-004)

Semana 2:
  D8-11  Sprint 2 (LC-005 a LC-008)
  D12-14 Sprint 3 inicial (LC-009 a LC-011)

Semana 3:
  D15-17 Sprint 3 final (LC-012 a LC-013)
  D18-20 Sprint 4 (LC-014 a LC-016)
  D21    Smoke test end-to-end com 1 escola real

Semana 4:
  D22+   Soft launch com 5 escolas piloto
```

---

## 💡 Princípios para se manter sane durante a construção

1. **Uma issue = uma branch = um PR.** Nunca mistura escopo.
2. **Plano antes de código.** Peça plano, valide, depois implemente.
3. **Smoke test antes de mergear.** Sempre.
4. **Nunca ignore o DESIGN.md** — se o Lovable ou Claude Code propuserem algo que viola, corrija na hora.
5. **Dados de menor são sagrados.** Auditoria, RLS, mínimo necessário. Em dúvida, leia `RIPD.md`.
6. **Não use Anthropic API key, GitHub PAT ou nenhuma credencial em chat público.** Sempre local, sempre gerenciador de senhas.

---

**Boa construção.** 🛠️

Quando estiver na Etapa 5 e tiver dúvida pontual sobre uma issue, abra um chat aqui anexando os arquivos relevantes (CLAUDE.md, a issue do BACKLOG.md, e o erro/contexto). Eu ajudo a resolver sem precisar de credencial nenhuma.

---

**Versão:** 1.0 — abril 2026
**Última revisão:** abril 2026
