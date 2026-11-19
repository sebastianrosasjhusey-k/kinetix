import { PanelShell } from "./PanelShell";
import "../admin.css";

export const metadata = { robots: { index: false } };

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <PanelShell>{children}</PanelShell>;
}
