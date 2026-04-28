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

createRoot(document.getElementById("root")!).render(<App />);
