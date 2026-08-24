import Sidebar, { COLORS } from "@/components/Sidebar";

export default function AppShell({ userName, children }: { userName?: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg }}>
      <Sidebar userName={userName} />
      <div className="app-content" style={{ marginLeft: 220 }}>
        {children}
      </div>
    </div>
  );
}
