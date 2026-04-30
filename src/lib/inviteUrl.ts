// LC-002.5: helper para montar a URL absoluta de um convite de co-admin.
// Usado pelo InviteAdminModal pra exibir + copiar + compartilhar via
// WhatsApp. Centralizado aqui pra que mudança de path da rota
// (`/escola/admin-convite/...`) seja feita num lugar só.

export function inviteUrl(token: string): string {
  if (typeof window === "undefined") {
    // SSR / build-time fallback. Em runtime no browser, window.location.origin
    // sempre existe — esse caminho só é tocado por testes ou pré-render.
    return `/escola/admin-convite/${token}`;
  }
  return `${window.location.origin}/escola/admin-convite/${token}`;
}
