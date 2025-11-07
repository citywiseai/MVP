import Link from 'next/link';
import { auth } from '@/lib/auth';
import CityWiseLogo from '@/components/CityWiseLogo';

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2c4f6f] to-[#9caf88]">
      <nav className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <CityWiseLogo theme="light" width={160} />
          {session?.user && (
            <Link
              href="/dashboard"
              className="px-6 py-2 bg-white text-[#1e3a5f] rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Dashboard
            </Link>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Build Faster.
            <br />
            <span className="text-[#9caf88]">Permit Smarter.</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto">
            AI-powered permit planning for residential projects
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href={session?.user ? "/dashboard" : "/signup"}
              className="px-8 py-4 bg-[#d4836f] text-white rounded-lg font-semibold text-lg hover:bg-[#c86f4d] transition-all shadow-lg hover:shadow-xl"
            >
              {session?.user ? "Go to Dashboard" : "Get Started"}
            </Link>
            {!session?.user && (
              <Link
                href="/login"
                className="px-8 py-4 bg-[#1e3a5f] text-white rounded-lg font-semibold text-lg hover:bg-[#2c4f6f] transition-all shadow-lg hover:shadow-xl"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all flex flex-col">
            <div className="w-14 h-14 bg-[#9caf88] rounded-xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 h-14 flex items-center">Zoning Analysis</h3>
            <p className="text-white/80">
              Automatic setback calculations, height limits, and building requirements for your property
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all flex flex-col">
            <div className="w-14 h-14 bg-[#d4836f] rounded-xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 h-14 flex items-center">Engineering Needs</h3>
            <p className="text-white/80">
              AI-generated structural, MEP, and civil engineering requirements based on your project scope
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all flex flex-col">
            <div className="w-14 h-14 bg-[#1e3a5f] rounded-xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 h-14 flex items-center">Permit Preparation</h3>
            <p className="text-white/80">
              Track requirements, manage tasks, and stay organized throughout the approval process
            </p>
          </div>
        </div>

        <div className="mt-24 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-12">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-white mb-2">10x</div>
                <div className="text-white/80">Faster Planning</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">90%</div>
                <div className="text-white/80">Time Saved</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">AI-Powered</div>
                <div className="text-white/80">Smart Analysis</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to streamline your next project?
          </h2>
          <p className="text-white/80 mb-8">
            Join builders and developers using CityWise AI
          </p>
          <Link
            href={session?.user ? "/dashboard" : "/signup"}
            className="inline-block px-8 py-4 bg-[#d4836f] text-white rounded-lg font-semibold text-lg hover:bg-[#c86f4d] transition-all shadow-lg hover:shadow-xl"
          >
            {session?.user ? "Go to Dashboard" : "Start Your Project"}
          </Link>
        </div>
      </div>

      <footer className="border-t border-white/20 mt-20">
        <div className="container mx-auto px-6 py-8 text-center text-white/60">
          <p>© 2024 CityWise AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
