import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold text-gray-900 text-center mb-4">
          CityWise AI
        </h1>
        <p className="text-2xl text-gray-700 text-center mb-12">
          Smart Property Development & Permit Planning
        </p>
        
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-lg text-gray-700 mb-6">
            Streamline your development projects with AI-powered zoning analysis, engineering requirements, and permit preparation.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl mb-2">🏗️</div>
            <h3 className="font-semibold mb-2">Zoning Rules</h3>
            <p className="text-sm text-gray-600">Setbacks, height limits, and building requirements</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-semibold mb-2">Permit Requirements</h3>
            <p className="text-sm text-gray-600">What permits you need and how to get them</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">⏱️</div>
            <h3 className="font-semibold mb-2">Timeline Estimates</h3>
            <p className="text-sm text-gray-600">How long the approval process takes</p>
          </div>
        </div>
      </div>
    </main>
  )
}
