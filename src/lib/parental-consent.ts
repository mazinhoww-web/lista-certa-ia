// Parental consent — versão e texto do termo apresentado no cadastro de
// aluno. Gravado em students.parental_consent_version + students.parental_consent_at.
//
// ⚠️ PLACEHOLDER — REVISAR JURIDICAMENTE ANTES DE ONBOARDING EXTERNO (BACKLOG TD-10).
// O texto abaixo é uma versão conservadora redigida sem advogado e SUFICIENTE
// apenas para uso interno (sócios, escolas amigas, smoke tests). Onboardar
// pai externo SEM revisão jurídica = risco direto de multa LGPD/ANPD.
//
// Quando o termo passar por revisão, suba a versão (ex.: v2.2026.05) e
// atualize o array CONSENT_HISTORY abaixo para histórico imutável.

export const CURRENT_CONSENT_VERSION = "v1.2026.04";

export const CONSENT_HISTORY: ReadonlyArray<{
  version: string;
  publishedAt: string;
  status: "placeholder" | "reviewed";
}> = [
  {
    version: "v1.2026.04",
    publishedAt: "2026-04-29",
    status: "placeholder",
  },
];

export const PARENTAL_CONSENT_TEXT = `TERMO DE CONSENTIMENTO PARENTAL — ListaCerta

Eu, responsável legal pelo menor cujos dados estou cadastrando, confirmo que:

1. Sou pai, mãe ou responsável legal pelo menor (LGPD Art. 14, §1º).
2. Compreendo que serão coletados apenas: primeiro nome, escola, série, nome de
   professor (quando aplicável). Não coletamos sobrenome, CPF, RG, foto ou
   qualquer dado biométrico.
3. Os dados serão usados exclusivamente para personalizar a visualização da
   lista escolar deste menor e marcar itens já adquiridos.
4. Não compartilharemos esses dados com terceiros sem novo consentimento,
   exceto obrigação legal.
5. Posso solicitar acesso, correção ou exclusão dos dados a qualquer momento
   pelo canal de privacidade da plataforma. A exclusão é processada em até 90
   dias por necessidade técnica de auditoria, conforme política interna.
6. Tenho ciência de que aceitando este termo, autorizo o tratamento conforme
   descrito acima até que eu solicite a revogação.

Versão do termo: ${CURRENT_CONSENT_VERSION}`;
