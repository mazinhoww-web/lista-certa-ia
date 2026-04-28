# CLAUDE-START.md

> **Arquivo único de kickoff.** Este documento contém tudo o que o Claude Code precisa para executar as duas primeiras peças do projeto ListaCerta — começando agora.
>
> Após colocar este arquivo na raiz do repo (junto com `CLAUDE.md`, `BACKLOG.md`, `DESIGN.md`, `schema.sql`, `IMPORT-INEP-SCHOOLS.md`, `HANDOFF.md`, `PRIVACY.md`, `RIPD.md`, `catalog-seed.json`), abra o Claude Code na pasta e siga este roteiro **em ordem**.

---

## ⚠️ Pré-requisitos para o humano (não para o Claude Code)

Antes de invocar o Claude Code, **você** (humano) precisa garantir:

### A. Repo local pronto
```bash
git clone https://github.com/mazinhoww-web/lista-certa-ia.git
cd lista-certa-ia
npm install
npm run dev   # confirma que sobe
```

### B. Arquivos canônicos na raiz do repo

Da pasta de outputs deste pacote, copie para a raiz do repo:

```bash
# rodar dentro de lista-certa-ia/
# ajuste o path de origem conforme onde os arquivos estão
cp /caminho/para/outputs/CLAUDE.md .
cp /caminho/para/outputs/CLAUDE-START.md .
cp /caminho/para/outputs/BACKLOG.md .
cp /caminho/para/outputs/DESIGN.md .
cp /caminho/para/outputs/HANDOFF.md .
cp /caminho/para/outputs/PRIVACY.md .
cp /caminho/para/outputs/RIPD.md .
cp /caminho/para/outputs/schema.sql .
cp /caminho/para/outputs/catalog-seed.json .
cp /caminho/para/outputs/IMPORT-INEP-SCHOOLS.md .
```

### C. Schema SQL rodado no Supabase
- [ ] Lovable Cloud → SQL Editor → cole o conteúdo de `schema.sql` → Run.
- [ ] Validar no Table Editor: 14 tabelas criadas (`profiles`, `schools`, `school_admins`, `lists`, `list_items`, `catalog_items`, `retailer_links`, `students`, `students_access_log`, `carts`, `deep_link_clicks`, `communications`, `whatsapp_captures`, `inep_schools`).

### D. CSV das escolas importado
- [ ] Veja `IMPORT-INEP-SCHOOLS.md`. Crie a Edge Function, invoque pelo console, valide com `SELECT COUNT(*) FROM inep_schools WHERE uf='MT'` retornando >4000.

### E. Claude Code instalado e autenticado
```bash
npm install -g @anthropic-ai/claude-code
cd lista-certa-ia
claude
# na primeira execução, ele pede a API key. Cole. Fica salvo localmente.
```

✅ Quando A→E estiverem todos `[x]`, prossiga para a Sessão 1.

---

## 🧹 SESSÃO 1 — PR #0: Saneamento do bootstrap

**O que essa sessão faz:** auditar o que o Lovable gerou, corrigir desvios típicos, e deixar o repo alinhado com `CLAUDE.md` antes de qualquer feature.

### 1.1 Crie a branch (você, no terminal)

```bash
git checkout -b chore/bootstrap-sanitization
```

### 1.2 Abra o Claude Code

```bash
claude
```

### 1.3 Cole **exatamente** este prompt na CLI

```
Você é o Claude Code trabalhando no repo da ListaCerta — uma plataforma neutra que conecta pais brasileiros à lista oficial de material escolar dos filhos, com IA que monta carrinhos otimizados em múltiplos varejistas.

Estamos no PR #0 — saneamento do bootstrap gerado pelo Lovable. Antes de QUALQUER feature, vamos alinhar o repo aos padrões.

PASSO 1 — Leia, em ordem:
1. CLAUDE.md (constituição do agente — convenções de código, anti-padrões, política Ask first/act second)
2. HANDOFF.md (especialmente a seção "Suspeitas comuns" com 10 desvios típicos do Lovable a auditar)
3. DESIGN.md (sistema de design vinculante — tokens lc-*, Inter, motion, anti-padrões visuais)

PASSO 2 — Audite o repo SEM modificar nada ainda. Liste para mim:
- Estado de tsconfig.json (strict mode? noImplicitAny? paths @/*?)
- Tokens lc-* presentes em tailwind.config.js?
- Inter carregando como font base?
- Cores Tailwind genéricas usadas em algum componente (ex: bg-blue-600 em vez de bg-lc-blue)?
- AuroraBackground.tsx existe? Cores corretas (blue + lime, não purple/pink)?
- Estrutura de pastas em src/ confere com CLAUDE.md seção 4?
- vite-plugin-pwa configurado?
- .env.example existe e está documentado?
- Footer presente em todas as páginas (Layout component)?
- Arquivos .md órfãos que o Lovable inventou (ex: COMPONENTS.md, STYLE_GUIDE.md)?
- Rotas extras inventadas pelo Lovable que não estão no PROMPT-LOVABLE-INITIAL?
- Componentes/dependências adicionados que não foram pedidos?

Devolva a auditoria como um relatório markdown em texto, sem editar nada do repo.

PASSO 3 — Após eu validar a auditoria, você vai aplicar as correções num único commit. Ainda não comece. Aguarde meu OK.
```

### 1.4 O que esperar

O Claude Code vai ler os 3 arquivos, percorrer o repo, e devolver um relatório listando os desvios encontrados. **Revise o relatório.** Se algum item parecer questionável, debata na hora — não autorize aplicação cega.

### 1.5 Autorize as correções

Quando estiver satisfeito com a auditoria, responda algo como:

```
Aprovado. Aplique as correções respeitando as seguintes regras:
- Cada correção em um commit pequeno e separado, com mensagem Conventional Commits clara.
- Não invente correções fora do que já listou na auditoria.
- Se durante a aplicação descobrir mais um desvio, pare e me avise antes de incluir.
- Ao terminar, rode npm run type-check && npm run lint e me devolva o output.
- Se houver erro, pare e me mostre antes de tentar corrigir.

Quando terminar, abra o PR localmente com gh pr create (ou me dê o comando exato para abrir manualmente) com título "chore(bootstrap): align project with CLAUDE.md conventions" e descrição seguindo o template do CLAUDE.md seção 9.
```

### 1.6 Critérios para mergear o PR #0

- [ ] `npm run dev` sobe sem warnings.
- [ ] `npm run type-check` passa (zero erros).
- [ ] `npm run lint` passa (zero erros, warnings tolerados se justificados).
- [ ] Landing visualmente fiel ao DESIGN.md (Aurora azul+lime, Inter, sem ícones de papelaria).
- [ ] Estrutura de pastas `src/` confere com CLAUDE.md seção 4.
- [ ] Arquivos canônicos da raiz presentes (CLAUDE.md, BACKLOG.md, etc).

Se passar nos 6 critérios, mergeie. Se não, peça correção pontual.

---

## 🔐 SESSÃO 2 — Issue LC-001: Auth Google + Supabase setup

**Pré-requisito:** PR #0 mergeado em main.

**O que essa sessão faz:** conecta o login Google de verdade, gera os types do Supabase, cria AuthContext + ProtectedRoute, processa o callback OAuth.

### 2.1 Crie a branch

```bash
git checkout main
git pull
git checkout -b feat/lc-001-auth-supabase-setup
```

### 2.2 Abra o Claude Code

```bash
claude
```

### 2.3 Cole **exatamente** este prompt

```
Vamos resolver a issue LC-001 do BACKLOG.md.

PASSO 1 — Leia, em ordem:
1. CLAUDE.md (relembre as convenções)
2. BACKLOG.md, especialmente a issue LC-001 (Setup Supabase client + Google OAuth + AuthContext)
3. schema.sql apenas a parte da tabela `profiles` e do trigger `on_auth_user_created` — para entender como o profile é criado

PASSO 2 — Antes de codar, gere os types do Supabase:
- Confirme se Supabase CLI está instalado (`npx supabase --version`).
- Se não, instale: `npm install -D supabase`.
- Linke ao projeto: `npx supabase link --project-ref [project-ref]` — vou te passar o project-ref.
- Gere types: `npx supabase gen types typescript --linked > src/types/database.ts`.

PARE aqui e me peça o project-ref do Lovable Cloud antes de prosseguir.

PASSO 3 — Após receber project-ref e gerar types, faça um plano de ataque sucinto (no máximo 15 linhas) listando:
- Arquivos que vai criar
- Arquivos que vai modificar
- Ordem de implementação
- Smoke test que vai propor ao final

Aguarde meu OK no plano antes de codar.

PASSO 4 — Após meu OK, implemente respeitando os Acceptance Criteria da issue LC-001:
- src/lib/supabase.ts com createClient tipado
- src/contexts/AuthContext.tsx com useAuth() retornando { user, profile, role, loading, signOut }
- src/pages/AuthCallbackPage.tsx que processa o redirect e roteia por role
- src/components/shared/ProtectedRoute.tsx
- src/pages/ForbiddenPage.tsx para 403 amigável
- Atualizar LoginPage.tsx para chamar signInWithOAuth de fato
- Atualizar App.tsx (ou onde estiverem as rotas) para incluir as novas rotas

Em cada arquivo novo, inclua header de comentário explicando função.

Use react-query para queries que façam sentido (ex: useProfile hook).
Use os tokens lc-* do design system. Inter sempre.
Respeite RLS — não use service_role no client.

PASSO 5 — Ao terminar:
- Rode npm run type-check && npm run lint
- Devolva diff resumido (arquivos criados/modificados, ~5 linhas por arquivo descrevendo)
- Proponha smoke test detalhado: passos exatos para eu validar manualmente o login Google end-to-end.

PASSO 6 — Aguarde minha confirmação do smoke test antes de abrir o PR.
```

### 2.4 Após validar o smoke test

```
Aprovado. Abra o PR com:
- Título: feat(auth): add Google OAuth + AuthContext + ProtectedRoute (LC-001)
- Descrição seguindo o template do CLAUDE.md seção 9.
- Closes: a issue LC-001 do BACKLOG (mencione na descrição se já houver issue criada no GitHub).

Me dê o comando exato para abrir o PR (gh pr create ...) ou abra você se a CLI do GitHub estiver autenticada.
```

### 2.5 Critérios para mergear LC-001

- [ ] Login completo Google → callback → redirect por role funciona.
- [ ] Profile é criado automaticamente em `public.profiles` no primeiro login (trigger).
- [ ] Logout funciona.
- [ ] Acesso a `/admin` por usuário com role `parent` mostra página 403, não dá 500.
- [ ] `npm run type-check` e `npm run lint` passam.
- [ ] Sem `console.log` órfão no código.

---

## 📋 Padrão para todas as issues seguintes (LC-002 a LC-016)

A partir da terceira sessão, o padrão é o mesmo. Substitua `LC-XXX` e o slug:

```bash
git checkout main && git pull
git checkout -b feat/lc-XXX-slug-curto
claude
```

Prompt-template para colar:

```
Vamos resolver a issue LC-XXX do BACKLOG.md.

PASSO 1 — Leia, em ordem:
1. CLAUDE.md (convenções)
2. BACKLOG.md, especialmente a issue LC-XXX
3. [Liste aqui outros docs relevantes para essa issue específica — ex: DESIGN.md se a issue toca em UI, schema.sql se a issue toca em DB, IMPORT-INEP-SCHOOLS.md se for um caso de import]

PASSO 2 — Faça um plano de ataque sucinto (até 15 linhas):
- Arquivos novos
- Arquivos modificados
- Ordem de implementação
- Edge cases que prevê
- Smoke test proposto

Aguarde meu OK no plano antes de codar.

PASSO 3 — Após meu OK, implemente respeitando todos os Acceptance Criteria da issue LC-XXX. Mantenha PR pequeno. Pare se descobrir scope creep.

PASSO 4 — Ao terminar:
- npm run type-check && npm run lint
- Diff resumido por arquivo
- Smoke test detalhado para eu validar

PASSO 5 — Aguarde meu OK no smoke test antes de abrir o PR.
```

---

## 🆘 Quando algo der errado

| Sintoma | Ação |
|---|---|
| Claude Code começa a editar antes de eu autorizar | Pare a sessão (`Ctrl+C`) e reabra com prompt: *"Releia CLAUDE.md regra Ask first, act second. Vamos retomar a partir do plano."* |
| Claude Code cria arquivo fora dos `Files:` da issue | Reverta o arquivo e peça: *"Não crie esse arquivo. Use os caminhos exatos listados na issue."* |
| Type-check falha após gerar Supabase types | `npx supabase gen types typescript --linked > src/types/database.ts` (re-rode, schema pode ter mudado) |
| RLS bloqueia query inesperadamente | Logue `auth.uid()` e role do user no client. Confirme policy no schema.sql. Se policy estiver errada, abra spike-PR pequeno só com o fix. |
| Edge Function timeout | Reduza batch size ou adicione paginação. Veja IMPORT-INEP-SCHOOLS.md como exemplo de paginação correta. |
| `git push` falha por autenticação | Use `gh auth login` (GitHub CLI) ou configure SSH key. **Nunca cole PAT em código.** |
| Build quebra após `git pull` | `rm -rf node_modules package-lock.json && npm install` |
| Sessão do Claude Code "esqueceu" o contexto | Reabra: ele lê os arquivos canônicos (CLAUDE.md, BACKLOG.md) novamente. |

---

## 📦 Mapa rápido dos arquivos vinculantes

| Arquivo | Quando o Claude Code precisa ler |
|---|---|
| `CLAUDE.md` | Toda sessão (constituição) |
| `BACKLOG.md` | Antes de cada issue |
| `DESIGN.md` | Antes de tocar qualquer UI |
| `schema.sql` | Antes de tocar qualquer query/RLS |
| `IMPORT-INEP-SCHOOLS.md` | Apenas no setup inicial (uma vez) |
| `HANDOFF.md` | Sessão 1 (PR #0) |
| `PRIVACY.md` / `RIPD.md` | Issues que tocam dados de menor (LC-002, LC-010, LC-015) |
| `catalog-seed.json` | Issue LC-012 (build-cart) |

---

## 🎯 Estado de progresso (atualize manualmente)

```
[ ] PR #0 — Saneamento do bootstrap
[ ] LC-001 — Auth + Supabase setup
[ ] LC-002 — Cadastro de escola
[ ] LC-003 — Aguardando aprovação + Dashboard básico
[ ] LC-004 — Painel admin + notify-school-approved
[ ] LC-005 — Edge Function parse-list (Gemini OCR)
[ ] LC-006 — Edge Function validate-procon
[ ] LC-007 — Wizard publicar lista (escola)
[ ] LC-008 — Listagem de listas + comunicado para pais
[ ] LC-009 — Busca de escola + home /pais
[ ] LC-010 — Detalhe escola + lista oficial + "já tenho"
[ ] LC-011 — Upload direto pelo pai
[ ] LC-012 — Edge Function build-cart
[ ] LC-013 — UI 3 carrinhos IA + tracking deep links
[ ] LC-014 — Tabela events + admin sessões
[ ] LC-015 — WhatsApp capture queue
[ ] LC-016 — Páginas estáticas + SEO + 404/500
[ ] Smoke test end-to-end com 1 escola real
[ ] Soft launch com 5 escolas piloto
```

---

**Quando você (humano) terminar uma issue:** marque o checkbox acima, faça `git push` da branch mergeada, e abra a próxima sessão Claude Code com o prompt-template da seção "Padrão para todas as issues seguintes".

**Quando algo travar e você precisar de ajuda externa:** abra um chat aqui no projeto Claude.ai com:
- A issue específica do BACKLOG.md
- O erro/contexto
- O CLAUDE.md anexado se for nova thread

Eu não preciso de credencial nenhuma para te ajudar a debugar — só do contexto.

---

**Versão:** 1.0 — abril 2026
**Para uso com:** Claude Code CLI rodando localmente em `lista-certa-ia/`.
