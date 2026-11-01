import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Contact from './pages/Contact';
import FreeCalculator from './pages/FreeCalculator';
import { Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { CustomerAuthProvider } from '@/lib/CustomerAuthContext';
import CustomerLogin from './pages/CustomerLogin';
import Register from './pages/Register';
import Proposals from './pages/Proposals';
import ApproveChangeOrder from './pages/ApproveChangeOrder';
import JobCostingCalculator from './pages/JobCostingCalculator';
import BreakEvenAnalysis from './pages/BreakEvenAnalysis';
import PortfolioView from './pages/PortfolioView';
import Warranties from './pages/Warranties';
import ShareJobSummary from './pages/ShareJobSummary';
import CalculatorsHub from './pages/CalculatorsHub';
import PricingModelAnalyserPage from './pages/PricingModelAnalyserPage';
import LaborBurdenCalculatorPage from './pages/LaborBurdenCalculatorPage';
import FreeJobCostingCalculator from './pages/FreeJobCostingCalculator';
import JobPipeline from './pages/JobPipeline';
import JobTemplates from './pages/JobTemplates';
import Tasks from './pages/Tasks';
import WipReport from './pages/WipReport';
import QuickCO from './pages/QuickCO';
import Pricing from './pages/Pricing';
import CompareJobber from './pages/CompareJobber';
import CompareHousecallPro from './pages/CompareHousecallPro';
import CompareQuickBooks from './pages/CompareQuickBooks';
import CompareBuildertrend from './pages/CompareBuildertrend';
import CompareKnowify from './pages/CompareKnowify';
import CompareContractorForeman from './pages/CompareContractorForeman';
import CompareProcore from './pages/CompareProcore';
import CompareServiceTitan from './pages/CompareServiceTitan';
import CompareHub from './pages/CompareHub';
import ForHvac from './pages/ForHvac';
import ForElectrical from './pages/ForElectrical';
import ForPlumbing from './pages/ForPlumbing';
import ForRoofing from './pages/ForRoofing';
import ForRemodeling from './pages/ForRemodeling';
import CookieConsentBanner from './components/CookieConsentBanner';

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    // For auth_required and other errors, still render the app
    // Public pages will work, protected pages will redirect via SubscriptionGate
  }

  // Render the main app
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        } />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            }
          />
        ))}
        <Route path="/PrivacyPolicy" element={<LayoutWrapper currentPageName="PrivacyPolicy"><PrivacyPolicy /></LayoutWrapper>} />
        <Route path="/Terms" element={<LayoutWrapper currentPageName="TermsOfService"><TermsOfService /></LayoutWrapper>} />
        <Route path="/TermsOfService" element={<LayoutWrapper currentPageName="TermsOfService"><TermsOfService /></LayoutWrapper>} />
        <Route path="/Contact" element={<LayoutWrapper currentPageName="Contact"><Contact /></LayoutWrapper>} />
        <Route path="/free-change-order-calculator" element={<FreeCalculator />} />
        <Route path="/free-job-costing-calculator" element={<FreeJobCostingCalculator />} />
        <Route path="/CalculatorHub" element={<Navigate to="/free-change-order-calculator" replace />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/compare/jobber" element={<CompareJobber />} />
        <Route path="/compare/housecall-pro" element={<CompareHousecallPro />} />
        <Route path="/compare/quickbooks" element={<CompareQuickBooks />} />
        <Route path="/compare/buildertrend" element={<CompareBuildertrend />} />
        <Route path="/compare/knowify" element={<CompareKnowify />} />
        <Route path="/compare/contractor-foreman" element={<CompareContractorForeman />} />
        <Route path="/compare/procore" element={<CompareProcore />} />
        <Route path="/compare/servicetitan" element={<CompareServiceTitan />} />
        <Route path="/compare" element={<CompareHub />} />
        <Route path="/for/hvac" element={<ForHvac />} />
        <Route path="/for/electrical" element={<ForElectrical />} />
        <Route path="/for/plumbing" element={<ForPlumbing />} />
        <Route path="/for/roofing" element={<ForRoofing />} />
        <Route path="/for/remodeling" element={<ForRemodeling />} />
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/Proposals" element={<LayoutWrapper currentPageName="Proposals"><Proposals /></LayoutWrapper>} />
        <Route path="/ApproveChangeOrder" element={<ApproveChangeOrder />} />
        <Route path="/calculators" element={<CalculatorsHub />} />
        <Route path="/calculators/job-costing-calculator" element={<JobCostingCalculator />} />
        <Route path="/calculators/pricing-model-analyser" element={<PricingModelAnalyserPage />} />
        <Route path="/calculators/labor-burden-calculator" element={<LaborBurdenCalculatorPage />} />
        <Route path="/BreakEvenAnalysis" element={<LayoutWrapper currentPageName="BreakEvenAnalysis"><BreakEvenAnalysis /></LayoutWrapper>} />
        <Route path="/PortfolioView" element={<LayoutWrapper currentPageName="PortfolioView"><PortfolioView /></LayoutWrapper>} />
        <Route path="/Warranties" element={<LayoutWrapper currentPageName="Warranties"><Warranties /></LayoutWrapper>} />
        <Route path="/share/:token" element={<ShareJobSummary />} />
        <Route path="/job-pipeline" element={<LayoutWrapper currentPageName="JobPipeline"><JobPipeline /></LayoutWrapper>} />
        <Route path="/job-templates" element={<LayoutWrapper currentPageName="JobTemplates"><JobTemplates /></LayoutWrapper>} />
        <Route path="/tasks" element={<LayoutWrapper currentPageName="Tasks"><Tasks /></LayoutWrapper>} />
        <Route path="/wip-report" element={<LayoutWrapper currentPageName="WipReport"><WipReport /></LayoutWrapper>} />
        <Route path="/quick-co" element={<LayoutWrapper currentPageName="QuickCO"><QuickCO /></LayoutWrapper>} />
        <Route path="/COTemplates" element={<LayoutWrapper currentPageName="COTemplates"><Pages.Templates /></LayoutWrapper>} />
        {/* PascalCase aliases for kebab-case routes */}
        <Route path="/JobPipeline" element={<LayoutWrapper currentPageName="JobPipeline"><JobPipeline /></LayoutWrapper>} />
        <Route path="/JobTemplates" element={<LayoutWrapper currentPageName="JobTemplates"><JobTemplates /></LayoutWrapper>} />
        <Route path="/WipReport" element={<LayoutWrapper currentPageName="WipReport"><WipReport /></LayoutWrapper>} />
        <Route path="/QuickCO" element={<LayoutWrapper currentPageName="QuickCO"><QuickCO /></LayoutWrapper>} />
        <Route path="/Tasks" element={<LayoutWrapper currentPageName="Tasks"><Tasks /></LayoutWrapper>} />
        <Route path="/invoices" element={<Navigate to="/Invoices" replace />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <CustomerAuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
            <CookieConsentBanner />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </CustomerAuthProvider>
    </AuthProvider>
  )
}

export default App