import Link from 'next/link'
import CityWiseLogo from '@/components/CityWiseLogo'

export default function Home() {
  return (
    <div className="min-h-screen bg-citywise-bg">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-citywise-surface/95 backdrop-blur-md border-b border-citywise-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <CityWiseLogo theme="light" width={160} />
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="px-6 py-2 text-citywise-text hover:text-citywise-orange font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2.5 bg-citywise-orange hover:bg-citywise-orange/90 text-citywise-bg rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:glow-orange"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-citywise-bg via-citywise-surface to-citywise-bg opacity-60" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-citywise-orange/10 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-citywise-gold/10 rounded-full filter blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center animate-fade-in">
          <div className="inline-block px-4 py-2 bg-citywise-surface border border-citywise-orange/30 rounded-full mb-6">
            <span className="text-citywise-orange font-semibold text-sm tracking-wide">
              PRECONSTRUCTION MADE SIMPLE
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-citywise-text mb-6 leading-tight">
            Build Faster.
            <br />
            <span className="text-gradient">Permit Smarter.</span>
          </h1>

          <p className="text-xl md:text-2xl text-citywise-text-muted mb-10 max-w-3xl mx-auto leading-relaxed">
            AI-powered permit planning for residential projects. Navigate zoning, engineering, and compliance with confidence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-citywise-orange hover:bg-citywise-orange/90 text-citywise-bg text-lg font-semibold rounded-xl transition-all duration-200 shadow-xl hover:shadow-2xl hover:glow-orange hover:scale-105"
            >
              Get Started Free
              <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center px-8 py-4 bg-citywise-surface hover:bg-citywise-border text-citywise-text text-lg font-semibold rounded-xl transition-all duration-200 border border-citywise-border hover:border-citywise-orange"
            >
              See How It Works
              <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-citywise-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-citywise-text mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-citywise-text-muted max-w-2xl mx-auto">
              Streamline your preconstruction workflow with intelligent automation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-citywise-surface/80 backdrop-blur-sm rounded-2xl p-8 border border-citywise-border hover:border-citywise-orange transition-all duration-300 hover:scale-105 hover:shadow-xl group">
              <div className="w-16 h-16 bg-citywise-orange/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-citywise-orange/30 transition-colors">
                <svg className="w-8 h-8 text-citywise-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-citywise-text mb-3">Zoning Analysis</h3>
              <p className="text-citywise-text-muted">
                Automatic setback calculations, height limits, and building requirements for your property
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-citywise-surface/80 backdrop-blur-sm rounded-2xl p-8 border border-citywise-border hover:border-citywise-gold transition-all duration-300 hover:scale-105 hover:shadow-xl group">
              <div className="w-16 h-16 bg-citywise-gold/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-citywise-gold/30 transition-colors">
                <svg className="w-8 h-8 text-citywise-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-citywise-text mb-3">Smart Requirements</h3>
              <p className="text-citywise-text-muted">
                AI-generated structural, MEP, and civil engineering requirements based on your project scope
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-citywise-surface/80 backdrop-blur-sm rounded-2xl p-8 border border-citywise-border hover:border-citywise-orange transition-all duration-300 hover:scale-105 hover:shadow-xl group">
              <div className="w-16 h-16 bg-citywise-orange/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-citywise-orange/30 transition-colors">
                <svg className="w-8 h-8 text-citywise-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-citywise-text mb-3">Permit Tracking</h3>
              <p className="text-citywise-text-muted">
                Track requirements, manage tasks, and stay organized throughout the approval process
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-citywise-bg">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="animate-slide-up">
              <div className="text-5xl font-bold text-citywise-orange mb-2">10x</div>
              <div className="text-citywise-text-muted font-medium">Faster Planning</div>
            </div>
            <div className="animate-slide-up delay-100">
              <div className="text-5xl font-bold text-citywise-gold mb-2">90%</div>
              <div className="text-citywise-text-muted font-medium">Time Saved</div>
            </div>
            <div className="animate-slide-up delay-200">
              <div className="text-5xl font-bold text-gradient mb-2">AI-Powered</div>
              <div className="text-citywise-text-muted font-medium">Smart Analysis</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-citywise-surface to-citywise-bg relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-citywise-orange rounded-full filter blur-3xl animate-pulse" />
          </div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-citywise-text mb-6">
            Ready to streamline your next project?
          </h2>
          <p className="text-xl text-citywise-text-muted mb-8 max-w-2xl mx-auto">
            Join builders and homeowners who are navigating permits faster with CityWise
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-citywise-orange hover:bg-citywise-orange/90 text-citywise-bg text-lg font-semibold rounded-xl transition-all duration-200 shadow-xl hover:shadow-2xl hover:glow-orange hover:scale-105"
            >
              Start Building Faster
            </Link>
            <Link
              href="/features"
              className="inline-flex items-center justify-center px-8 py-4 bg-citywise-surface hover:bg-citywise-border text-citywise-text text-lg font-semibold rounded-xl transition-all duration-200 border border-citywise-border hover:border-citywise-gold"
            >
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-citywise-surface border-t border-citywise-border">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-citywise-text-muted text-sm flex items-center justify-center gap-3 flex-wrap">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-citywise-orange" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Phoenix Metro Area
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-citywise-gold" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
              </svg>
              Smart Automation
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-citywise-orange" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              10x Faster Planning
            </span>
          </p>
          <p className="text-citywise-text-muted/60 text-xs mt-3">
            © 2024 CityWise. Simplifying preconstruction in Phoenix Metro.
          </p>
        </div>
      </footer>
    </div>
  )
}
