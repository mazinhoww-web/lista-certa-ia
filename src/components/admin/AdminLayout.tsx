// Shell for /admin/* pages. One nav item today (Escolas); the structure is
// kept generic so future sections (Usuários, Listas) drop in without
// rewriting the layout. Mobile keeps the nav as a horizontal bar under
// the header; desktop pins it as a sidebar.

import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

interface NavItem {
  to: string;
  label: string;
  Icon: typeof GraduationCap;
}

const NAV: NavItem[] = [
  { to: "/admin/escolas", label: "Escolas", Icon: GraduationCap },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-lc-surface flex flex-col">
      <header className="px-5 md:px-8 h-16 flex items-center justify-between border-b border-lc-border bg-lc-white">
        <Link to="/" aria-label="ListaCerta — início" className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="text-xs font-bold uppercase tracking-wider text-lc-mid">
            Admin
          </span>
        </Link>
        <Link
          to="/minha-conta"
          className="text-sm font-semibold text-lc-mid hover:text-lc-ink transition-colors"
        >
          Minha conta
        </Link>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        <nav
          aria-label="Navegação admin"
          className="md:w-56 md:border-r md:border-lc-border md:bg-lc-white md:py-6 md:px-3"
        >
          <ul className="flex md:flex-col gap-1 px-5 py-3 md:px-0 md:py-0 overflow-x-auto">
            {NAV.map(({ to, label, Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 h-10 px-3 rounded-lg text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-lc-blue/10 text-lc-blue"
                        : "text-lc-mid hover:bg-lc-surface hover:text-lc-ink"
                    }`
                  }
                >
                  <Icon className="w-4 h-4" aria-hidden />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 px-5 md:px-8 py-6 md:py-10">{children}</main>
      </div>
    </div>
  );
}
