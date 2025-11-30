import Link from 'next/link'
import { ArrowRight, Map, FileCheck, MessageSquare, LineChart, Users, Zap, Shield, Clock, CheckCircle } from 'lucide-react'
import CityWiseLogo from '@/components/CityWiseLogo'

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f3] via-[#faf8f3] to-[#9caf88]/10">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <CityWiseLogo theme="dark" width={160} />
          </Link>
          <Link 
            href="/login"
            className="px-6 py-2 text-[#1e3a5f] hover:text-[#2c4f6f] font-medium transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#9caf88]/20 to-[#d4836f]/20 border border-[#9caf88]/30 mb-6">
          <Zap className="w-4 h-4 text-[#d4836f]" />
          <span className="text-sm font-medium text-[#1e3a5f]">Features</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-[#1e3a5f] mb-6">
          Everything You Need to Navigate Permits
        </h1>
        
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          CityWise combines AI intelligence with local expertise to make preconstruction planning faster, 
          smarter, and more reliable.
        </p>
      </section>

      {/* Main Features Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Feature 1: AI-Powered Analysis */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#d4836f] to-[#c86f4d] flex items-center justify-center mb-6">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-[#1e3a5f] mb-3">AI-Powered Scope Capture</h3>
            <p className="text-gray-600 mb-4">
              Scout, our AI assistant, asks smart questions about your project to understand exactly what you're building. 
              No forms, no jargon—just a conversation that extracts all the details we need.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-[#9caf88] flex-shrink-0 mt-0.5" />
                <span>Conversational interface that adapts to your project type</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-[#9caf88] flex-shrink-0 mt-0.5" />
                <span>Automatically identifies engineering requirements</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-[#9caf88] flex-shrink-0 mt-0.5" />
                <span>Extracts structural, plumbing, HVAC, and electrical needs</span>
              </li>
            </ul>
          </div>

          {/* Feature 2: Property Analysis */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#9caf88] to-[#8a9d78] flex items-center justify-center mb-6">
              <Map className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-[#1e3a5f] mb-3">Interactive Property Visualization</h3>
            <p className="text-gray-600 mb-4">
              See your property boundaries, setbacks, and zoning requirements on an interactive map. 
              Understand what you can build and where before you start designing.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-[#9caf88] flex-shrink-0 mt-0.5" />
                <span>Real parcel data from Regrid for accurate boundaries</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-[#9caf88] flex-shrink-0 mt-0.5" />
                <span>Visual setback lines and buildable area calculations</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-[#9caf88] flex-shrink-0 mt-0.5" />
                <span>Zoning code details specific to your jurisdiction</span>
              </li>
            </ul>
          </div>

          {/* Feature 3: Engineering Requirements */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2c4f6f] flex items-center justify-center mb-6">
              <FileCheck className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-[#1e3a5f] mb-3">Smart Engineering Detection</h3>
            <p className="text-gray-600 mb-4">
              Based on your project scope, we automatically identify which engineering disciplines you need—
              structural, civil, MEP—and what documentation is required.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-[#9caf88] flex-shrink-0 mt-0.5" />
                <span>AI determines required vs. optional engineering</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-[#9caf88] flex-shrink-0 mt-0.5" />
                <span>Detailed notes on what each discipline covers</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-[#9caf88] flex-shrink-0 mt-0.5" />
                <span>Convert requirements into actionable tasks</span>
              </li>
            </ul>
          </div>

          {/* Feature 4: Project Dashboard */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#d4836f] to-[#c86f4d] flex items-center justify-center mb-6">
              <LineChart className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-[#1e3a5f] mb-3">Comprehensive Project Dashboard</h3>
            <p className="text-gray-600 mb-4">
              Keep everything organized in one place. Track tasks, add notes, view property details, 
              and chat with Scout whenever you have questions.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-[#9caf88] flex-shrink-0 mt-0.5" />
                <span>Task management with status tracking</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-[#9caf88] flex-shrink-0 mt-0.5" />
                <span>Project notes and documentation</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-[#9caf88] flex-shrink-0 mt-0.5" />
                <span>Context-aware AI assistant for project questions</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2c4f6f] rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Choose CityWise?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">10x Faster</h3>
              <p className="text-white/80 text-sm">
                What used to take days of research now takes minutes with AI-powered analysis
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Phoenix Metro Expert</h3>
              <p className="text-white/80 text-sm">
                Deep knowledge of Maricopa County jurisdictions and local requirements
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Built by Builders</h3>
              <p className="text-white/80 text-sm">
                Created by pros with 650+ projects who understand your pain points
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a5f] mb-4">
            Ready to Experience CityWise?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Start your first project and see how fast permit planning can be.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#d4836f] to-[#c86f4d] hover:from-[#c86f4d] hover:to-[#d4836f] text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white rounded-xl font-semibold transition-all duration-200"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-gray-600">
          <p>© 2024 CityWise. Simplifying preconstruction in Phoenix Metro.</p>
        </div>
      </footer>
    </div>
  )
}
