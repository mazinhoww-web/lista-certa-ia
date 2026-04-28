import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Logo } from "@/components/shared/Logo";
import { Footer } from "@/components/landing/Footer";
import privacyMd from "@/content/privacy.md?raw";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center justify-between border-b border-lc-border bg-lc-white sticky top-0 z-10">
        <Link to="/" aria-label="ListaCerta — início">
          <Logo size="sm" />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-lc-mid hover:text-lc-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-5 md:px-8 py-12 md:py-20 w-full">
        <article
          className="prose prose-slate max-w-none
            prose-headings:tracking-tight prose-headings:text-lc-ink
            prose-h1:text-4xl md:prose-h1:text-5xl prose-h1:font-black prose-h1:tracking-tighter prose-h1:mb-2
            prose-h2:text-2xl prose-h2:font-extrabold prose-h2:mt-12
            prose-h3:text-xl prose-h3:font-bold prose-h3:mt-8
            prose-p:text-lc-ink/85 prose-p:leading-relaxed
            prose-li:text-lc-ink/85
            prose-strong:text-lc-ink prose-strong:font-bold
            prose-a:text-lc-blue prose-a:no-underline hover:prose-a:underline
            prose-code:text-lc-ink prose-code:bg-lc-surface prose-code:rounded prose-code:px-1
            prose-table:text-sm prose-th:bg-lc-surface
            prose-blockquote:border-l-lc-blue prose-blockquote:text-lc-mid prose-blockquote:not-italic"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{privacyMd}</ReactMarkdown>
        </article>
      </main>

      <Footer />
    </div>
  );
}
