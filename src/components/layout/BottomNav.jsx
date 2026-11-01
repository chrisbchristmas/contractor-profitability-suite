import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Briefcase, Settings, Layers,
  CreditCard, FileText, Clock, Copy, BarChart2, Bookmark, ListTodo, Zap
} from "lucide-react";


const allTabs = [
  { label: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { label: "Jobs", icon: Briefcase, page: "Jobs" },
  { label: "Quick CO", icon: Zap, page: "QuickCO" },
  { label: "Estimates", icon: FileText, page: "Estimates" },
  { label: "Invoices", icon: FileText, page: "Invoices" },
  { label: "Job Templates", icon: Bookmark, page: "JobTemplates" },
  { label: "Tasks", icon: ListTodo, page: "Tasks" },
  { label: "Calculators", icon: BarChart2, page: "CalculatorHub" },
  { label: "Profit Alerts", icon: BarChart2, page: "ProfitAlerts" },
  { label: "Time Tracking", icon: Clock, page: "TimeTracking" },
  { label: "CO Templates", icon: Copy, page: "Templates" },
  { label: "Cost Presets", icon: Layers, page: "CostPresets" },
  { label: "Proposals", icon: FileText, page: "Proposals" },
  { label: "Billing", icon: CreditCard, page: "Billing" },
  { label: "Settings", icon: Settings, page: "Settings" },
];

const scrollPositions = {};

export default function BottomNav({ currentPageName }) {
  const tabs = allTabs;

  const handleTabClick = (page) => {
    scrollPositions[currentPageName] = window.scrollY;
  };

  const handleTabMouseDown = (page) => {
    if (page === currentPageName) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="flex overflow-x-auto scrollbar-hide" style={{ minHeight: "60px" }}>
        {tabs.map(({ label, icon: Icon, page }) => {
          const active = currentPageName === page;
          return (
            <Link
              key={page}
              to={createPageUrl(page)}
              state={{ restoreScroll: scrollPositions[page] ?? 0 }}
              onClick={() => handleTabClick(page)}
              onMouseDown={() => handleTabMouseDown(page)}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors flex-shrink-0 min-w-[64px] min-h-[60px] ${
                active ? "text-blue-600 border-t-2 border-blue-600" : "text-gray-400"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-blue-600" : "text-gray-400"}`} />
              <span className="whitespace-nowrap">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}