import Link from 'next/link'
import { ArrowRight, MessageSquare, Map, CheckCircle, Lightbulb, FileText, Users } from 'lucide-react'
import CityWiseLogo from '@/components/CityWiseLogo'

export default function HowItWorksPage() {
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
          <Lightbulb className="w-4 h-4 text-[#d4836f]" />
          <span className="text-sm font-medium text-[#1e3a5f]">How CityWise Works</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-[#1e3a5f] mb-6">
          Your AI-Powered Guide to Permits & Zoning
        </h1>
        
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          CityWise simplifies the preconstruction process for residential projects in Phoenix Metro. 
          Here's how we help you navigate permits, zoning rules, and engineering requirements.
        </p>
      </section>

      {/* Process Steps */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="space-y-12">
          
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/2 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4836f] to-[#c86f4d] flex items-center justify-center text-white font-bold text-xl">
                  1
                </div>
                <h2 className="text-2xl font-bold text-[#1e3a5f]">Tell Scout About Your Project</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Our AI assistant Scout asks a few simple questions about your property address, project type, 
                and scope of work. Just have a conversation—no complex forms or jargon required.
              </p>
            </div>
            <div className="md:w-1/2 bg-gradient-to-br from-[#d4836f]/10 to-[#c86f4d]/10 rounded-2xl p-12 flex items-center justify-center">
              <MessageSquare className="w-32 h-32 text-[#d4836f]" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
            <div className="md:w-1/2 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9caf88] to-[#8a9d78] flex items-center justify-center text-white font-bold text-xl">
                  2
                </div>
                <h2 className="text-2xl font-bold text-[#1e3a5f]">We Analyze Your Property</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                CityWise pulls parcel data, zoning codes, and jurisdiction requirements for your specific location. 
                We show you setbacks, building envelopes, and what you can actually build on your lot.
              </p>
            </div>
            <div className="md:w-1/2 bg-gradient-to-br from-[#9caf88]/10 to-[#8a9d78]/10 rounded-2xl p-12 flex items-center justify-center">
              <Map className="w-32 h-32 text-[#9caf88]" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/2 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2c4f6f] flex items-center justify-center text-white font-bold text-xl">
                  3
                </div>
                <h2 className="text-2xl font-bold text-[#1e3a5f]">Get Your Requirements</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Based on your project, we identify exactly what engineering disciplines you need—structural, 
                civil, MEP—and provide clear guidance on permit documentation and next steps.
              </p>
            </div>
            <div className="md:w-1/2 bg-gradient-to-br from-[#1e3a5f]/10 to-[#2c4f6f]/10 rounded-2xl p-12 flex items-center justify-center">
              <CheckCircle className="w-32 h-32 text-[#1e3a5f]" />
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
            <div className="md:w-1/2 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4836f] to-[#c86f4d] flex items-center justify-center text-white font-bold text-xl">
                  4
                </div>
                <h2 className="text-2xl font-bold text-[#1e3a5f]">Track & Manage Your Project</h2>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Use your project dashboard to track tasks, add notes, chat with Scout for questions, 
                and keep all your permit planning organized in one place.
              </p>
            </div>
            <div className="md:w-1/2 bg-gradient-to-br from-[#d4836f]/10 to-[#c86f4d]/10 rounded-2xl p-12 flex items-center justify-center">
              <FileText className="w-32 h-32 text-[#d4836f]" />
            </div>
          </div>

        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-3xl font-bold text-[#1e3a5f] text-center mb-12">
          What Makes CityWise Different
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-[#9caf88]/20 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-[#9caf88]" />
            </div>
            <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">AI-Powered Guidance</h3>
            <p className="text-sm text-gray-600">
              Scout uses AI to understand your project and provide personalized recommendations based on local requirements.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-[#d4836f]/20 flex items-center justify-center mb-4">
              <Map className="w-6 h-6 text-[#d4836f]" />
            </div>
            <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">Phoenix Metro Focus</h3>
            <p className="text-sm text-gray-600">
              Deep knowledge of Maricopa County jurisdictions—Phoenix, Scottsdale, Tempe, Mesa, Chandler, and more.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-[#1e3a5f]/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-[#1e3a5f]" />
            </div>
            <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">Built by Builders</h3>
            <p className="text-sm text-gray-600">
              Created by construction pros who've done 650+ projects and know the pain points firsthand.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2c4f6f] rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Project?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join homeowners, builders, and developers who are using CityWise to navigate permits faster and smarter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#d4836f] hover:bg-[#c86f4d] text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold transition-all duration-200 border border-white/20"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-gray-600">
          <p>© 2024 CityWise AI. Simplifying preconstruction in Phoenix Metro.</p>
        </div>
      </footer>
    </div>
  )
}
