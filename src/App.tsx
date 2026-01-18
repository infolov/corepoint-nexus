import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DisplayModeProvider } from "@/hooks/use-display-mode";
import { DemoProvider } from "@/contexts/DemoContext";
import { LocationProvider } from "@/components/geolocation/LocationProvider";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Category from "./pages/Category";
import Article from "./pages/Article";
import Search from "./pages/Search";
import NotificationSettings from "./pages/NotificationSettings";
import Interests from "./pages/Interests";
import NotFound from "./pages/NotFound";
import SavedArticles from "./pages/SavedArticles";
import WeatherDetails from "./pages/WeatherDetails";
import AutoNews from "./pages/AutoNews";
import LocalNews from "./pages/LocalNews";
import DailySummary from "./pages/DailySummary";
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
import DashboardAdminUsers from "./pages/dashboard/DashboardAdminUsers";
import DashboardAdminPlacements from "./pages/dashboard/DashboardAdminPlacements";
import DashboardAdminStats from "./pages/dashboard/DashboardAdminStats";
import DashboardAdminPartners from "./pages/dashboard/DashboardAdminPartners";
import DashboardAdminCarousels from "./pages/dashboard/DashboardAdminCarousels";
import DashboardAdminFactCheck from "./pages/dashboard/DashboardAdminFactCheck";
import DashboardAdminSettings from "./pages/dashboard/DashboardAdminSettings";
import DashboardAdminLogs from "./pages/dashboard/DashboardAdminLogs";
import DashboardPreview from "./pages/dashboard/DashboardPreview";
import DashboardPartnerApplication from "./pages/dashboard/DashboardPartnerApplication";
import DashboardAdminApplications from "./pages/dashboard/DashboardAdminApplications";
import DashboardAdminJournalists from "./pages/dashboard/DashboardAdminJournalists";
import DashboardPublisher from "./pages/dashboard/DashboardPublisher";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DisplayModeProvider>
      <DemoProvider>
        <LocationProvider>
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
                <Route path="/interests" element={<Interests />} />
                <Route path="/szukaj" element={<Search />} />
                <Route path="/zapisane" element={<SavedArticles />} />
                <Route path="/pogoda-szczegoly" element={<WeatherDetails />} />
                <Route path="/auto-news" element={<AutoNews />} />
                <Route path="/lokalne" element={<LocalNews />} />
                <Route path="/skrot-dnia" element={<DailySummary />} />
                <Route path="/dashboard" element={<Dashboard />}>
                  <Route index element={<DashboardHome />} />
                  <Route path="calendar" element={<DashboardCalendar />} />
                  <Route path="placements" element={<DashboardPlacements />} />
                  <Route path="campaigns/new" element={<DashboardCampaignCreator />} />
                  <Route path="credits" element={<DashboardCredits />} />
                  <Route path="stats" element={<DashboardStats />} />
                  <Route path="campaigns" element={<DashboardCampaigns />} />
                  <Route path="settings" element={<DashboardSettings />} />
                  <Route path="preview" element={<DashboardPreview />} />
                  <Route path="partner-application" element={<DashboardPartnerApplication />} />
                  <Route path="admin/campaigns" element={<DashboardAdminCampaigns />} />
                  <Route path="admin/users" element={<DashboardAdminUsers />} />
                  <Route path="admin/placements" element={<DashboardAdminPlacements />} />
                  <Route path="admin/stats" element={<DashboardAdminStats />} />
                  <Route path="admin/partners" element={<DashboardAdminPartners />} />
                  <Route path="admin/carousels" element={<DashboardAdminCarousels />} />
                  <Route path="admin/factcheck" element={<DashboardAdminFactCheck />} />
                  <Route path="admin/settings" element={<DashboardAdminSettings />} />
                  <Route path="admin/logs" element={<DashboardAdminLogs />} />
                  <Route path="admin/applications" element={<DashboardAdminApplications />} />
                  <Route path="admin/journalists" element={<DashboardAdminJournalists />} />
                  <Route path="publisher" element={<DashboardPublisher />} />
                </Route>
                <Route path="/sport/:subcategory" element={<Category />} />
                <Route path="/:category" element={<Category />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LocationProvider>
      </DemoProvider>
    </DisplayModeProvider>
  </QueryClientProvider>
);

export default App;
