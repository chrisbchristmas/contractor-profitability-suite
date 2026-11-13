import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-10">Last updated: April 3, 2026</p>

      <div className="prose prose-slate max-w-none space-y-8 text-slate-700 text-sm leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">1. Introduction</h2>
          <p>
            Contractor Profitability Suite ("we," "our," or "us") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application and services. Please read this policy carefully. If you do not agree with its terms, please discontinue use of the app.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">2. Information We Collect</h2>
          <p>We may collect the following categories of information:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Account Information:</strong> Name, email address, and role when you register.</li>
            <li><strong>Business Data:</strong> Job records, change orders, estimates, invoices, time entries, and other data you enter into the app.</li>
            <li><strong>Payment Information:</strong> Billing details processed securely through Stripe. We do not store full card numbers on our servers.</li>
            <li><strong>Usage Data:</strong> Pages visited, features used, and interaction logs to improve the product.</li>
            <li><strong>Device & Technical Data:</strong> IP address, browser type, and operating system.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Provide, operate, and maintain the application.</li>
            <li>Process transactions and manage subscriptions.</li>
            <li>Send account-related communications (e.g., receipts, security alerts).</li>
            <li>Improve and personalize user experience.</li>
            <li>Comply with legal obligations.</li>
            <li>Detect and prevent fraud or abuse.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Sharing Your Information</h2>
          <p>We do not sell or rent your personal information. We may share data with:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Service Providers:</strong> Trusted third parties (e.g., Stripe for payments, cloud hosting providers) who assist us in operating the app under strict confidentiality agreements.</li>
            <li><strong>Legal Requirements:</strong> When required by law, regulation, or valid legal process.</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, with notice to you.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">5. AI and Third-Party Processors</h2>
          <p>
            To provide the Service we use third-party processors that handle data on our behalf: Stripe (payments), Supabase (database and hosting), SendGrid (transactional email), and Anthropic (AI-generated proposals and analysis). When you use AI features, the content you submit for that request (such as job details and proposal inputs) is sent to the AI provider to generate a response. We do not allow these processors to use your data to train their models under our agreements and settings, and we do not sell your personal information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">6. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us. We may retain certain data as required by law or for legitimate business purposes (e.g., resolving disputes, preventing fraud).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">7. Security</h2>
          <p>
            We implement industry-standard technical and organizational safeguards to protect your data, including encryption in transit (TLS) and at rest. However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security but are committed to protecting your information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">8. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Access the personal data we hold about you.</li>
            <li>Correct inaccurate or incomplete data.</li>
            <li>Request deletion of your data.</li>
            <li>Object to or restrict certain processing activities.</li>
            <li>Data portability (where applicable).</li>
          </ul>
                    <p className="mt-2"><strong>California (CCPA/CPRA):</strong> California residents have the right to know what personal information we collect, use, and disclose; to request deletion and correction; to opt out of the sale or sharing of personal information (we do not sell or share it for cross-context advertising); and to not be discriminated against for exercising these rights. <strong>EEA/UK (GDPR):</strong> where applicable, we process personal data on the legal bases of contract performance, legitimate interests, legal obligation, and consent, you may lodge a complaint with your local data protection authority, and your data may be transferred to and processed in the United States under appropriate safeguards. We respond to verified requests within 30 days (45 days under CCPA, extendable once).</p>
          <p className="mt-2">To exercise any of these rights, contact us at the email below.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">9. Cookies</h2>
          <p>
            We may use cookies and similar tracking technologies to enhance your experience, analyze usage, and remember preferences. You can control cookie settings through your browser. Disabling cookies may affect some app functionality.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">10. Third-Party Links</h2>
          <p>
            Our app may contain links to third-party websites. We are not responsible for the privacy practices or content of those sites and encourage you to review their privacy policies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">11. Children's Privacy</h2>
          <p>
            Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal data, we will delete it promptly.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">12. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy in the app and updating the "Last updated" date. Your continued use of the app after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">13. Contact Us</h2>
          <p>
            If you have questions or concerns about this Privacy Policy, please contact us at:
          </p>
          <div className="mt-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="font-medium text-slate-900">Contractor Profitability Suite</p>
            <p>Email: <a href="mailto:privacy@contractorprofitabilitysuite.com" className="text-blue-600 hover:underline">privacy@contractorprofitabilitysuite.com</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}