"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { useState } from "react";

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
  );
}

export function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "rgba(7, 10, 17, 0.72)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.04), 0 8px 40px rgba(0,0,0,0.5)",
      }}
    >
      {/* Subtle top-edge highlight for glass realism */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 30%, rgba(99,155,230,0.2) 50%, rgba(255,255,255,0.12) 70%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto flex h-[70px] max-w-7xl items-center px-5 sm:px-8 lg:px-10">

        {/* ── Logo ── */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 select-none group z-10"
        >
          <div
            className="flex items-center justify-center transition-all duration-200"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
              border: "1px solid rgba(255,255,255,0.16)",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(99,155,230,0.2) 0%, rgba(99,155,230,0.08) 100%)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(99,155,230,0.4)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.16)";
            }}
          >
            <GitHubMark className="h-[20px] w-[20px] fill-white" />
          </div>

          <div className="hidden sm:flex flex-col -space-y-0.5">
            <span
              className="text-[15px] font-bold tracking-tight leading-none"
              style={{ color: "rgba(255,255,255,0.95)" }}
            >
              GitHub Census
            </span>
            <span
              className="text-[10px] font-medium tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              User Estimation
            </span>
          </div>
        </Link>

        {/* ── Desktop nav — absolutely centered ── */}
        <nav className="hidden md:flex absolute left-0 right-0 justify-center items-center gap-1 pointer-events-none">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all duration-200 select-none"
                style={
                  active
                    ? {
                        background: "linear-gradient(135deg, rgba(99,155,230,0.18) 0%, rgba(99,155,230,0.08) 100%)",
                        color: "rgba(255,255,255,0.98)",
                        fontWeight: 600,
                        fontSize: "16px",
                        border: "1px solid rgba(99,155,230,0.3)",
                        boxShadow: "0 0 20px rgba(99,155,230,0.15), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
                        letterSpacing: "-0.01em",
                      }
                    : {
                        color: "rgba(255,255,255,0.52)",
                        fontWeight: 500,
                        fontSize: "16px",
                        border: "1px solid transparent",
                        letterSpacing: "-0.01em",
                      }
                }
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.88)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.52)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                  }
                }}
              >
                {"live" in item && item.live && (
                  <span
                    className="data-pulse h-[7px] w-[7px] rounded-full shrink-0"
                    style={{ background: active ? "#f87171" : "rgba(248,113,113,0.65)" }}
                  />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* ── Right: GitHub source button ── */}
        <a
          href="https://github.com/shyampatadia/github-user-estimation-webapp"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-2 ml-auto rounded-xl px-4 py-2 text-[14px] font-medium transition-all duration-200 select-none z-10"
          style={{
            color: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)";
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
          }}
        >
          <GitHubMark className="h-[15px] w-[15px] fill-current" />
          Source
        </a>

        {/* ── Mobile hamburger ── */}
        <button
          className="ml-auto md:hidden rounded-xl p-2 transition-all duration-150 z-10"
          style={{
            color: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
          }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            {mobileOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            }
          </svg>
        </button>
      </div>

      {/* ── Mobile dropdown ── */}
      {mobileOpen && (
        <nav
          className="md:hidden px-4 pb-5 pt-3 space-y-1"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(7,10,17,0.95)",
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-[16px] font-medium transition-all duration-150"
                style={
                  active
                    ? {
                        background: "linear-gradient(135deg, rgba(99,155,230,0.15) 0%, rgba(99,155,230,0.06) 100%)",
                        color: "rgba(255,255,255,0.96)",
                        fontWeight: 600,
                        border: "1px solid rgba(99,155,230,0.25)",
                      }
                    : { color: "rgba(255,255,255,0.58)", border: "1px solid transparent" }
                }
              >
                {"live" in item && item.live && (
                  <span className="data-pulse h-[7px] w-[7px] rounded-full bg-red-400/70 shrink-0" />
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
