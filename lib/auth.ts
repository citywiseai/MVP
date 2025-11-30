import NextAuth from "next-auth"
import { PrismaClient } from "@prisma/client"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('🔐 LOGIN ATTEMPT:', credentials?.email)

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user) {
          console.log('❌ User not found:', credentials.email)
          return null
        }

        console.log('✅ User found:', user.email)
        console.log('Password hash in DB:', user.password.substring(0, 20) + '...')

        // CRITICAL: Verify password with bcrypt
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        console.log('🔑 Password comparison result:', isPasswordValid)

        if (!isPasswordValid) {
          console.log('❌ Invalid password for:', user.email)
          return null
        }

        console.log('✅ LOGIN SUCCESS for:', user.email)

        return {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    }
  }
})
