'use client'

import { Building2, CheckSquare, Lightbulb, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DashboardEmptyState() {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#9caf88]/20 to-[#d4836f]/20 border border-[#9caf88]/30 mb-6">
            <Sparkles className="w-4 h-4 text-[#d4836f]" />
            <span className="text-sm font-medium text-[#1e3a5f]">Welcome to CityWise AI</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-[#1e3a5f] mb-4">
            Ready to build something great?
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Let's get started on your first project. Scout will guide you through everything you need to know about permits, zoning, and requirements.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Create Project Card */}
          <button
            onClick={() => router.push('/ai-scope')}
            className="group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-[#d4836f] to-[#c86f4d]"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">
                Create Your First Project
              </h3>
              
              <p className="text-white/90 text-sm">
                Scout will ask a few questions about your property and project scope to get started.
              </p>
              
              <div className="mt-6 inline-flex items-center text-sm font-medium text-white">
                Get Started
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* How It Works Card */}
          <div className="group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br from-[#9caf88] to-[#8a9d78] cursor-pointer">
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                <CheckSquare className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">
                See How It Works
              </h3>
              
              <p className="text-white/90 text-sm">
                Learn how CityWise helps you navigate permits, zoning rules, and engineering requirements.
              </p>
              
              <div className="mt-6 inline-flex items-center text-sm font-medium text-white">
                Learn More
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Explore Features Card */}
          <div className="group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br from-[#1e3a5f] to-[#2c4f6f] cursor-pointer">
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">
                Explore Features
              </h3>
              
              <p className="text-white/90 text-sm">
                Discover zoning analysis, permit checklists, AI assistance, and interactive property maps.
              </p>
              
              <div className="mt-6 inline-flex items-center text-sm font-medium text-white">
                View Features
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Supporting Text */}
        <div className="max-w-xl mx-auto">
          <p className="text-sm text-gray-500">
            🏗️ Phoenix Metro Area • 🤖 AI-Powered • ⚡ 10x Faster Planning
          </p>
        </div>
      </div>
    </div>
  )
}
