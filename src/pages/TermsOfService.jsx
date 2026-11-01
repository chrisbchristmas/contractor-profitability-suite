import React from "react";
import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-slate-500 mb-10">Last updated: August 16, 2026</p>

      <div className="prose prose-slate max-w-none space-y-8 text-slate-700 text-sm leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Contractor Profitability Suite application ("Service," "we," "our," or "us"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service. Your use of the Service constitutes your acceptance of these Terms and our Privacy Policy, available at{" "}
            <Link to="/PrivacyPolicy" className="text-blue-600 hover:underline">/PrivacyPolicy</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">2. Description of Service</h2>
          <p>
            Contractor Profitability Suite is a cloud-based software-as-a-service (SaaS) application designed for construction contractors. The Service provides tools for job costing, change order pricing and tracking, margin and profit-leakage analysis, time tracking, invoicing, and related project financial management. The Service includes calculators and reporting intended to assist contractors in estimating costs and pricing their work, but does not provide legal, accounting, or financial advice.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">3. Subscription Billing</h2>
          <p>
            We offer paid subscription plans starting at $19.00 per month. Plan pricing and features are displayed on our pricing page. By subscribing, you authorize us to charge your payment method through our payment processor, Stripe, on a recurring monthly basis until you cancel.
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Auto-renewal:</strong> Subscriptions automatically renew at the end of each billing cycle unless canceled before the renewal date.</li>
            <li><strong>Cancellation:</strong> You may cancel your subscription at any time from your account settings or by contacting support. Cancellation stops future billing cycles but does not refund the current paid period.</li>
            <li><strong>Price changes:</strong> We may change subscription fees with reasonable advance notice. Any price change takes effect at the start of your next billing cycle following the notice.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Refund Policy</h2>
          <p>
            Subscription fees are non-refundable. If you cancel your subscription, you will continue to have access to the Service through the end of your current paid billing period, but no refunds are issued for partial billing periods. You may cancel at any time to prevent future charges. New accounts that include a free trial are not charged until the trial period ends.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">5. User Responsibilities and Acceptable Use</h2>
          <p>You agree that you will:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Provide accurate and complete information when registering your account.</li>
            <li>Maintain the confidentiality of your account credentials and be responsible for all activity under your account.</li>
            <li>Use the Service only for lawful business purposes and in compliance with all applicable laws.</li>
            <li>Not misuse the Service, including attempting to access data you are not authorized to access, interfere with the Service's security, or introduce malicious code.</li>
            <li>Be solely responsible for the accuracy of the data you enter and the business decisions you make based on the Service's calculations and reports.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">6. Limitation of Liability</h2>
          <p>
            The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or that calculations or reports will meet your specific business requirements.
          </p>
          <p className="mt-2">
            To the maximum extent permitted by law, Contractor Profitability Suite and its affiliates, officers, employees, and licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, business, data, or revenue, arising out of or related to your use of, or inability to use, the Service. The Service is a business tool that assists with estimating and analysis; you remain solely responsible for your pricing, contracts, and business decisions. Our total liability for any claim arising out of or related to the Service shall not exceed the amount you paid to us in the twelve (12) months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">7. Account Termination</h2>
          <p>
            You may terminate your account at any time by canceling your subscription and discontinuing use of the Service. We reserve the right to suspend or terminate your account if you breach these Terms, fail to pay subscription fees, or engage in conduct that we determine, in our sole discretion, harms us, other users, or the Service. Upon termination, your right to access the Service and your stored data ceases, subject to any data-retention obligations under our Privacy Policy or applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">8. Intellectual Property</h2>
          <p>
            The Service, including its software, design, text, and features, is owned by Contractor Profitability Suite and protected by applicable intellectual-property laws. You retain ownership of the business data you submit to the Service, and you grant us a limited license to host, process, and display that data solely as necessary to provide the Service to you.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">9. Governing Law</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict-of-laws principles. You and we submit to the exclusive jurisdiction of the state and federal courts located in Delaware for any dispute arising out of or related to these Terms or the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">10. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. We will post the revised Terms in the app and update the "Last updated" date. Your continued use of the Service after changes are posted constitutes your acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">11. Contact Us</h2>
          <p>
            If you have questions or concerns about these Terms, please contact us at:
          </p>
          <div className="mt-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="font-medium text-slate-900">Contractor Profitability Suite</p>
            <p>Email: <a href="mailto:legal@contractorprofitabilitysuite.app" className="text-blue-600 hover:underline">legal@contractorprofitabilitysuite.app</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}