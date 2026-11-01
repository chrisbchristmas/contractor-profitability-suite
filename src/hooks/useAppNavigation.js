import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * Global navigation hook that provides standardized navigation helpers
 * and a consistent back-navigation method across the app.
 */
export function useAppNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = (fallbackPage = "Dashboard") => {
    // If there's a history entry to go back to, use it
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(createPageUrl(fallbackPage), { replace: true });
    }
  };

  const goTo = (page, params = {}) => {
    navigate(createPageUrl(page, params));
  };

  return { goBack, goTo, location };
}