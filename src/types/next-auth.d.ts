import "next-auth"

declare module "next-auth" {
  interface User {
    role?: string
    active?: boolean
  }

  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      active?: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: string
    active?: boolean
  }
}
