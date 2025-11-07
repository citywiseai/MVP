import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import CityWiseLogo from "@/components/CityWiseLogo";

export default async function LoginPage() {
  const session = await auth();
  
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2c4f6f] to-[#9caf88] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <CityWiseLogo theme="light" width={180} />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2 text-center">Welcome Back</h2>
          <p className="text-gray-600 text-center mb-8">Sign in to continue to your projects</p>

          <form action="/api/auth/signin" method="post" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1e3a5f] mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-3 border border-[#9caf88]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88] focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1e3a5f] mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                className="w-full px-4 py-3 border border-[#9caf88]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9caf88] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#1e3a5f] text-white py-3 rounded-lg font-semibold hover:bg-[#2c4f6f] transition-colors"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/signup" className="text-[#1e3a5f] font-semibold hover:text-[#2c4f6f]">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-white/80 hover:text-white text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
