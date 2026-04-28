# ListaCerta

Plataforma neutra que conecta pais brasileiros à lista oficial de material escolar dos filhos, com IA que monta carrinhos otimizados em múltiplos varejistas. Foco inicial: Cuiabá, MT.

## Quick start

```bash
npm install
cp .env.example .env.local  # preencher com credenciais Lovable Cloud
npm run dev
```

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
