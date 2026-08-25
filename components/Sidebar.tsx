"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { COLORS } from "@/lib/colors";

export { COLORS };

const NAV_ITEMS = [
  { href: "/pazienti", label: "Pazienti", icon: "👥" },
  { href: "/misurazione", label: "Calcolatore", icon: "📐" },
  { href: "/confronto", label: "Confronto", icon: "📊" },
  { href: "/admin/popolazioni", label: "Popolazioni", icon: "📚" },
];

export default function Sidebar({ userName }: { userName?: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="sidebar-desktop" style={sidebarStyle}>
        <div style={{ padding: "24px 20px 20px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>BIVA Platform</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Dott. Mauro Saiglia</div>
        </div>

        <nav style={{ flex: 1, padding: "8px 12px" }}>
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  color: active ? COLORS.primary : COLORS.text,
                  background: active ? COLORS.primaryLight : "transparent",
                  textDecoration: "none",
                  marginBottom: 2,
                }}
              >
                <span style={{ fontSize: 14, opacity: 0.85 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: 16, borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>{userName}</div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{
              width: "100%",
              padding: "7px 0",
              borderRadius: 6,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.surface,
              color: COLORS.textMuted,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Esci
          </button>
        </div>
      </aside>

      {/* Barra mobile */}
      <div className="sidebar-mobile" style={mobileBarStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>BIVA Platform</div>
        <div style={{ display: "flex", gap: 14, overflowX: "auto" }}>
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  color: active ? COLORS.primary : COLORS.textMuted,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 12, cursor: "pointer", padding: 0 }}
          >
            Esci
          </button>
        </div>
      </div>
    </>
  );
}

const sidebarStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  bottom: 0,
  width: 220,
  background: COLORS.surface,
  borderRight: `1px solid ${COLORS.border}`,
  display: "flex",
  flexDirection: "column",
  fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
  zIndex: 10,
};

const mobileBarStyle: React.CSSProperties = {
  display: "none",
  position: "sticky",
  top: 0,
  background: COLORS.surface,
  borderBottom: `1px solid ${COLORS.border}`,
  padding: "12px 16px",
  flexDirection: "column",
  gap: 10,
  fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
  zIndex: 10,
};
