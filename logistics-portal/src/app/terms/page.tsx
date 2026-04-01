export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001f3f] to-[#003366] py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="glass-panel p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Terms & Conditions</h1>
          
          <div className="space-y-6 text-white/80">
            <section>
              <h2 className="text-xl font-semibold text-[#9DC400] mb-4">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing and using Skyship Logistics services, you agree to be bound by these Terms & Conditions. 
                If you do not agree with any part of these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#9DC400] mb-4">2. Service Description</h2>
              <p className="leading-relaxed">
                Skyship Logistics provides global logistics and supply chain solutions including air freight, 
                ocean freight, warehousing, and road transportation. We act as a facilitator between shippers 
                and carriers to ensure efficient delivery of goods.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#9DC400] mb-4">3. User Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and complete information for shipping</li>
                <li>Ensure all shipments comply with applicable laws and regulations</li>
                <li>Properly package and label all items for transport</li>
                <li>Pay all fees and charges as agreed upon</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#9DC400] mb-4">4. Liability Limitations</h2>
              <p className="leading-relaxed">
                Skyship Logistics liability is limited to the declared value of the shipment or the actual 
                loss, whichever is less. We are not liable for delays caused by circumstances beyond our 
                control including weather, customs, or carrier issues.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#9DC400] mb-4">5. Tracking and Updates</h2>
              <p className="leading-relaxed">
                We provide real-time tracking services. However, tracking information is dependent on 
                carrier updates and may not always reflect real-time status. We strive to provide 
                accurate information but cannot guarantee 100% accuracy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#9DC400] mb-4">6. Modifications</h2>
              <p className="leading-relaxed">
                Skyship Logistics reserves the right to modify these terms at any time. Continued use 
                of our services after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#9DC400] mb-4">7. Contact Information</h2>
              <p className="leading-relaxed">
                For questions about these Terms & Conditions, please contact us at:
                <br />
                Email: legal@skydexlogistics.com
                <br />
                Phone: +447352998900
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
