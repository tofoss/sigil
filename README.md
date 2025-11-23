# ⚡ SIGIL

**Your thoughts, inscribed with power.**

---

A sigil is an ancient symbol—a mark that transforms fleeting intention into permanent reality. Your ideas deserve the same treatment. Every brilliant thought, every recipe worth keeping, every fragment of knowledge that sparks in your mind and threatens to fade into the void—**Sigil** captures it, organizes it, and gives it power.

This is not just another note-taking app. This is where your thoughts become permanent.

## Why You'll Love Sigil

**🗂️ Structured Thinking**
Organize your mind the way it actually works. Notebooks contain sections, sections contain notes. No more flat, endless lists—your knowledge has hierarchy and meaning.

**🍳 Recipe Mastery**
Sigil understands that recipes aren't just notes. Dedicated recipe support with ingredients, steps, and prep times. Import from URLs and let AI parse them into structured perfection.

**🔍 Find Anything, Instantly**
Full-text search that actually works. Your thoughts from six months ago? Found in milliseconds.

**🔒 Your Data, Your Control**
Self-hosted. No cloud overlords. No subscription fees. No AI training on your private thoughts. Just you and your sigils.

## Quick Start

```bash
# Generate secrets
./setup.sh

# Start the database
docker-compose up db -d

# Load environment
export $(grep -v '^#' .env | xargs)

# Install frontend dependencies
cd sigil-frontend && pnpm install

# Run database migrations
# (migrations in db/ folder)

# Start backend
cd sigil-go && go run cmd/server/main.go

# Start frontend (new terminal)
cd sigil-frontend && pnpm dev
```

Open `http://localhost:5173` and begin inscribing.

## Features

### Core
- 📓 **Notebooks** — Top-level organization containers
- 📑 **Sections** — Subdivide notebooks with drag-and-drop reordering
- 📝 **Notes** — Rich markdown with syntax highlighting
- 🏷️ **Tags** — Flexible cross-organization

### Recipes
- 🔗 **URL Import** — Paste a recipe URL, get structured data
- 🤖 **AI Parsing** — Automatic ingredient and step extraction
- ⏱️ **Prep & Cook Times** — Track your kitchen efficiency

### Power Features
- 🔍 **Full-Text Search** — Find anything across all your notes
- 📎 **File Attachments** — Images and documents
- 🌙 **Dark Mode** — Easy on the eyes
- 📱 **Responsive** — Works on any device

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Required
JWT_SECRET=<generate with: openssl rand -base64 64>
XSRF_SECRET=<generate with: openssl rand -base64 32>

# Database
PGHOST=localhost
PGPORT=5432
PGDATABASE=sigil
PGUSER=postgres
PGPASSWORD=yourpassword

# Optional
DEEPSEEK_API_KEY=<for AI recipe parsing>
```

See `.env.example` for all available options.

## Development

```bash
# Frontend
pnpm dev          # Development server
pnpm build        # Production build
pnpm test         # Run tests
pnpm lint         # Lint check

# Backend
go run cmd/server/main.go    # Run server
go test ./...                 # Run tests
go build cmd/server/main.go  # Build binary
```

## Backup Your Sigils

Your thoughts are precious. Back them up:

```bash
# Daily backup (database + uploads)
./scripts/backup-db.sh

# Restore when needed
./scripts/restore-db.sh --db <backup> --uploads <backup>
```

Set up a cron job for automatic daily backups:
```bash
0 2 * * * /path/to/sigil/scripts/backup-db.sh >> ~/sigil-backups/backup.log 2>&1
```

## Philosophy

Sigil is built on a few core beliefs:

1. **Your data is yours** — Self-hosted, no telemetry, no cloud lock-in
2. **Structure enables creativity** — Good organization frees your mind
3. **Simple is powerful** — No bloat, no feature creep, just what you need
4. **Speed matters** — Instant search, fast UI, no waiting

---

<p align="center">
  <em>Every thought worth keeping deserves to be inscribed with power.</em><br>
  <strong>⚡ SIGIL ⚡</strong>
</p>
