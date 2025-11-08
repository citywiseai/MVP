import Link from 'next/link'
import CityWiseLogo from '@/components/CityWiseLogo'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#1e3a5f] via-[#2c4f6f] to-[#1e3a5f] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <CityWiseLogo theme="light" width={160} />
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="px-6 py-2 text-white hover:text-white/80 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2.5 bg-[#d4836f] hover:bg-[#c86f4d] text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#1e3a5f] via-[#2c4f6f] to-[#1e3a5f]">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
            Build Faster.
            <br />
            <span className="text-[#9caf88]">Permit Smarter.</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto">
            AI-powered permit planning for residential projects
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#d4836f] hover:bg-[#c86f4d] text-white text-lg font-semibold rounded-xl transition-all duration-200 shadow-xl hover:shadow-2xl"
            >
              Get Started
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-lg font-semibold rounded-xl transition-all duration-200 border border-white/20"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#faf8f3]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#9caf88]/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-[#9caf88]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#1e3a5f] mb-3">Zoning Analysis</h3>
              <p className="text-gray-600">
                Automatic setback calculations, height limits, and building requirements for your property
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#d4836f]/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-[#d4836f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#1e3a5f] mb-3">Engineering Needs</h3>
              <p className="text-gray-600">
                AI-generated structural, MEP, and civil engineering requirements based on your project scope
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-[#1e3a5f]/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-[#1e3a5f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#1e3a5f] mb-3">Permit Preparation</h3>
              <p className="text-gray-600">
                Track requirements, manage tasks, and stay organized throughout the approval process
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#1e3a5f]/5 to-[#9caf88]/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-[#1e3a5f] mb-2">10x</div>
              <div className="text-gray-600 font-medium">Faster Planning</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-[#1e3a5f] mb-2">90%</div>
              <div className="text-gray-600 font-medium">Time Saved</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-[#1e3a5f] mb-2">AI-Powered</div>
              <div className="text-gray-600 font-medium">Smart Analysis</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#1e3a5f] via-[#2c4f6f] to-[#1e3a5f]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to streamline your next project?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join builders and homeowners who are navigating permits faster with CityWise AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#d4836f] hover:bg-[#c86f4d] text-white text-lg font-semibold rounded-xl transition-all duration-200 shadow-xl hover:shadow-2xl"
            >
              Get Started Free
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-lg font-semibold rounded-xl transition-all duration-200 border border-white/20"
            >
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-[#1e3a5f] border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white/60 text-sm">
            🏗️ Phoenix Metro Area • 🤖 AI-Powered • ⚡ 10x Faster Planning
          </p>
          <p className="text-white/40 text-xs mt-2">
            © 2024 CityWise AI. Simplifying preconstruction in Phoenix Metro.
          </p>
        </div>
      </footer>
    </div>
  )
}
