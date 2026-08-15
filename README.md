# 📚 ClownKosh

A digital library manager and smart document reader built with React, Vite, Three.js, and Supabase.

---

## ✨ Features

- 📖 **Universal Document Reader**: Support for PDFs, EPUBs, Markdown, text files, and digital notes.
- 🤖 **Interactive 3D Companion**: Animated 3D mascot powered by Three.js and GSAP.
- ☁️ **Cloud Sync**: Cross-device library and notes synchronization with Supabase.
- 🏆 **Reading Gamification**: Track daily reading streaks, XP progression, and achievements.
- ✍️ **Note-Taking**: Create and organize notes linked directly to your documents.
- 🗂️ **Library Management**: Search, category filtering, favorites shelf, and status tracking.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Git](https://git-scm.com/)

---

### Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Intruder9211/clownkosh.git
   cd clownkosh
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables (Optional):**
   Copy `.env.example` to `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ Scripts

- `npm run dev` - Start local development server
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build locally
- `npm run lint` - Run code linter

---

## 📄 License

MIT
