import React from "react";
import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import LaborBurdenCalc from "@/components/calculators/LaborBurdenCalc";
import SeoMeta from "@/components/seo/SeoMeta";

export default function LaborBurdenCalculatorPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SeoMeta title="Labor Burden Calculator | Free Tool" />
      <header className="border-b border-slate-100 sticky top-0 z-30 bg-white/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">Contractor Pro</span>
          </Link>
          <Link to="/calculators">
            <Button variant="ghost" size="sm" className="text-slate-600">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> All Calculators
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Labor Burden Calculator</h1>
        <p className="text-sm text-slate-500 mb-6">
          Calculate your true labor cost per hour including payroll taxes, workers' comp, benefits, and overhead — so you never underprice labor again.
        </p>
        <LaborBurdenCalc />
      </div>
    </div>
  );
}