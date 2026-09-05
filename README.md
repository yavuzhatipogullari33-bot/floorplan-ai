# FloorPlan AI 🏠

A full-featured AI floor plan generator inspired by [Maket.ai](https://maket.ai), built with **Next.js 14**, **Google Gemini AI**, and **Tailwind CSS**.

## Features

- 🤖 **AI-powered generation** — Describe your home, get a complete floor plan instantly
- 💬 **Chat refinement** — Modify layouts via natural language chat
- 📐 **SVG floor plans** — Color-coded rooms with doors, windows, labels, and scale
- 💾 **Project dashboard** — Save and manage multiple floor plan projects
- 🔐 **Google OAuth** — Secure authentication with Google
- ⬇️ **Export** — Download as PNG or SVG

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI | Google Gemini 2.0 Flash |
| Auth | NextAuth.js (Google OAuth) |
| Database | Prisma + SQLite |
| State | React useState |

## Getting Started

### 1. Clone and install

```bash
cd floorplan-ai
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|----------|----------------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) — Free |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com) → OAuth 2.0 |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` |

### 3. Set up database

```bash
npm run db:push
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
floorplan-ai/
├── app/
│   ├── page.tsx              # Landing page
│   ├── sign-in/page.tsx      # Google OAuth login
│   ├── dashboard/page.tsx    # Project dashboard
│   ├── editor/[projectId]/   # Main 3-panel editor
│   └── api/
│       ├── auth/[...nextauth] # NextAuth handler
│       ├── generate/          # AI floor plan generation
│       ├── chat/              # Chat-based refinement
│       └── projects/          # CRUD for projects
├── components/editor/
│   ├── PromptPanel.tsx        # Structured input form
│   ├── FloorPlanCanvas.tsx    # SVG viewer with zoom/pan
│   └── ChatPanel.tsx          # Chat interface
├── lib/
│   ├── gemini.ts              # Google Gemini client
│   ├── svg-generator.ts       # JSON layout → SVG
│   ├── auth.ts                # NextAuth config
│   ├── db.ts                  # Prisma client
│   └── utils.ts               # Helpers
└── prisma/schema.prisma       # Database schema
```

## How It Works

1. **User describes** their home using the structured form (bedrooms, bathrooms, area, style)
2. **Gemini AI** receives a structured prompt and returns a room layout as JSON with coordinates
3. **SVG Generator** converts the JSON layout into a color-coded floor plan SVG
4. **Chat refinement** sends the current layout + user message to Gemini, which returns an updated layout
5. **All changes** are saved to the SQLite database via Prisma

## Google Cloud OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Secret to `.env.local`
