# ai-assistant — AI Chatbot

## Project Overview
AI chat assistant using OpenAI API with streaming responses, file upload, and conversation history.

## Tech Stack
Next.js · OpenAI API · Supabase

---

## Phases & Tasks

### 1️⃣ Setup
- [ ] Create repo named "ai-assistant"
- [ ] Create Next.js app
- [ ] Create OpenAI account and get API key
- [ ] Install openai package
- [ ] Store API key in .env.local
- [ ] Connect to Supabase for storing history

### 2️⃣ Backend (API Routes)
- [ ] Build /api/chat to send messages to OpenAI
- [ ] Enable streaming with ReadableStream
- [ ] Build /api/history to save and read conversations
- [ ] Build /api/upload for file upload
- [ ] Add appropriate system prompt

### 3️⃣ Frontend
- [ ] Build chat UI: user and assistant message bubbles
- [ ] Display streaming responses in real-time
- [ ] Add file upload button
- [ ] Display conversation history in sidebar
- [ ] Add new chat button
- [ ] Add loading indicator while waiting for response
- [ ] Add copy to clipboard for messages
- [ ] Add markdown rendering for responses

### 4️⃣ Deployment
- [ ] Deploy on Vercel
- [ ] Set OPENAI_API_KEY on Vercel
- [ ] Test streaming on production
- [ ] Add demo GIF to README