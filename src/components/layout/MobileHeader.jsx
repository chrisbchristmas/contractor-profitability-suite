import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CreditCard } from "lucide-react";
import BackButton from "@/components/layout/BackButton";
import NotificationBell from "@/components/notifications/NotificationBell";

const DETAIL_PAGES = ["JobDetail", "BlogPost", "Resources", "CalculatorHub", "Settings", "ProfitCalculators"];

const PAGE_LABELS = {
  JobDetail: "Job Details",
  BlogPost: "Article",
  Resources: "Resources",
  CalculatorHub: "Calculators",
  ProfitCalculators: "Calculators",
  Settings: "Settings",
};

export default function MobileHeader({ currentPageName }) {
  const isDetail = DETAIL_PAGES.includes(currentPageName);

  return (
    <header className="lg:hidden bg-white border-b px-4 flex items-center gap-3 flex-shrink-0 h-14" style={{ paddingTop: "var(--safe-top)" }}>
      {isDetail ? (
        <div className="flex items-center gap-2 w-full">
          <BackButton />
          <span className="font-semibold text-gray-900 text-sm flex-1 text-center">
            {PAGE_LABELS[currentPageName] || currentPageName}
          </span>
          <NotificationBell />
        </div>
      ) : (
        <>
          <div className="w-6 h-6 rounded-md bg-blue-700 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">CO</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm flex-1">Change Order Tracker</span>
          <NotificationBell />
          <Link
            to={createPageUrl("Billing")}
            className="text-blue-600 flex items-center justify-center min-w-[44px] min-h-[44px]"
            aria-label="Billing"
          >
            <CreditCard className="w-4 h-4" />
          </Link>
        </>
      )}
    </header>
  );
}