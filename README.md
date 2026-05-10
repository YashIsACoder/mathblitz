# MathBlitz

A Monkeytype-for-math personal training tool. Zero-latency game loop, adaptive difficulty, SQLite analytics.

## 🚀 Quick Start (2 steps)

### Windows Users:
1. Double-click `setup.bat` (installs everything)
2. Double-click `start.bat` (launches the app)

### Mac/Linux Users:
1. Run `./setup.sh` (installs everything)
2. Run `./start.sh` (launches the app)

Open [http://localhost:3000](http://localhost:3000) in your browser.

**That's it!** No database configuration needed - it uses SQLite locally.

---

## 📋 Requirements

- **Node.js** v18 or higher ([Download Node.js](https://nodejs.org))
- **npm** (comes with Node.js)

---

## 🎮 How to Play

1. **Play tab** — Choose operations (+, −, ×, ÷), mode (60s timer / endless / target score), and number range
2. Type your answer and press **Enter** to submit
3. Press **Escape** to end a session early
4. Check the **Analytics tab** to review performance

---

## ✨ Features

- **Zero-latency game loop** - All question generation and answer checking runs client-side
- **Adaptive difficulty** - Questions weighted toward your weak operations automatically
- **Advanced analytics** - Heatmaps, weakness detection, fatigue analysis, and more
- **Zetamac-like difficulty** - Weighted question generation for realistic mental math training
- **Local database** - SQLite for analytics (no external database needed)

---

## 🛠️ Manual Setup

If the scripts don't work, try manual setup:

```bash
# Install dependencies and set up database
npm run setup

# Start the app
npm run dev
```

---

## 📊 Database Management

```bash
# Open Prisma Studio (visual database explorer)
npm run db:studio

# Run new migrations
npm run db:migrate

# Regenerate Prisma client after schema changes
npm run db:generate
```

---

## 🐛 Troubleshooting

**"Cannot find module '@prisma/client'"**
```bash
npm run db:generate
```

**"The table `Attempt` does not exist"**
```bash
npm run db:migrate
```

**Port 3000 already in use**
```bash
npm run dev -- -p 3001
```

---

## 📁 Project Structure

```
mathblitz/
├── setup.sh / setup.bat    # Automated setup scripts
├── start.sh / start.bat    # App launch scripts
├── prisma/                 # SQLite database schema
├── src/
│   ├── app/               # Next.js app routes
│   ├── components/        # React components
│   ├── engine/            # Question generation logic
│   ├── stores/            # State management
│   └── lib/               # Utilities
└── package.json
```

---

## 🚀 Deployment

For production deployment, see [SETUP.md](SETUP.md) for Vercel/Turso deployment instructions.
