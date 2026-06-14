# AI Chatbot

AI chat assistant using OpenRouter API with streaming responses, file upload, and conversation history.

## Tech Stack

Next.js 16 · OpenRouter API · Supabase

---

## Status

- **Phase 1 (Setup):** ✅ Next.js app created, OpenRouter configured, .env.local template ready
- **Phase 2 (Backend):** ✅ /api/chat (streaming), /api/history, /api/upload — all built
- **Phase 3 (Frontend):** ✅ Chat UI, streaming, model selector, file upload, sidebar, markdown
- **Phase 4 (Deployment):** ⏳ Not started

## Remaining User Actions

- [ ] Add your **OpenRouter API key** to `.env.local`: `OPENROUTER_API_KEY=sk-...`
- [ ] (Optional) Add **Supabase credentials** to `.env.local` for persistent history: `SUPABASE_URL=...` `SUPABASE_ANON_KEY=...`
- [ ] Run `npm run dev` and test

## Deployment

- [ ] Deploy on Vercel
- [ ] Set `OPENROUTER_API_KEY` on Vercel
- [ ] Set Supabase env vars on Vercel (if using)
- [ ] Test streaming on production
- [ ] Add demo GIF to README
