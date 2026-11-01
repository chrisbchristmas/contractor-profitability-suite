import { ArrowLeft } from "lucide-react";
import { useAppNavigation } from "@/hooks/useAppNavigation";

/**
 * Standardized back button component for all child/detail screens.
 * Uses the global useAppNavigation hook for consistent back-stack behavior.
 */
export default function BackButton({ fallbackPage = "Dashboard", label = "Back", className = "" }) {
  const { goBack } = useAppNavigation();

  return (
    <button
      onClick={() => goBack(fallbackPage)}
      className={`flex items-center gap-1 text-blue-600 font-medium text-sm min-w-[44px] min-h-[44px] -ml-1 ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}