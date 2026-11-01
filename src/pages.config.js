/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import { lazy } from 'react';
const AAppLanding = lazy(() => import('./pages/AAppLanding'));
const Billing = lazy(() => import('./pages/Billing'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const CalculatorHub = lazy(() => import('./pages/CalculatorHub'));
const CostPresets = lazy(() => import('./pages/CostPresets'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Estimates = lazy(() => import('./pages/Estimates'));
const Invoices = lazy(() => import('./pages/Invoices'));
const JobDetail = lazy(() => import('./pages/JobDetail'));
const Jobs = lazy(() => import('./pages/Jobs'));
const MarketingInsights = lazy(() => import('./pages/MarketingInsights'));
const ProfitAlerts = lazy(() => import('./pages/ProfitAlerts'));
const ProfitCalculators = lazy(() => import('./pages/ProfitCalculators'));
const Resources = lazy(() => import('./pages/Resources'));
const Settings = lazy(() => import('./pages/Settings'));
const Templates = lazy(() => import('./pages/Templates'));
const TimeTracking = lazy(() => import('./pages/TimeTracking'));
import __Layout from './Layout.jsx';


export const PAGES = {
    "AAppLanding": AAppLanding,
    "Billing": Billing,
    "BlogPost": BlogPost,
    "CalculatorHub": CalculatorHub,
    "CostPresets": CostPresets,
    "Dashboard": Dashboard,
    "Estimates": Estimates,
    "Invoices": Invoices,
    "JobDetail": JobDetail,
    "Jobs": Jobs,
    "MarketingInsights": MarketingInsights,
    "ProfitAlerts": ProfitAlerts,
    "ProfitCalculators": ProfitCalculators,
    "Resources": Resources,
    "Settings": Settings,
    "Templates": Templates,
    "TimeTracking": TimeTracking,
}

export const pagesConfig = {
    mainPage: "AAppLanding",
    Pages: PAGES,
    Layout: __Layout,
};