import React from "react";
import { Mail, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function Contact() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-100 sticky top-0 z-30 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">Contractor Pro</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-xl w-full text-center">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-6">
            <Mail className="h-7 w-7 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Contact Us</h1>
          <p className="text-slate-600 leading-relaxed mb-8">
            Have a question about Contractor Profitability Suite, your account, billing, or need a hand getting set up?
            We're here to help. Send us an email and our support team will get back to you as soon as possible.
          </p>
          <a
            href="mailto:support@contractorprofitabilitysuite.app"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <Mail className="h-4 w-4" />
            support@contractorprofitabilitysuite.app
          </a>
        </div>
      </main>
    </div>
  );
}