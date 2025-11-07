'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function SignOutButton() {
  const router = useRouter()
  
  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  return (
    <button 
      onClick={handleSignOut}
      className="text-sm text-white/60 hover:text-white"
    >
      Sign out
    </button>
  )
}
