import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

const STORAGE_KEY = "cookie_consent_dismissed";

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore storage failures (private mode)
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[60] px-4 pb-4 pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700 px-4 py-3 flex items-center gap-3 flex-col sm:flex-row sm:gap-4">
        <p className="text-xs sm:text-sm text-slate-200 flex-1 text-center sm:text-left">
          We use cookies to improve your experience. By using this site you agree to our use of cookies.{" "}
          <Link to="/PrivacyPolicy" className="text-blue-300 hover:underline">Privacy Policy</Link>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={dismiss}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss cookie banner"
            className="text-slate-400 hover:text-white p-1 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}