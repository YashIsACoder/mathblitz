# MathBlitz — Setup Instructions

A Monkeytype-for-math personal training tool. Zero-latency game loop, adaptive difficulty, SQLite analytics.

---

## Prerequisites

- **Node.js** v18+ ([nodejs.org](https://nodejs.org))
- **npm** v9+ (comes with Node)

---

## Quick Start (5 steps)

### 1. Install dependencies

```bash
cd mathblitz
npm install
```

### 2. Set up the database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

This creates a local SQLite database at `prisma/dev.db`. No external database needed.

### 3. Configure environment

The `.env.local` file is already included and pre-configured for local SQLite:

```
DATABASE_URL="file:./prisma/dev.db"
```

No changes needed for local development.

### 4. Start the dev server

```bash
npm run dev
```

### 5. Open in browser

Visit [http://localhost:3000](http://localhost:3000)

---

## How to Play

1. **Play tab** — Choose your operations (+, −, ×, ÷), mode (60s timer / endless / target score), and number range
2. Type your answer and press **Enter** to submit
3. Press **Escape** to end a session early
4. After a session, switch to the **Analytics tab** to review your performance

---

## Features

| Feature | Description |
|---|---|
| Zero-latency game loop | All question generation and answer checking runs client-side — no network round-trips |
| Adaptive difficulty | Questions are weighted toward your weak operations automatically |
| Multiplication heatmap | 12×12 grid showing your speed/accuracy per multiplication pair |
| Weakness detection | Automatic identification of cognitive patterns you struggle with |
| Batch persistence | Attempts are silently flushed to SQLite every 10 seconds without interrupting gameplay |

---

## Project Structure

```
mathblitz/
├── prisma/
│   └── schema.prisma          # Database schema (SQLite)
├── src/
│   ├── app/
│   │   ├── page.tsx            # Tab shell (Play / Analytics)
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── attempts/       # POST batch attempt storage
│   │       ├── sessions/       # POST/PATCH session management
│   │       ├── analytics/      # GET overview + heatmap
│   │       └── weakness/       # GET weakness profile
│   ├── components/
│   │   ├── play/               # Game UI components
│   │   └── analytics/          # Dashboard components
│   ├── engine/
│   │   ├── questionGenerator.ts    # Core question logic
│   │   └── adaptiveWeighter.ts     # Weakness scoring
│   ├── stores/
│   │   ├── gameStore.ts        # Zustand: game state
│   │   └── analyticsStore.ts   # Zustand: analytics cache
│   ├── hooks/
│   │   └── useGameLoop.ts      # Timer + async flusher
│   ├── lib/
│   │   ├── prisma.ts           # Singleton Prisma client
│   │   ├── analytics.ts        # Server-side aggregations
│   │   └── weakness.ts         # Weakness heuristics
│   └── types/
│       └── index.ts            # Shared TypeScript types
├── .env.local                  # Local environment (DATABASE_URL)
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Useful Scripts

```bash
# Development
npm run dev           # Start dev server at localhost:3000

# Database
npm run db:migrate    # Run new migrations
npm run db:generate   # Regenerate Prisma client after schema changes
npm run db:studio     # Open Prisma Studio (visual DB explorer) at localhost:5555

# Production
npm run build         # Build for production
npm run start         # Start production server
```

---

## Exploring Your Data

Open Prisma Studio to browse your raw attempts, sessions, and weakness profiles:

```bash
npm run db:studio
```

Or run SQL directly against the SQLite file:

```bash
npx prisma db execute --file=query.sql --schema=prisma/schema.prisma
```

### Useful SQL queries

```sql
-- Accuracy by operation
SELECT operation,
       COUNT(*) as total,
       ROUND(100.0 * SUM(CASE WHEN isCorrect = 1 THEN 1 ELSE 0 END) / COUNT(*), 1) as accuracy_pct,
       ROUND(AVG(latencyMs) / 1000.0, 2) as avg_latency_s
FROM Attempt GROUP BY operation;

-- Slowest multiplication pairs
SELECT lhs, rhs, AVG(latencyMs) as avg_ms, COUNT(*) as cnt
FROM Attempt WHERE operation = 'mul'
GROUP BY lhs, rhs ORDER BY avg_ms DESC LIMIT 20;

-- Daily score trend
SELECT DATE(timestamp) as day,
       SUM(CASE WHEN isCorrect = 1 THEN 1 ELSE 0 END) as score,
       COUNT(*) as total
FROM Attempt GROUP BY day ORDER BY day DESC;
```

---

## Deploying to Vercel

SQLite's filesystem is ephemeral on Vercel — use [Turso](https://turso.tech) (free tier) for persistence.

### Steps

1. Create a Turso database:
   ```bash
   brew install tursodatabase/tap/turso
   turso auth login
   turso db create mathblitz
   turso db tokens create mathblitz
   ```

2. Install the libSQL Prisma adapter:
   ```bash
   npm install @prisma/adapter-libsql @libsql/client
   ```

3. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("TURSO_DATABASE_URL")
   }
   ```

4. Set Vercel environment variables:
   - `TURSO_DATABASE_URL` — your Turso database URL
   - `TURSO_AUTH_TOKEN` — your Turso auth token

5. Deploy:
   ```bash
   vercel deploy
   ```

---

## Troubleshooting

**"Cannot find module '@prisma/client'"**
```bash
npx prisma generate
```

**"The table `Attempt` does not exist"**
```bash
npx prisma migrate dev --name init
```

**Port 3000 already in use**
```bash
npm run dev -- -p 3001
```

**Analytics tab shows nothing**
Play at least one full session first — the analytics API returns empty data until attempts are recorded.
