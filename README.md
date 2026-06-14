<div align="center">

# AI Chatbot

**A modern, open-source AI chat interface powered by OpenRouter**

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql" alt="Postgres">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind">
</p>

<p align="center">
  <a href="https://ai-chatbot-pi-eight-89.vercel.app/">
    <img src="https://img.shields.io/badge/🚀%20LIVE%20DEMO-CLICK%20HERE-FF4B4B?style=for-the-badge&logo=rocket" alt="Demo">
  <a href="https://ai-chatbot-pi-eight-89.vercel.app/">
    <img src="https://img.shields.io/badge/🚀%20LIVE%20DEMO-CLICK%20HERE-FF4B4B?style=for-the-badge&logo=rocket" alt="Demo">
  </a>
</p>

---

</div>

## Features

- **Multi-model chat** — Switch between 50+ free AI models from OpenRouter
- **Streaming responses** — Real-time token-by-token streaming
- **Conversation history** — Saved conversations with full CRUD
- **Google & Email auth** — Sign in with Google or email/password
- **User roles** — Admin panel to manage users, permissions, and model access
- **Markdown rendering** — Rich markdown responses with code highlighting
- **File uploads** — Attach images, PDFs, and documents
- **Dark mode** — Automatic system theme detection

## Tech Stack

| Layer     | Technology                                    |
| --------- | --------------------------------------------- |
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language  | TypeScript                                    |
| Styling   | Tailwind CSS v4                               |
| Auth      | NextAuth v4 (JWT)                             |
| Database  | PostgreSQL + Prisma ORM                       |
| AI API    | OpenRouter                                    |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or hosted — [Supabase](https://supabase.com) works great)
- [OpenRouter API key](https://openrouter.ai/keys)

### Setup

```bash
# Clone the repository
git clone https://github.com/ArashDevelop/AI-Chatbot.git
cd ai-chatbot

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Start the dev server
npm run dev
```

### Environment Variables

Copy `.env.local` and fill in the values:

| Variable               | Required | Description                                 |
| ---------------------- | -------- | ------------------------------------------- |
| `DATABASE_URL`         | Yes      | PostgreSQL connection string                |
| `OPENROUTER_API_KEY`   | Yes      | Your OpenRouter API key                     |
| `NEXTAUTH_SECRET`      | Yes      | Random string for JWT encryption            |
| `NEXTAUTH_URL`         | Yes      | Your app URL (e.g. `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID`     | No       | Google OAuth client ID                      |
| `GOOGLE_CLIENT_SECRET` | No       | Google OAuth client secret                  |

## Deployment

After deploying, run migrations against your production database:

```bash
npx prisma migrate deploy
```

---

## 📸 Screenshots

<p align="center">
  <kbd><img src="https://i.ibb.co/HTf6xSr0/Screenshot-2026-06-14-153653.png" width="800" alt="Hero"></kbd>
  <br><i>User Dashboard</i>
</p>

<p align="center">
  <kbd><img src="https://i.ibb.co/vvVLdg7S/Screenshot-2026-06-14-153718.png" width="800" alt="Hero"></kbd>
  <br><i>User Dashboard</i>
</p>

<p align="center">
  <kbd><img src="https://i.ibb.co/RkdqVhtP/Screenshot-2026-06-14-153411.png" width="800" alt="Hero"></kbd>
  <br><i>Admin Dashboard</i>
</p>

<p align="center">
  <kbd><img src="https://i.ibb.co/SXtqtSvv/Screenshot-2026-06-14-153347.png" width="800" alt="Hero"></kbd>
  <br><i>Product Page</i>
</p>

---

## License

[MIT](LICENSE)
