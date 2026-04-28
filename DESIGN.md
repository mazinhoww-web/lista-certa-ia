# DESIGN.md — ListaCerta

> Sistema de design vivo do produto ListaCerta. Derivado do Brand Book Direção 4 (C-Tick Integrado, 2026).
> **Mobile-first, sempre.** PWA. Inter only. Bold minimalista.

---

## 0. Contexto do MVP

- **Geografia inicial**: Cuiabá / Várzea Grande, Mato Grosso. Capital + região metropolitana.
- **Domínio futuro**: `listacertaescolar.com.br` (em provisionamento).
- **Auth**: Google Auth via Lovable nativamente.
- **Pagamento no MVP**: NÃO. Não cobramos nada. Deep links levam ao varejista.
- **Plataforma**: PWA mobile-first (iOS Safari + Android Chrome). Desktop é bonus.
- **Visão**: extremamente visual, animado, refinado. Estilo bold minimalista do brand, amplificado com micro-interações de qualidade tripled-ui (Framer Motion, scroll reveals, hover lifts).

---

## 1. Identidade Visual

**Personalidade**: confiavel, inteligente, calorosa, direta, prática.
**Estilo**: bold minimalista. Hierarquia agressiva por peso de fonte. Números grandes como protagonistas.
**Referências de marca**: Nubank (clareza visual), iFood (calor brasileiro), Wise (transparência de preço), Apple (simplicidade), Mercado Pago (confiança multi-parceiro).
**Públicos**:
- Mãe-economista (B2C primário, 55%) — 32-45 anos, classe B/C, encontra via Google ou WhatsApp.
- Pai-organizador (B2C secundário, 20%) — 35-50 anos, classe A/B, escola privada premium.
- Escolas (B2B, 25%) — coordenação pedagógica, secretaria.

---

## 2. Cores

Regra **70 / 20 / 10**. 70% da peça = Surface ou White. 20% = Slate (texto). 10% = ação (Blue + Lime). Coral e Emerald são **funcionais**, nunca decorativos.

| Token CSS | Hex | Uso |
|---|---|---|
| `--lc-blue` | `#1E40AF` | Logo, CTA primário, header, links |
| `--lc-lime` | `#84CC16` | Estado certo, cashback, checkmark, validação |
| `--lc-coral` | `#F43F5E` | Pickup 2h, urgência positiva, badge tempo |
| `--lc-emerald` | `#059669` | Validador Procon, conformidade, seal |
| `--lc-ink` | `#0F172A` | Texto primário, títulos |
| `--lc-mid` | `#64748B` | Texto secundário, labels, captions |
| `--lc-border` | `#E2E8F0` | Bordas, divisores, outlines |
| `--lc-surface` | `#F8FAFC` | Fundo da página, seções alternadas |
| `--lc-white` | `#FFFFFF` | Cards, modais, superfícies elevadas |

### Tokens semânticos para Tailwind (`tailwind.config.js`)

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        lc: {
          blue:    { DEFAULT: '#1E40AF', 700: '#1D3FAA', 800: '#1E3A8A', 900: '#172E80' },
          lime:    { DEFAULT: '#84CC16', 100: '#ECFCCB', 200: '#D9F99D', 600: '#65A30D' },
          coral:   { DEFAULT: '#F43F5E', 50: '#FFF1F2', 100: '#FFE4E6' },
          emerald: { DEFAULT: '#059669', 50: '#ECFDF5', 100: '#D1FAE5' },
          ink:     { DEFAULT: '#0F172A' },
          mid:     { DEFAULT: '#64748B' },
          border:  { DEFAULT: '#E2E8F0' },
          surface: { DEFAULT: '#F8FAFC' },
        }
      }
    }
  }
}
```

### Anti-padrões de cor (PROIBIDO)

- ❌ Gradiente sunset (rosa-laranja-amarelo)
- ❌ Gradiente AI (violet-rosa-azul)
- ❌ Gradiente Blue → Lime (vira AI-startup genérico)
- ❌ Coral e Emerald como decorativos
- ❌ Misturar Coral e Emerald na mesma peça

### Aurora de fundo permitida

A única aurora autorizada para hero sections é **Blue → Slate Ink** (variações de azul profundo em direção ao preto-tinta), nunca purple/pink. Ex:

```css
background: radial-gradient(ellipse at top, rgba(30,64,175,0.20) 0%, transparent 60%),
            linear-gradient(180deg, #0F172A 0%, #1E40AF 100%);
```

---

## 3. Tipografia

**Inter. Só Inter.** Sans-serif geométrica humanista, gratuita, ótima legibilidade em mobile.

Pesos: 400, 500, 600, 700, 800, 900. Black (900) reservado para o logotipo.

| Uso | Peso | Tamanho | Tracking |
|---|---|---|---|
| Hero / Logo | 900 | 32-56px | -0.025em |
| H1 | 800 | 22-32px | -0.015em |
| H2 / H3 | 700 | 16-22px | -0.01em |
| Body | 400 | 14-16px | normal |
| Caption / Label | 500 | 12px | +0.04em (uppercase) |
| Número (preço) | 800-900 | 28-40px | tabular-nums, -0.01em |

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
```

```css
body {
  font-family: 'Inter', system-ui, sans-serif;
  font-feature-settings: 'cv11', 'ss01';
  -webkit-font-smoothing: antialiased;
}
.lc-num { font-variant-numeric: tabular-nums; }
```

---

## 4. Espaçamento

Base: **4px**. Escala: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 80 / 120px`.

- Padding de card: 16-24px
- Gap entre elementos: 12-16px
- Margem de seção em mobile: 32-48px vertical
- Margem de seção em desktop: 80-120px vertical
- Safe area mobile: 16-20px lateral

---

## 5. Bordas, Radius, Sombras

| Token | Valor | Uso |
|---|---|---|
| `radius-sm` | 8px | Botões pequenos, badges |
| `radius-md` | 12px | Inputs, cards pequenos |
| `radius-lg` | 16px | Cards padrão, listas |
| `radius-xl` | 24px | Modais, hero cards |
| `radius-2xl` | 32px | Mockups de mobile, frames |
| `radius-pill` | 9999px | Tags, pills, chips |
| `shadow-sm` | `0 1px 3px rgba(15,23,42,0.06)` | Cards |
| `shadow-md` | `0 4px 16px rgba(15,23,42,0.08)` | Cards elevados, dropdowns |
| `shadow-lg` | `0 16px 48px rgba(15,23,42,0.12)` | Modais |
| `shadow-glow` | `0 0 0 4px rgba(30,64,175,0.15)` | Focus state, foco em CTA |

---

## 6. Motion & Animações (tripled-ui amplified)

### Princípios

1. **Motion serve o conteúdo, não a si mesmo.** Anima quando ajuda a entender.
2. **Loading da IA é showtime.** O momento que a IA monta o carrinho é o highlight visual do produto.
3. **Stagger reveal em hero e listas.** 60-100ms de delay entre elementos.
4. **Scroll-triggered: revelar uma vez.** `useInView` com `once: true`.
5. **Reduced motion.** Sempre respeitar `prefers-reduced-motion`.

### Stack de animação

- **Framer Motion** para animações complexas (stagger, scroll, AnimatePresence)
- **CSS-only** para hover states e transitions simples (preferir quando possível)
- **Lottie** apenas para celebrações pontuais (finalizar carrinho, cadastrar primeira escola) — máximo 2 no app inteiro

### Padrões obrigatórios

**Hero entrance (página de pais e landing):**
```jsx
<motion.div
  initial={{ opacity: 0, y: 24 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
>
```

**Stagger em lista de itens:**
```jsx
const container = {
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
}
```

**Hover lift em cards:**
```css
.lc-card { transition: transform 0.2s ease-out, box-shadow 0.2s ease-out; }
.lc-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
```

**Loading IA — momento heroico:**
- Texto rotativo: "Lendo a lista..." → "Buscando preços..." → "Comparando varejistas..." → "Pronto."
- Spinner radial com gradiente Blue → Lime (somente neste contexto, exceção justificada)
- Duração mínima 2s mesmo se a chamada for mais rápida (percebido como "trabalhoso")
- Microcopia da marca: "A IA esta montando o melhor carrinho..."

**Aurora background animada (apenas hero da landing):**
```jsx
<div className="absolute inset-0 overflow-hidden">
  <motion.div
    className="absolute -top-1/3 -left-1/4 w-2/3 h-2/3 rounded-full blur-3xl"
    style={{ background: 'rgba(30,64,175,0.30)' }}
    animate={{ x: [0, 80, 0], y: [0, 40, 0] }}
    transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
  />
  <motion.div
    className="absolute -bottom-1/3 -right-1/4 w-1/2 h-1/2 rounded-full blur-3xl"
    style={{ background: 'rgba(132,204,22,0.18)' }}
    animate={{ x: [0, -60, 0], y: [0, -30, 0] }}
    transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
  />
</div>
```

---

## 7. Componentes-Chave

| Componente | Descrição |
|---|---|
| **SearchBar** | Input pill com ícone Lucide `Search` em blue, autocomplete dropdown com escolas (avatar inicial + nome + bairro + badge "Validada"), chips de cidades populares abaixo. Em foco: shadow-glow blue. |
| **SchoolCard** | Avatar redondo com inicial(`bg-lc-blue`), nome em peso 700, bairro/cidade em mid, badge "Validada Procon" emerald se aplicável; "Aguarda lista" cinza se não. |
| **ListItem** | Foto-padrão 56x56 radius-md, nome em 600, especificação (gramatura/dimensão) em mid, preço em tabular-nums, botão "já tenho" como link mid → marca item como reaproveitado (line-through + badge emerald). |
| **CartOption** | Card grande com banner de modalidade (Mais barato / Mais rápido / Casa em 24h), total em 900 tabular-nums, breakdown em pills por varejista, sub-info (pickup, delivery), CTA primário blue. |
| **RetailerSplit** | Lista de varejistas com logo + número de itens + subtotal, badge Procon-safe no topo, botão "Comprar na [varejista]" abrindo deep link. |
| **PickupBadge** | Pill bg-lc-coral com ícone Clock, "Retirar em 2h Cuiabá Centro". |
| **ProconSeal** | Pill bg-lc-emerald-50 com border emerald-100, ícone ShieldCheck, "Validada Procon-MT" + data. |
| **WhatsAppCTA** | Botão verde-WhatsApp `#25D366` com ícone WhatsApp; presente em capturar lista, falar com escola, suporte. |
| **AILoading** | Componente fullscreen overlay com spinner blue→lime, texto rotativo da marca, duração mín. 2s. |
| **AuroraHero** | Hero da landing com aurora animada blue+lime, headline em peso 900, sub em mid, dual-CTA, social proof abaixo. |
| **NumberCounter** | Animação de count-up em tabular-nums, ease-out, duração 1.2s. Usado em stats da landing. |
| **EmptyState** | Ilustração geométrica simples (não-isométrica) + texto curto + CTA. |

---

## 8. Iconografia

**Pack único: Lucide React.** Stroke fino, geometria humanista, consistente.

| Função | Ícone | Cor |
|---|---|---|
| Busca | `Search` | `lc-blue` |
| Escola | `GraduationCap` ou `School` | `lc-blue` |
| Lista validada | `ShieldCheck` | `lc-emerald` |
| Pickup 2h | `Clock` ou `MapPin` | `lc-coral` |
| Cashback | `Coins` | `lc-lime` |
| Carrinho IA | `Sparkles` ou `ShoppingCart` | `lc-blue` |
| Pagamento | `CreditCard` | `lc-ink` |
| WhatsApp | `MessageCircle` | `#25D366` |
| Aprovação | `CircleCheck` | `lc-emerald` |
| Pendente | `CircleDashed` | `lc-mid` |
| Erro | `CircleAlert` | `lc-coral` |

### Anti-ícones (PROIBIDOS)

- ❌ Lápis, caderno, régua, mochila, lousa (estereótipos infantilizadores)
- ❌ Sino de notificação tradicional
- ❌ Estrela de avaliação em B2B
- ❌ Mascote de qualquer espécie

---

## 9. Microcopia (voz da marca)

| Contexto | SIM | NÃO |
|---|---|---|
| CTA home | "Buscar minha escola" | "Começar agora" |
| Gerar carrinho | "Montar carrinho com IA" | "Otimizar lista" |
| Loading IA | "A IA esta montando o melhor carrinho..." | "Processando..." |
| Sucesso | "Pronto. Sua lista esta certa." | "Pedido confirmado!" |
| Empty busca | "Digite o nome da escola, cidade ou CEP" | "Nenhum resultado" |
| Confirma pickup | "Pode buscar. Esta pronto desde 11:42." | "Disponivel para retirada" |
| Erro genérico | "Algo nao saiu como esperado. Tenta de novo?" | "Erro 500" |
| Cadastrar escola | "Cadastrar minha escola" | "Solicitar inclusão" |
| Aguarda aprovação | "A gente esta validando sua escola. Avisamos em ate 24h." | "Pendente de aprovação" |
| Subir lista | "Subir foto ou PDF da lista" | "Upload de arquivo" |

**Termos-chave:**
- "Lista validada" (não "lista aprovada")
- "A escola publicou" (não "a instituição disponibilizou")
- "A IA escolheu" (não "o algoritmo recomendou")
- "Sem itens abusivos" (não "em conformidade")
- "Pronto" (não "Concluído")

---

## 10. Princípios de Design

1. **Verbo > Substantivo.** O produto resolve uma ação ("buscar", "montar", "retirar"), não apresenta uma feature.
2. **Número > Adjetivo.** "R$ 247" > "barato"; "2h" > "rápido"; "42 itens" > "completo".
3. **Hierarquia por peso, não por cor.** 90% da diferenciação visual vem de tamanho e peso de fonte.
4. **IA visível mas não ostensiva.** Mostrar que a IA agiu (badge, microanimação, copy "A IA escolheu") mas sem se gabar.
5. **Mobile-first 380px.** Cada tela funciona em 380px. Desktop é bonus.
6. **Procon-safe sempre visível** quando lista válida está em tela. É o seguro psicológico da plataforma.
7. **WhatsApp como atalho permanente** em telas relevantes — é o canal mais barato e mais brasileiro.
8. **Animação serve o conteúdo.** Cada motion tem propósito. Sem motion gratuito.

---

## 11. Acessibilidade (CRÍTICO)

- [ ] Contraste texto/fundo ≥ 4.5:1 em body (WCAG AA)
- [ ] Contraste de elementos grandes ≥ 3:1
- [ ] Alvos de toque ≥ 44x44px
- [ ] Focus visible em inputs e botões: `outline: 2px solid #1E40AF; outline-offset: 2px`
- [ ] Alt text em fotos de itens (essencial para leitores de tela)
- [ ] Suporte a `prefers-reduced-motion`
- [ ] Leitura sem zoom: body ≥ 16px
- [ ] Inputs com `inputmode` e `autocomplete` corretos (CEP, email, etc)

---

## 12. Mobile-first & PWA

- 380px viewport é o ponto de partida.
- Touch targets mínimos 44px (Apple) / 48dp (Material).
- Bottom nav fixa em telas com ≥ 4 seções principais.
- FAB para WhatsApp em telas de captura/lista.
- Gestos simples: tap, scroll vertical. **Sem swipe horizontal escondido.**

### PWA mandatório no MVP

- `manifest.json` com `name: "ListaCerta"`, `theme-color: #1E40AF`, `background-color: #F8FAFC`, `display: standalone`.
- App icons: 192px, 512px, 1024px (versão C-Tick).
- Maskable icon adaptive 432x432px com área segura central.
- Splash screen iOS/Android com logo C-Tick em fundo `#F8FAFC`.
- Service worker para cache de listas visitadas (offline-first das listas oficiais).
- Prompt "Adicionar à tela inicial" após 2 visitas.

---

## 13. Padrões de Layout

### Landing pública (indexável, sem login)

1. Hero com aurora animada blue+lime, headline em 900, dual-CTA "Buscar minha escola" + "Sou de uma escola"
2. Stats-counter animado: escolas conveniadas / pais cadastrados / itens validados Procon
3. Como funciona (3 passos com stagger reveal)
4. Diferencial Procon-safe (validador automatizado em ação visual)
5. Logos de varejistas integrados (marquee)
6. Depoimentos (carrossel sutil)
7. Para escolas (CTA secundário B2B)
8. Footer com C-Tick, links institucionais, política privacidade, DPO

### App pai (logado)

- Bottom nav 4 abas: `Home` / `Lista` / `Histórico` / `Conta`
- Header com saudação + avatar
- Cards arredondados radius-lg
- Sticky CTA bottom em telas de lista/carrinho

### App escola (logado)

- Sidebar em desktop, bottom nav em mobile
- Dashboard com KPIs (pais cadastrados, lista status, comunicados)
- Wizard 3-step pra publicar lista
- Painel de comunicados com templates pré-prontos

### Admin (logado, role=admin)

- Tabela de escolas pendentes com filtros
- Aprovação inline (1 click)
- Métricas em tempo real (PostHog dashboard embed ou cards próprios)
- Replay de sessão (link pra PostHog)

---

## 14. Anti-padrões do Sistema

**NUNCA:**
- ❌ Usar mascote de qualquer espécie
- ❌ Usar ilustração isométrica
- ❌ Usar ícones literais de papelaria
- ❌ Aplicar gradiente sunset (rosa-laranja-amarelo)
- ❌ Aplicar gradiente AI (violet-rosa-azul)
- ❌ Misturar Coral e Emerald na mesma peça
- ❌ Usar Coral ou Emerald de forma decorativa (só funcional)
- ❌ Usar fonte que não seja Inter
- ❌ Posicionar o produto como "fofo" ou "infantil"
- ❌ Usar exclamações em microcopia (cringe pós-2024)
- ❌ Animar tudo (só o que serve o conteúdo)

**SEMPRE:**
- ✅ Aplicar a regra 70/20/10 das cores
- ✅ Usar tabular-nums em preços e contagens
- ✅ Mostrar Procon-safe quando lista válida estiver em tela
- ✅ Oferecer WhatsApp como atalho onde fizer sentido
- ✅ Manter mobile-first como ponto de partida
- ✅ Respeitar `prefers-reduced-motion`
- ✅ Stagger reveal em listas com 3+ itens

---

**Versão**: 2.0 (MVP-ready, Cuiabá/MT)
**Última revisão**: abril 2026
**Owner**: Time de Produto ListaCerta
