export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001f3f] to-[#003366] py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="glass-panel p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Privacy Policy</h1>
          
          <div className="space-y-6 text-white/80">
            <section>
              <h2 className="text-xl font-semibold text-[#9DC400] mb-4">1. Information We Collect</h2>
              <p className="leading-relaxed mb-4">
                Skyship Logistics collects information necessary to provide our logistics services:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Contact information (name, email, phone, address)</li>
                <li>Shipment details and tracking numbers</li>
                <li>Payment and billing information</li>
                <li>Business information for corporate accounts</li>
                <li>Usage data and analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#9DC400] mb-4">2. How We Use Your Information</h2>
              <p className="leading-relaxed mb-4">
                We use your information to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process and track your shipments</li>
                <li>Communicate shipping updates and notifications</li>
                <li>Provide customer support</li>
                <li>Improve our services and user experience</li>
                <li>Comply with legal and regulatory requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#9DC400] mb-4">3. Data Security</h2>
              <p className="leading-relaxed">
                We implement industry-standard security measures to protect your data including 
                encryption, secure servers, and access controls. Your tracking information 
                is protected and only accessible to authorized personnel and you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#9DC400] mb-4">4. Data Sharing</h2>
              <p className="leading-relaxed">
                We only share your information with:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Shipping carriers and logistics partners (necessary for delivery)</li>
                <li>Service providers who assist our operations</li>
                <li>Legal authorities when required by law</li>
              </ul>
              <p className="leading-relaxed mt-4">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#9DC400] mb-4">5. Cookies and Tracking</h2>
              <p className="leading-relaxed">
                We use cookies and similar technologies to enhance your experience, remember 
                your preferences, and analyze website traffic. You can control cookie settings 
                through your browser preferences.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#9DC400] mb-4">6. Your Rights</h2>
              <p className="leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#9DC400] mb-4">7. Contact Us</h2>
              <p className="leading-relaxed">
                For privacy-related questions or requests, contact our Data Protection Officer:
                <br />
                Email: privacy@skydexlogistics.com
                <br />
                Phone: +447352998900
                <br />
                Address: GOLDEN CROSS HOUSE, 456-458 STRAND
              </p>
            </section>

            <p className="text-sm text-white/60 mt-8">
              Last updated: January 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
