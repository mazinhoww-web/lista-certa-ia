# QA — Jornada do Usuário (manual)

> Checklist para você rodar `npm run dev` e percorrer cada jornada no navegador (idealmente celular 380px + desktop). Para cada etapa há uma rota, o que esperar, e espaço para anotação. Marque `[x]` quando OK, `[!]` quando achar problema, e escreva embaixo.
>
> **Setup:** `npm run dev` → http://localhost:5173. Abra DevTools no celular para ver console e network. Use uma conta Google de teste (não a sua principal).

---

## Jornada 1 — Visitante chega e faz login

### 1.1 Landing → Login
- [ ] Rota: `/`
- [ ] Vejo: hero, "Como funciona", banner Procon, marquee de varejistas, "Para escolas", footer
- [ ] Clico em algum CTA → vai pra `/login`?
- [ ] Header tem botão "Entrar" visível desktop e mobile?

**Anotações:**
```
```

### 1.2 Login com Google
- [ ] Rota: `/login`
- [ ] Botão "Voltar" no canto superior leva pra `/`
- [ ] Botão "Entrar com Google" funciona
- [ ] Após autenticar, vai pra `/auth/callback` e depois pra... **(checar)** — pelo código, vai para o que estiver em `sessionStorage["post_login_redirect"]` OU `/minha-conta` por default. Confirmar.

**Esperado / Pergunta crítica:** o usuário novo cai em `/minha-conta` e precisa achar sozinho onde "começar"? Não seria melhor um redirect inteligente: se não tem aluno → `/meus-alunos/novo`; se tem aluno mas a escola não publicou lista → `/meus-alunos`; se tudo certo → `/meus-alunos/:id/carrinho`?

**Anotações:**
```
```

### 1.3 Logout
- [ ] Único caminho hoje: `/minha-conta` → botão "Sair" (linha 146 de `MinhaContaPage.tsx`)
- [ ] Existe link de logout em algum header global? **(verificar)**
- [ ] Após sair, vai pra `/`?

**Anotações:**
```
```

---

## Jornada 2 — Pai novo: cadastrar aluno e ver lista

### 2.1 Lista de alunos vazia
- [ ] Rota: `/meus-alunos`
- [ ] Empty state explícito ("Você ainda não tem alunos")?
- [ ] CTA "Cadastrar aluno" claro?

**Anotações:**
```
```

### 2.2 Cadastrar aluno
- [ ] Rota: `/meus-alunos/novo`
- [ ] Botão Voltar (`ArrowLeft`) funciona — confirmado em `CadastrarAlunoPage.tsx:77`
- [ ] Form: campos pra preencher (qual escola, qual série, primeiro nome do aluno…)
- [ ] Validação: tenta submeter vazio → mensagens em pt-BR
- [ ] Submit → vai pra... `/meus-alunos`? `/meus-alunos/:id/lista`? **(verificar a navegação pós-submit)**

**Esperado:** após criar, idealmente cair direto na lista do aluno. Confirmar.

**Anotações:**
```
```

### 2.3 Ver lista do aluno
- [ ] Rota: `/meus-alunos/:studentId/lista`
- [ ] Botão Voltar (`AlunoListaPage.tsx:42`) → vai pra `/meus-alunos`
- [ ] Mostra os itens da lista
- [ ] CTA "Montar carrinho" / "Ver carrinho" leva pra `/meus-alunos/:studentId/carrinho`?

**Edge cases:**
- [ ] E se a escola do aluno **ainda não publicou** lista? Tem mensagem "lista não disponível ainda"?
- [ ] E se o aluno foi removido (deleted_at)? Hoje renderiza "Este aluno foi removido" (em `StudentCartPage.tsx:148`) — confirmar mesma cobertura aqui.

**Anotações:**
```
```

### 2.4 Carrinho do aluno
- [ ] Rota: `/meus-alunos/:studentId/carrinho`
- [ ] Header com Logo, mas SEM botão Voltar visível (clicar no Logo manda pra `/`, não pra `/meus-alunos`) — **🟠 verificar se isso confunde**
- [ ] StrategyComparisonHeader mostra primeiro nome do aluno + escola + série
- [ ] 3 cards de estratégia (cheapest / fastest / recommended)
- [ ] MockDataBanner aparece quando há item DEMO
- [ ] Botão "Atualizar" funciona, toasts aparecem
- [ ] Loading skeleton 3 estrelas
- [ ] FailedState com "Tentar novamente" se erro

**Anotações:**
```
```

---

## Jornada 3 — Pai compra: estratégia → /ir-para → ML

### 3.1 Click no CTA da estratégia
- [ ] Em `/meus-alunos/:id/carrinho`, click no botão "Comprar no Mercado Livre" da estratégia "recomendado"
- [ ] **Esperado:** navega internamente para `/ir-para/:strategyId/mercadolibre` (era `window.open` antes do LC-009)
- [ ] Se a estratégia tem só mocks: botão fica "Disponível em breve" (disabled), **mas ainda dispara o evento de tracking** — confirmar no DevTools/Network que o insert em `analytics_events` acontece

**Anotações:**
```
```

### 3.2 Página /ir-para
- [ ] Rota: `/ir-para/:strategyId/:retailerKey`
- [ ] Link "Voltar para o carrinho" funciona (`RedirectToRetailerPage.tsx`)
- [ ] Headline "Comprar no Mercado Livre" + subtitle com nome da estratégia
- [ ] AffiliateDisclosureBanner: aparece SE `VITE_AFFILIATE_DISCLOSURE_ENABLED=true`. Hoje deve estar desligado (TD-25 pendente). Para testar, copie `.env.example` para `.env.local` e ligue.
- [ ] Lista numerada de itens: thumbnail + nome + preço + botão "Comprar"
- [ ] Botão "Comprar" abre nova aba ML — `target="_blank" rel="noopener noreferrer nofollow sponsored"`
- [ ] Item sem permalink válido: botão fica "Indisponível" + texto "Link indisponível. Busque manualmente por: {nome}"

**🟠 UX a checar:**
- Se o usuário compra apenas alguns itens e fecha aba, ele perde a tela — tem indicação clara que a aba ML é nova/externa? (hoje só o ícone `ExternalLink`).
- O CTA de cada item é pequeno (h-9). No 380px isso fica clicável?

**Anotações:**
```
```

### 3.3 Short link `/r/:shortId`
- [ ] No DB, pegue os primeiros 8 hex de uma `cart_strategies.id` (sem hífens)
- [ ] Acesse `/r/<8hex>` → deve redirecionar pra `/ir-para/...`
- [ ] Acesse `/r/00000000` (id que não existe) → "Link inválido"
- [ ] Acesse `/r/abc` (formato inválido) → "Link inválido"
- [ ] **(opcional)** Force colisão: dois `cart_strategies.id` com mesmo prefixo → ambos rejeitados

**Anotações:**
```
```

### 3.4 Self-report modal (gatilho 24h)
- [ ] Para forçar: insira manualmente em `analytics_events` um row com:
  - `event_name = 'cart_strategy_clicked'`
  - `user_id = auth.uid()`
  - `created_at = now() - interval '25 hours'`
- [ ] Recarregue `/meus-alunos/:id/carrinho` → modal "Você comprou o material?" deve abrir
- [ ] 3 botões: "Sim, comprei tudo" / "Comprei só uma parte" / "Ainda não comprei"
- [ ] "Comprei só uma parte" → input de quantidade (max = total_items) → "Confirmar"
- [ ] Após confirmar: modal fecha; recarregue a página → modal **NÃO** reabre na mesma sessão
- [ ] Limpe `sessionStorage["lc_self_report_shown"]` e recarregue → ainda **NÃO** abre (cooldown 30d)
- [ ] Fechar modal com X ou ESC: o flag de sessão ainda é gravado? Se sim, ele não volta nessa sessão. **🟠 confirmar comportamento desejado.**

**Anotações:**
```
```

---

## Jornada 4 — Escola: cadastrar, esperar aprovação, publicar lista

### 4.1 Cadastro
- [ ] Rota: `/escola/cadastrar`
- [ ] Botão Voltar (`CadastrarEscolaPage.tsx:167`)
- [ ] Wizard multi-step: InepSearchStep → SchoolFormStep → ?
- [ ] Submit → vai pra `/escola/aguardando`?

**Anotações:**
```
```

### 4.2 Aguardando aprovação
- [ ] Rota: `/escola/aguardando`
- [ ] Mensagem clara "Sua escola está em análise"
- [ ] Tem botão pra ver lista de minhas escolas? Pra voltar pra `/`?

**🔴 Crítico:** quando admin aprova, como a escola **descobre**? Tem email Resend? Há refresh automático? Ou ela precisa voltar manualmente?

**Anotações:**
```
```

### 4.3 Minhas escolas
- [ ] Rota: `/minhas-escolas`
- [ ] Lista todas as escolas que esse user cadastrou, com status (pending / approved / rejected)
- [ ] Click em cada → `/escola/:id/status` ou `/escola/:id/listas`?

**Anotações:**
```
```

### 4.4 Status da escola
- [ ] Rota: `/escola/:id/status`
- [ ] Botão Voltar (`StatusEscolaPage.tsx:68`)
- [ ] Mostra status de aprovação + razão se rejeitada
- [ ] Se approved: link/CTA pra "Publicar lista" → `/escola/:id/listas/nova`?

**Anotações:**
```
```

### 4.5 Listas da escola
- [ ] Rota: `/escola/:id/listas`
- [ ] Botão Voltar (`EscolaListasPage.tsx:67`)
- [ ] Botão "+ Nova lista" (Plus icon) → `/escola/:id/listas/nova`
- [ ] Lista existentes mostradas com série + status

**Anotações:**
```
```

### 4.6 Publicar lista nova
- [ ] Rota: `/escola/:id/listas/nova`
- [ ] Botão Voltar (`EscolaListaNovaPage.tsx:132`)
- [ ] 3 steps: identificação, conteúdo (upload PDF/foto/colar texto), validação
- [ ] FileUp icon presente
- [ ] Após publicar → `/escola/:id/listas/:listId`?
- [ ] **(verificar)** Pais que cadastraram alunos dessa escola/série recebem notificação? (LC-006/007 wiring)

**Anotações:**
```
```

### 4.7 Detalhe da lista publicada
- [ ] Rota: `/escola/:id/listas/:listId`
- [ ] Botão Voltar para listas (`EscolaListaDetailPage.tsx:68` e duplicado em `:87`) — **🟢 dois botões "Voltar para listas" no mesmo arquivo, confirmar se intencional**
- [ ] Permite editar itens da lista? Excluir?

**Anotações:**
```
```

---

## Jornada 5 — Busca pública (sem login)

### 5.1 Busca
- [ ] Rota: `/buscar`
- [ ] Acessível **sem login** — confirmar abrindo em aba anônima
- [ ] Campo de busca; resultados em cards
- [ ] Click em card → `/escola/:slug` (página pública)

**Anotações:**
```
```

### 5.2 Escola pública
- [ ] Rota: `/escola/:slug`
- [ ] Botão Voltar para a busca (`EscolaPublicaPage.tsx:103`)
- [ ] Mostra info da escola, séries com lista publicada
- [ ] Click numa série → `/escola/:slug/lista/:listId`

**Anotações:**
```
```

### 5.3 Lista pública
- [ ] Rota: `/escola/:slug/lista/:listId`
- [ ] Botão Voltar (`EscolaPublicaListaPage.tsx:51`)
- [ ] Mostra todos os itens **sem precisar de login**
- [ ] CTA `UserPlus` "cadastrar aluno" leva pra... `/login` ou `/meus-alunos/novo`?

**🟠 UX importante:** O convite pra logar é discreto (banner) ou bloqueia a leitura? Pelo brief deve ser discreto.

**Anotações:**
```
```

---

## Jornada 6 — Admin (rápido)

- [ ] Rota: `/admin` redireciona pra `/admin/escolas`
- [ ] Sem ser admin → `/403`
- [ ] Como admin: vê fila de escolas pendentes, pode aprovar/rejeitar

**Anotações:**
```
```

---

## Edge cases globais

### Erros e estados
- [ ] `/403` com botão "Voltar" (`history.back()`) — funciona se chegou direto pela URL? Senão joga ele pra onde?
- [ ] `/404` (qualquer rota inválida) → `NotFoundPage` com botão "Voltar para o início"
- [ ] Privacidade `/privacidade` e Termos `/termos` ambos com botão Voltar
- [ ] Login expirado (sessão Supabase) → redireciona pra `/login`?

### Mobile 380px
- [ ] Header não quebra
- [ ] Cards de estratégia em 1 coluna
- [ ] Modal de self-report cabe na tela
- [ ] Inputs ≥ 44px de altura (toque)
- [ ] CTAs do `RetailerProductCard` clicáveis (h-9 = 36px — **🟡 abaixo do recomendado 44px iOS HIG**)

### Acessibilidade
- [ ] Todos os botões têm texto ou `aria-label`
- [ ] Foco visível em tab navigation
- [ ] Labels de form associados aos inputs
- [ ] `aria-hidden` nos ícones decorativos (já presente em vários lugares)

### Performance / loading
- [ ] Carrinho em loading mostra skeleton, não tela branca
- [ ] Refresh do carrinho mostra spinner sem desmontar a tela
- [ ] Imagens dos itens (`thumbnail`) com `loading="lazy"`

---

## Lista consolidada de pontos a confirmar (priorizada)

1. 🔴 **Pós-login redirect**: `/minha-conta` é o melhor destino default? Pai novo se sente perdido?
2. 🔴 **Notificação de aprovação**: escola aprovada recebe email? Senão fica esperando indefinidamente.
3. 🟠 **`/meus-alunos/:id/carrinho` sem botão Voltar**: o Logo leva pra `/` (landing), não pra `/meus-alunos`. Adicionar breadcrumb.
4. 🟠 **Pós-submit do `CadastrarAlunoPage`**: cair direto na lista do aluno seria mais fluido.
5. 🟠 **`/meus-alunos/:id/lista` sem lista publicada**: mensagem específica vs. erro genérico.
6. 🟠 **Self-report modal — fechar sem responder**: define `sessionStorage["lc_self_report_shown"] = "1"` antes de o usuário responder. Se ele só fecha, perdemos o sinal e não volta na mesma sessão. Considerar gravar o flag só após `report()`.
7. 🟡 **CTA item h-9 (36px)** em `RetailerProductCard` no mobile: abaixo do alvo de toque 44px.
8. 🟡 **Dois "Voltar para listas"** em `EscolaListaDetailPage.tsx` (linhas 68 e 87) — confirmar se um é error state.
9. 🟢 **`AffiliateDisclosureBanner` desligado por default** (TD-25): documentar para teste manual ligar `.env.local`.
10. 🟢 **Header global**: não há link de logout fora de `/minha-conta`. Considerar dropdown user menu no header logado.

---

## Como reportar de volta

Quando rodar isso, copie só os blocos com `[!]` e cole num issue ou no chat. Não precisa colar o checklist inteiro.
