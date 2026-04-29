import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA — registra service worker apenas fora do iframe e fora do preview Lovable.
// Em dev/preview, o SW interfere com hot reload e navegação. Em produção
// (listacertaescolar.com.br), o SW ativa normalmente.
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();
const isPreviewHost =
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovable.app");

if (isPreviewHost || isInIframe) {
  // Garante que nenhum SW antigo continue ativo no preview
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
  }
} else if ("serviceWorker" in navigator) {
  import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}

const FALLBACK_HTML = `
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0F172A;color:#F8FAFC;font-family:system-ui,sans-serif;padding:24px">
    <div style="max-width:480px;text-align:center">
      <h1 style="font-size:32px;font-weight:800;margin:0 0 16px;letter-spacing:-0.02em">Algo nao saiu como esperado.</h1>
      <p style="font-size:16px;color:#64748B;margin:0 0 24px;line-height:1.6">Recarregue a pagina em alguns segundos. Se persistir, fale com a gente.</p>
      <button onclick="location.reload()" style="background:#1E40AF;color:white;border:0;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">Recarregar</button>
      <p style="font-size:12px;color:#475569;margin:24px 0 0"><a href="mailto:contato@listacertaescolar.com.br" style="color:inherit;text-decoration:none">contato@listacertaescolar.com.br</a></p>
    </div>
  </div>
`;

try {
  createRoot(document.getElementById("root")!).render(<App />);
} catch (err) {
  const root = document.getElementById("root");
  if (root) root.innerHTML = FALLBACK_HTML;
  // Re-throw to keep the error in the console / future Sentry integration.
  throw err;
}
