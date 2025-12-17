import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DisplayModeProvider } from "@/hooks/use-display-mode";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Category from "./pages/Category";
import Article from "./pages/Article";
import Search from "./pages/Search";
import NotificationSettings from "./pages/NotificationSettings";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/dashboard/Dashboard";
import DashboardHome from "./pages/dashboard/DashboardHome";
import DashboardCalendar from "./pages/dashboard/DashboardCalendar";
import DashboardPlacements from "./pages/dashboard/DashboardPlacements";
import DashboardCredits from "./pages/dashboard/DashboardCredits";
import DashboardStats from "./pages/dashboard/DashboardStats";
import DashboardCampaigns from "./pages/dashboard/DashboardCampaigns";
import DashboardSettings from "./pages/dashboard/DashboardSettings";
import DashboardCampaignCreator from "./pages/dashboard/DashboardCampaignCreator";
import DashboardAdminCampaigns from "./pages/dashboard/DashboardAdminCampaigns";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DisplayModeProvider>
      <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/artykul/:id" element={<Article />} />
          <Route path="/notifications/settings" element={<NotificationSettings />} />
          <Route path="/szukaj" element={<Search />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<DashboardHome />} />
            <Route path="calendar" element={<DashboardCalendar />} />
            <Route path="placements" element={<DashboardPlacements />} />
            <Route path="campaigns/new" element={<DashboardCampaignCreator />} />
            <Route path="credits" element={<DashboardCredits />} />
            <Route path="stats" element={<DashboardStats />} />
            <Route path="campaigns" element={<DashboardCampaigns />} />
            <Route path="settings" element={<DashboardSettings />} />
            <Route path="admin/campaigns" element={<DashboardAdminCampaigns />} />
          </Route>
          <Route path="/sport/:subcategory" element={<Category />} />
          <Route path="/:category" element={<Category />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </DisplayModeProvider>
  </QueryClientProvider>
);

export default App;
