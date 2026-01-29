# QuickCarousals

[![GitHub License][github-license-badge]][github-license-badge-link]

**Turn an idea into a LinkedIn-ready PDF carousel in 3 minutes that doesn't look templated.**

QuickCarousals is a LinkedIn-first carousel generator that enables solo creators to transform ideas into professional, ready-to-post PDF carousels in under 3 minutes. Built on the Saasfly monorepo template, the product focuses on speed, design confidence, and eliminating the blank-page anxiety that creators face when trying to produce engaging carousel content.

## ⚡ Key Features

- **🎯 AI-Powered Generation** - Turn a topic or paste text into a structured carousel with smart layout matching
- **🎨 8 Curated Style Kits** - Professional designs that always look good (no ugly templates)
- **✨ WYSIWYG Canvas Editor** - Konva.js-based editor with live preview and auto-fit text
- **🎭 Brand Kit System** - Save your logo, colors, and fonts for consistent personal branding
- **📤 Professional Exports** - High-quality PDF and PNG exports optimized for LinkedIn
- **⚡ Lightning Fast** - From idea to downloadable carousel in under 3 minutes

## 🏗️ Tech Stack

### Frontend
- **Next.js 15.x** - React framework with App Router
- **TypeScript** - End-to-end type safety
- **Konva.js** - Canvas-based layered editor
- **Zustand** - State management
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library

### Backend
- **tRPC** - Type-safe API layer
- **Prisma + Kysely** - Database schema management + type-safe queries
- **BullMQ + Redis** - Job queue for exports
- **@napi-rs/canvas** - Server-side rendering
- **PDFKit** - Multi-page PDF generation

### Infrastructure
- **PostgreSQL** - Primary database (Vercel Postgres)
- **Cloudflare R2** - File storage (exports, logos, fonts)
- **Upstash Redis** - Caching + queue
- **Clerk** - Authentication & user management
- **OpenAI API** - Content generation
- **Stripe** - Subscription billing

## 🚀 Getting Started

### Prerequisites

Before you start, make sure you have the following installed:

1. **[Bun](https://bun.sh/)** & **[Node.js](https://nodejs.org/)** & **[Git](https://git-scm.com/)**

   **Linux:**
   ```bash
   curl -sL https://gist.github.com/tianzx/874662fb204d32390bc2f2e9e4d2df0a/raw -o ~/downloaded_script.sh && chmod +x ~/downloaded_script.sh && source ~/downloaded_script.sh
   ```

   **MacOS:**
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   brew install git
   brew install oven-sh/bun/bun
   brew install nvm
   ```

2. **[PostgreSQL](https://www.postgresql.org/)**
   - You can use Vercel Postgres or a local PostgreSQL server
   - Add `POSTGRES_URL` to your `.env.local` file

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/quickcarousals.git
cd quickcarousals
bun install
```

2. Set up environment variables:

```bash
cp .env.example .env.local
# Edit .env.local with your API keys and configuration
```

3. Set up the database:

```bash
bun db:push
```

4. Run the development server:

```bash
bun run dev:web
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📦 Project Structure

```
quickcarousals/
├── apps/
│   └── nextjs/              # Main Next.js application
│       ├── src/
│       │   ├── app/         # App Router pages
│       │   │   ├── [lang]/
│       │   │   │   ├── (auth)/        # Sign in/up pages
│       │   │   │   ├── (dashboard)/   # Dashboard, editor
│       │   │   │   └── (marketing)/   # Landing, pricing
│       │   │   └── api/               # Route handlers
│       │   ├── components/            # React components
│       │   ├── config/                # App configuration
│       │   └── lib/                   # Utilities
│       └── public/                    # Static assets
├── packages/
│   ├── db/                  # Database schema & utilities
│   ├── ui/                  # Shared UI components
│   ├── auth/                # Authentication utilities
│   ├── api/                 # tRPC API routers
│   └── stripe/              # Stripe integration
└── tooling/                 # Build configurations
```

## 🎯 Core Workflows

### 1. Topic → Carousel
The fastest blank-page solver for creators.

**Input:**
- Topic (required)
- Optional: audience, tone ("bold / calm / contrarian")

**Output:** 8-12 slide draft with hook, promise, value slides, recap, and CTA

### 2. Paste Text → Carousel
For power users with existing notes or draft content.

**Input:** Messy notes, LinkedIn post draft, or text up to 8,000 characters

**Output:** Structured slides with proper pacing and hierarchy

### 3. WYSIWYG Canvas Editor
A constrained but powerful editing experience with:
- Click-to-edit text with live preview
- Drag to reorder slides, add/remove/duplicate
- Auto-fit text (automatically adjusts font size)
- Theme controls: font pairs, color palettes, spacing
- Per-slide layout variants

## 💰 Pricing Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 3 carousels/month, 8 slides max, watermark, 3 style kits |
| **Creator** | $15/mo | 30 carousels/month, 15 slides max, no watermark, all 8 style kits, 1 brand kit |
| **Pro** | $39/mo | Unlimited carousels, 20 slides max, 5 brand kits, custom fonts, priority exports |

## 🔑 Environment Variables

See `.env.example` for a complete list of required environment variables. Key variables include:

- `POSTGRES_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk authentication
- `CLERK_SECRET_KEY` - Clerk secret key
- `OPENAI_API_KEY` - OpenAI API for content generation
- `STRIPE_API_KEY` - Stripe for billing
- `R2_ACCOUNT_ID` - Cloudflare R2 for storage
- `UPSTASH_REDIS_REST_URL` - Redis for caching and queues

## 📝 License

This project is licensed under the MIT License. For more information, see the [LICENSE](./LICENSE) file.

## 🙏 Credits

Built on top of the [Saasfly](https://github.com/saasfly/saasfly) boilerplate by [Nextify](https://nextify.ltd).

This project was inspired by:
- shadcn's [Taxonomy](https://github.com/shadcn-ui/taxonomy)
- t3-oss's [create-t3-turbo](https://github.com/t3-oss/create-t3-turbo)

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

---

Made with ❤️ for LinkedIn creators

<!-- Badges and links -->

[github-license-badge]: https://img.shields.io/badge/License-MIT-green.svg
[github-license-badge-link]: https://github.com/yourusername/quickcarousals/blob/main/LICENSE
