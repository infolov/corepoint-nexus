import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DisplayModeProvider } from "@/hooks/use-display-mode";
import { DemoProvider } from "@/contexts/DemoContext";
import { LocationProvider } from "@/components/geolocation/LocationProvider";
import { CookieConsentProvider } from "@/hooks/use-cookie-consent";
import { CookieConsentBanner } from "@/components/cookies/CookieConsentBanner";
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

// Role-specific dashboard home pages
import DashboardUser from "./pages/dashboard/DashboardUser";
import DashboardPartner from "./pages/dashboard/DashboardPartner";
import DashboardPublisherHome from "./pages/dashboard/DashboardPublisherHome";
import DashboardAdminHome from "./pages/dashboard/DashboardAdminHome";

// Shared dashboard pages (can be accessed by relevant roles)
import DashboardHome from "./pages/dashboard/DashboardHome";
import DashboardCalendar from "./pages/dashboard/DashboardCalendar";
import DashboardPlacements from "./pages/dashboard/DashboardPlacements";
import DashboardCredits from "./pages/dashboard/DashboardCredits";
import DashboardStats from "./pages/dashboard/DashboardStats";
import DashboardCampaigns from "./pages/dashboard/DashboardCampaigns";
import DashboardSettings from "./pages/dashboard/DashboardSettings";
import DashboardCampaignCreator from "./pages/dashboard/DashboardCampaignCreator";
import DashboardPreview from "./pages/dashboard/DashboardPreview";
import DashboardPartnerApplication from "./pages/dashboard/DashboardPartnerApplication";
import DashboardPublisher from "./pages/dashboard/DashboardPublisher";

// Admin pages
import DashboardAdminCampaigns from "./pages/dashboard/DashboardAdminCampaigns";
import DashboardAdminUsers from "./pages/dashboard/DashboardAdminUsers";
import DashboardAdminPlacements from "./pages/dashboard/DashboardAdminPlacements";
import DashboardAdminStats from "./pages/dashboard/DashboardAdminStats";
import DashboardAdminPartners from "./pages/dashboard/DashboardAdminPartners";
import DashboardAdminCarousels from "./pages/dashboard/DashboardAdminCarousels";
import DashboardAdminFactCheck from "./pages/dashboard/DashboardAdminFactCheck";
import DashboardAdminSettings from "./pages/dashboard/DashboardAdminSettings";
import DashboardAdminLogs from "./pages/dashboard/DashboardAdminLogs";
import DashboardAdminApplications from "./pages/dashboard/DashboardAdminApplications";
import DashboardAdminJournalists from "./pages/dashboard/DashboardAdminJournalists";
import DashboardAdminCategories from "./pages/dashboard/DashboardAdminCategories";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DisplayModeProvider>
      <DemoProvider>
        <LocationProvider>
          <CookieConsentProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <CookieConsentBanner />
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
                
                {/* Dashboard with nested routes */}
                <Route path="/dashboard" element={<Dashboard />}>
                  {/* Base dashboard redirects to role-specific dashboard */}
                  <Route index element={<DashboardHome />} />
                  
                  {/* User dashboard routes */}
                  <Route path="user" element={<DashboardUser />} />
                  <Route path="user/settings" element={<DashboardSettings />} />
                  <Route path="user/partner-application" element={<DashboardPartnerApplication />} />
                  
                  {/* Partner dashboard routes */}
                  <Route path="partner" element={<DashboardPartner />} />
                  <Route path="partner/stats" element={<DashboardStats />} />
                  <Route path="partner/campaigns" element={<DashboardCampaigns />} />
                  <Route path="partner/campaigns/new" element={<DashboardCampaignCreator />} />
                  <Route path="partner/calendar" element={<DashboardCalendar />} />
                  <Route path="partner/preview" element={<DashboardPreview />} />
                  <Route path="partner/placements" element={<DashboardPlacements />} />
                  <Route path="partner/credits" element={<DashboardCredits />} />
                  <Route path="partner/settings" element={<DashboardSettings />} />
                  
                  {/* Publisher dashboard routes */}
                  <Route path="publisher" element={<DashboardPublisherHome />} />
                  <Route path="publisher/articles" element={<DashboardPublisher />} />
                  <Route path="publisher/articles/new" element={<DashboardPublisher />} />
                  <Route path="publisher/stats" element={<DashboardStats />} />
                  <Route path="publisher/journalists" element={<DashboardAdminJournalists />} />
                  <Route path="publisher/settings" element={<DashboardSettings />} />
                  
                  {/* Admin dashboard routes */}
                  <Route path="admin" element={<DashboardAdminHome />} />
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
                  <Route path="admin/categories" element={<DashboardAdminCategories />} />
                  
                  {/* Legacy routes - redirect to new structure */}
                  <Route path="calendar" element={<Navigate to="/dashboard/partner/calendar" replace />} />
                  <Route path="placements" element={<Navigate to="/dashboard/partner/placements" replace />} />
                  <Route path="campaigns/new" element={<Navigate to="/dashboard/partner/campaigns/new" replace />} />
                  <Route path="credits" element={<Navigate to="/dashboard/partner/credits" replace />} />
                  <Route path="stats" element={<Navigate to="/dashboard/partner/stats" replace />} />
                  <Route path="campaigns" element={<Navigate to="/dashboard/partner/campaigns" replace />} />
                  <Route path="settings" element={<DashboardSettings />} />
                  <Route path="preview" element={<Navigate to="/dashboard/partner/preview" replace />} />
                  <Route path="partner-application" element={<Navigate to="/dashboard/user/partner-application" replace />} />
                </Route>
                
                <Route path="/sport/:subcategory/:subsubcategory" element={<Category />} />
                <Route path="/sport/:subcategory" element={<Category />} />
                <Route path="/:category" element={<Category />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </CookieConsentProvider>
        </LocationProvider>
      </DemoProvider>
    </DisplayModeProvider>
  </QueryClientProvider>
);

export default App;
