<div align="center">

# AI Chatbot

**A modern, open-source AI chat interface powered by OpenRouter**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fai-chatbot&env=DATABASE_URL,OPENROUTER_API_KEY,NEXTAUTH_SECRET,NEXTAUTH_URL&envDescription=Required%20environment%20variables&envLink=https%3A%2F%2Fgithub.com%2Fyourusername%2Fai-chatbot%23environment-variables)

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

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | NextAuth v4 (JWT) |
| Database | PostgreSQL + Prisma ORM |
| AI API | OpenRouter |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or hosted — [Supabase](https://supabase.com) works great)
- [OpenRouter API key](https://openrouter.ai/keys)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-chatbot.git
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

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENROUTER_API_KEY` | Yes | Your OpenRouter API key |
| `NEXTAUTH_SECRET` | Yes | Random string for JWT encryption |
| `NEXTAUTH_URL` | Yes | Your app URL (e.g. `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |

## Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fai-chatbot&env=DATABASE_URL,OPENROUTER_API_KEY,NEXTAUTH_SECRET,NEXTAUTH_URL)

After deploying, run migrations against your production database:

```bash
npx prisma migrate deploy
```

Then set the same environment variables in your Vercel project dashboard → Settings → Environment Variables.

## Screenshots

<!-- Add screenshots here -->

## License

[MIT](LICENSE)
