import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Briefcase, Settings, Layers,
  CreditCard, FileText, Clock, Copy, BarChart2, ChevronRight, PieChart, Target, Shield, KanbanSquare, Bookmark, ListTodo, FileBarChart, Zap
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import BottomNav from "./components/layout/BottomNav";
import MobileHeader from "./components/layout/MobileHeader";
import SubscriptionGate from "./components/auth/SubscriptionGate";
import NotificationBell from "./components/notifications/NotificationBell";

const PUBLIC_PAGES = ["AAppLanding", "Resources", "BlogPost", "Billing", "CalculatorHub", "FreeCalculator", "FreeJobCostingCalculator", "PrivacyPolicy", "TermsOfService", "Contact", "ProfitCalculators", "ApproveChangeOrder", "CompareJobber", "CompareHousecallPro", "CompareQuickBooks", "CompareBuildertrend", "CompareKnowify", "CompareContractorForeman", "CompareProcore", "CompareServiceTitan", "CompareHub", "ForHvac", "ForElectrical", "ForPlumbing", "ForRoofing", "ForRemodeling"];

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { label: "Jobs", icon: Briefcase, page: "Jobs" },
  { label: "Quick CO", icon: Zap, page: "QuickCO", path: "/quick-co" },
  { label: "Job Pipeline", icon: KanbanSquare, page: "JobPipeline", path: "/job-pipeline" },
  { label: "Job Templates", icon: Bookmark, page: "JobTemplates", path: "/job-templates" },
  { label: "Tasks", icon: ListTodo, page: "Tasks", path: "/tasks" },
  { label: "WIP Report", icon: FileBarChart, page: "WipReport", path: "/wip-report" },
  { label: "Estimates", icon: FileText, page: "Estimates" },
  { label: "Invoices", icon: FileText, page: "Invoices", path: "/invoices" },
  { label: "Calculators", icon: BarChart2, page: "CalculatorHub" },
  { label: "Break-Even", icon: Target, page: "BreakEvenAnalysis" },
  { label: "Portfolio View", icon: PieChart, page: "PortfolioView" },
  { label: "Profit Alerts", icon: BarChart2, page: "ProfitAlerts" },
  { label: "Time Tracking", icon: Clock, page: "TimeTracking" },
  { label: "CO Templates", icon: Copy, page: "COTemplates" },
  { label: "Warranties", icon: Shield, page: "Warranties" },
  { label: "Cost Presets", icon: Layers, page: "CostPresets" },
  { label: "Proposals", icon: FileText, page: "Proposals" },
  { label: "Settings", icon: Settings, page: "Settings" },
  { label: "Marketing", icon: BarChart2, page: "MarketingInsights" },
];

// Sync dark mode with system preference
function useDarkMode() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (e) => {
      document.documentElement.classList.toggle("dark", e.matches);
    };
    apply(mq);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
}

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(undefined);
  const location = useLocation();

  useDarkMode();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const isPublic = PUBLIC_PAGES.includes(currentPageName);

  // Inject noindex for authenticated pages; public pages stay indexable
  useEffect(() => {
    if (isPublic) return;
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      if (meta.parentNode) document.head.removeChild(meta);
    };
  }, [isPublic]);

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-60 bg-card border-r border-border flex-col">
        <div className="flex items-center gap-2 px-5 py-4 border-b">
          <Link to={createPageUrl("AAppLanding")} className="flex items-center gap-2 flex-1 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-blue-700 flex items-center justify-center">
              <span className="text-white text-xs font-bold">CO</span>
            </div>
            <span className="font-bold text-gray-900 text-sm leading-tight">Contractor<br/>Profitability Suite</span>
          </Link>
          <NotificationBell />
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.filter(({ page }) => page !== "MarketingInsights" || user?.role === "admin").map(({ label, icon: Icon, page, path }) => {
            const active = currentPageName === page;
            return (
              <Link
                key={page}
                to={path || createPageUrl(page)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <Link
            to={createPageUrl("Billing")}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors"
          >
            <CreditCard className="w-4 h-4" /> Billing & Plans
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-0 lg:pl-60">
        {/* Mobile Header */}
        <MobileHeader currentPageName={currentPageName} />

        {/* Page content with slide transition */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname + location.search}
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="h-full"
            >
              <SubscriptionGate>
                {children}
              </SubscriptionGate>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav currentPageName={currentPageName} />
    </div>
  );
}