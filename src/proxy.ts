import { withAuth } from "next-auth/middleware"

export const config = {
  matcher: ["/((?!api/auth|auth|_next/static|_next/image|favicon.ico|uploads).*)"],
}

export default withAuth({
  pages: {
    signIn: "/auth/login",
  },
})
