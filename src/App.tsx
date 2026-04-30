import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import LandingPage from "./pages/LandingPage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import PrivacyPage from "./pages/PrivacyPage.tsx";
import TermsPage from "./pages/TermsPage.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import AuthCallbackPage from "./pages/AuthCallbackPage.tsx";
import ForbiddenPage from "./pages/ForbiddenPage.tsx";
import MinhaContaPage from "./pages/MinhaContaPage.tsx";
import CadastrarEscolaPage from "./pages/CadastrarEscolaPage.tsx";
import EscolaAguardandoPage from "./pages/EscolaAguardandoPage.tsx";
import MinhasEscolasPage from "./pages/MinhasEscolasPage.tsx";
import StatusEscolaPage from "./pages/StatusEscolaPage.tsx";
import AdminEscolasPage from "./pages/admin/AdminEscolasPage.tsx";
import AdminEscolaDetailPage from "./pages/admin/AdminEscolaDetailPage.tsx";
import EscolaListasPage from "./pages/escola/EscolaListasPage.tsx";
import EscolaListaNovaPage from "./pages/escola/EscolaListaNovaPage.tsx";
import EscolaListaDetailPage from "./pages/escola/EscolaListaDetailPage.tsx";
import AdminsPage from "./pages/escola/AdminsPage.tsx";
import RedeemAdminInvitePage from "./pages/escola/RedeemAdminInvitePage.tsx";
import BuscarPage from "./pages/BuscarPage.tsx";
import EscolaPublicaPage from "./pages/EscolaPublicaPage.tsx";
import EscolaPublicaListaPage from "./pages/EscolaPublicaListaPage.tsx";
import MeusAlunosPage from "./pages/aluno/MeusAlunosPage.tsx";
import CadastrarAlunoPage from "./pages/aluno/CadastrarAlunoPage.tsx";
import AlunoListaPage from "./pages/aluno/AlunoListaPage.tsx";
import StudentCartPage from "./pages/parent/StudentCartPage.tsx";
import RedirectToRetailerPage from "./pages/redirect/RedirectToRetailerPage.tsx";
import ShortLinkResolverPage from "./pages/redirect/ShortLinkResolverPage.tsx";
import { useUtmCapture } from "@/hooks/useUtmCapture";

const queryClient = new QueryClient();

// Captures utm_* params from the entry URL exactly once per session.
// Mounted under BrowserRouter so future router-aware versions can read
// useLocation if needed; today it only touches window.location.
function UtmCapture() {
  useUtmCapture();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <UtmCapture />
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/403" element={<ForbiddenPage />} />
            <Route path="/privacidade" element={<PrivacyPage />} />
            <Route path="/termos" element={<TermsPage />} />
            <Route
              path="/minha-conta"
              element={
                <ProtectedRoute>
                  <MinhaContaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/escola/cadastrar"
              element={
                <ProtectedRoute>
                  <CadastrarEscolaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/escola/aguardando"
              element={
                <ProtectedRoute>
                  <EscolaAguardandoPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/minhas-escolas"
              element={
                <ProtectedRoute>
                  <MinhasEscolasPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/escola/:id/status"
              element={
                <ProtectedRoute>
                  <StatusEscolaPage />
                </ProtectedRoute>
              }
            />
            {/*
              LC-002.5 co-admin.
              /escola/:id/admins — gerenciar admins da escola.
              /escola/admin-convite/:token — aceitar convite (caller anon
              cai em /login com state.from preservado pelo ProtectedRoute).
              React Router v6 ranqueia segmento literal acima de param,
              então 'admin-convite' bate antes de :slug (rota pública mais
              abaixo).
            */}
            <Route
              path="/escola/:id/admins"
              element={
                <ProtectedRoute>
                  <AdminsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/escola/admin-convite/:token"
              element={
                <ProtectedRoute>
                  <RedeemAdminInvitePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/escola/:id/listas/nova"
              element={
                <ProtectedRoute>
                  <EscolaListaNovaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/escola/:id/listas/:listId"
              element={
                <ProtectedRoute>
                  <EscolaListaDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/escola/:id/listas"
              element={
                <ProtectedRoute>
                  <EscolaListasPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminGuard>
                    <Navigate to="/admin/escolas" replace />
                  </AdminGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/escolas"
              element={
                <ProtectedRoute>
                  <AdminGuard>
                    <AdminLayout>
                      <AdminEscolasPage />
                    </AdminLayout>
                  </AdminGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/escolas/:id"
              element={
                <ProtectedRoute>
                  <AdminGuard>
                    <AdminLayout>
                      <AdminEscolaDetailPage />
                    </AdminLayout>
                  </AdminGuard>
                </ProtectedRoute>
              }
            />
            <Route
              path="/meus-alunos"
              element={
                <ProtectedRoute>
                  <MeusAlunosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meus-alunos/novo"
              element={
                <ProtectedRoute>
                  <CadastrarAlunoPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meus-alunos/:studentId/lista"
              element={
                <ProtectedRoute>
                  <AlunoListaPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meus-alunos/:studentId/carrinho"
              element={
                <ProtectedRoute>
                  <StudentCartPage />
                </ProtectedRoute>
              }
            />
            {/*
              Public routes (LC-006). React Router v6 ranks literal segments
              over params, so /escola/cadastrar and /escola/aguardando win
              over /escola/:slug regardless of declaration order. The 4-seg
              /escola/:slug/lista/:listId uses the singular "lista" while
              the admin route uses plural "listas" — distinct literal in
              segment 3, no ambiguity.
            */}
            <Route path="/buscar" element={<BuscarPage />} />
            <Route path="/escola/:slug" element={<EscolaPublicaPage />} />
            <Route
              path="/escola/:slug/lista/:listId"
              element={<EscolaPublicaListaPage />}
            />
            {/*
              LC-009 redirect funnel.
              /r/:shortId resolves an 8-hex prefix and bounces to /ir-para.
              /ir-para/:strategyId/:retailerKey shows the per-strategy
              landing page with affiliate disclosure and per-item CTAs.
              Both are protected — only the parent who owns the strategy
              can render the cart contents (RLS enforced).
            */}
            <Route
              path="/r/:shortId"
              element={
                <ProtectedRoute>
                  <ShortLinkResolverPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ir-para/:strategyId/:retailerKey"
              element={
                <ProtectedRoute>
                  <RedirectToRetailerPage />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
