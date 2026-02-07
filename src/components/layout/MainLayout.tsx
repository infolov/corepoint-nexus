import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * MainLayout - globalny layout dla stron publicznych.
 * Renderuje Header i Footer raz, eliminując duplikację w poszczególnych stronach.
 * Strony dashboardowe używają własnego layoutu (Dashboard.tsx).
 */
export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background w-full overflow-x-clip">
      <Header />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
