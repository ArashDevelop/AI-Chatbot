import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

export const authOptions = {
  session: { strategy: "jwt" as const },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.hashedPassword) return null
        if (!user.active) return null

        const isValid = await bcrypt.compare(credentials.password as string, user.hashedPassword)
        if (!isValid) return null

        return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, active: user.active }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }: { user: any; account: any }) {
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.user.findUnique({ where: { email: user.email } })
        if (!existing) {
          await prisma.user.create({
            data: { email: user.email, name: user.name, image: user.image, active: true },
          })
        }
      }
      return true
    },
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id
        token.role = user.role || "USER"
        token.active = user.active
      } else if (token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          token.active = dbUser.active
          token.name = dbUser.name
        }
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.active = token.active
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
  },
}

export const auth = async () => {
  const { getServerSession } = await import("next-auth")
  return getServerSession(authOptions)
}
