import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const TRADE_LINKS = [
  { slug: "hvac", name: "HVAC" },
  { slug: "electrical", name: "Electrical" },
  { slug: "plumbing", name: "Plumbing" },
  { slug: "roofing", name: "Roofing" },
  { slug: "remodeling", name: "Remodeling" },
];

export const COMPARE_PAGES = [
  { slug: "jobber", name: "Jobber" },
  { slug: "housecall-pro", name: "Housecall Pro" },
  { slug: "quickbooks", name: "QuickBooks" },
  { slug: "buildertrend", name: "Buildertrend" },
  { slug: "knowify", name: "Knowify" },
  { slug: "contractor-foreman", name: "Contractor Foreman" },
  { slug: "procore", name: "Procore" },
  { slug: "servicetitan", name: "ServiceTitan" },
];

export default function SiteFooter({ activeSlug }) {
  return (
    <footer className="border-t border-slate-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-0 justify-between text-sm text-slate-400 mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-500" />
            <span>Contractor Profitability Suite</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link to="/pricing" className="hover:text-slate-600 transition-colors">Pricing</Link>
            <Link to="/calculators" className="hover:text-slate-600 transition-colors">Free Calculators</Link>
            <Link to="/Resources" className="hover:text-slate-600 transition-colors">Blog</Link>
            <Link to="/compare" className="hover:text-slate-600 transition-colors">Compare</Link>
            <Link to="/PrivacyPolicy" className="hover:text-slate-600 transition-colors">Privacy</Link>
            <Link to="/Terms" className="hover:text-slate-600 transition-colors">Terms</Link>
            <a href="mailto:support@contractorprofitabilitysuite.com" className="hover:text-slate-600 transition-colors">Contact</a>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-500">By trade:</span>
          {TRADE_LINKS.map((t) => (
            <Link key={t.slug} to={`/for/${t.slug}`} className="hover:text-slate-600 transition-colors">
              {t.name}
            </Link>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-500">Compare:</span>
          {COMPARE_PAGES.map((c) => (
            <Link
              key={c.slug}
              to={`/compare/${c.slug}`}
              className={`hover:text-slate-600 transition-colors ${c.slug === activeSlug ? "font-semibold text-slate-600" : ""}`}
            >
              vs {c.name}
            </Link>
          ))}
        </div>

        <div className="text-center text-xs text-slate-400 mt-5">
          © 2026 Contractor Profitability Suite
        </div>
      </div>
    </footer>
  );
}