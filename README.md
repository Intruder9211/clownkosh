# 📚 ClownKosh — Next-Gen Digital Library & Smart E-Reader

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-3D Companion-black?style=flat&logo=three.js)](https://threejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud Sync-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![IndexedDB](https://img.shields.io/badge/Dexie.js-Offline First-blue?style=flat)](https://dexie.org/)

**ClownKosh** is a feature-packed, offline-first digital library manager and universal document reader featuring an interactive 3D companion, gamified reading statistics, cross-device cloud synchronization, and rich note-taking capabilities.

---

## ✨ Key Features

- 📖 **Universal Document Reader**: High-performance reader powered by `PDF.js` for PDFs, EPUBs, Markdown files, plain text, media attachments, and custom digital notes.
- 🤖 **Interactive 3D Companion**: Animated 3D mascot powered by `Three.js` and `GSAP` that reacts to your reading activity and provides encouragement.
- 💾 **Offline-First Architecture**: Seamlessly powered by `Dexie.js` (IndexedDB) to store your library, reading progress, and notes locally—no login required.
- ☁️ **Cloud Sync Integration**: Optional integration with `Supabase` for syncing library metadata, active streaks, and notes across all your devices.
- 🏆 **Gamification & Analytics**: 
  - Track daily reading streaks, gain XP, level up, and unlock achievements.
  - Comprehensive analytics dashboard showing total reading time, book completion rates, and weekly reading progress graphs.
- ✍️ **Note-Taking & Annotations**: Create digital notes attached directly to books or standalone entries with tag filtering and Markdown rendering.
- 🗂️ **Library Management**: 
  - Search, filter by category/format, bookmark favorites, and sort by reading status (Unread, Reading, Completed).
  - Quick-resume hero section to jump right back into your last read page.
- 🎨 **Modern Responsive UI**: Built with dark/light theme toggles, fluid `Framer Motion` animations, and sleek glassmorphism UI elements.

---

## 🚀 Beginner's Quick Start Guide (Local Setup)

Follow these step-by-step instructions to get **ClownKosh** up and running on your local machine.

### 📋 Prerequisites

Before starting, ensure you have the following installed on your computer:
1. **Node.js**: `v18.0.0` or higher ([Download Node.js](https://nodejs.org/))
2. **Git**: Version control system ([Download Git](https://git-scm.com/))

You can verify your installations by running these commands in your terminal:
```bash
node -v
npm -v
git --version
```

---

### 📥 Step-by-Step Installation

#### 1. Clone the Repository

Open your terminal or command prompt (PowerShell, Command Prompt, or Git Bash) and run:

```bash
git clone https://github.com/Intruder9211/clownkosh.git
```

#### 2. Navigate to the Project Directory

```bash
cd clownkosh
```

#### 3. Install Dependencies

Install all required npm dependencies:

```bash
npm install
```

#### 4. Configure Environment Variables (Optional)

ClownKosh works fully offline out of the box using browser local storage (IndexedDB). If you want to enable cross-device cloud sync via Supabase:

1. Create a copy of the `.env.example` file:
   - **Linux / macOS**:
     ```bash
     cp .env.example .env
     ```
   - **Windows (PowerShell)**:
     ```powershell
     Copy-Item .env.example .env
     ```
   - **Windows (CMD)**:
     ```cmd
     copy .env.example .env
     ```

2. Open the newly created `.env` file in your editor and insert your Supabase project credentials:
   ```env
   VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

#### 5. Launch the Development Server

Run the development server:

```bash
npm run dev
```

This will automatically prepare the required PDF worker files and launch Vite.

#### 6. Open in Browser

Open your browser and navigate to the address shown in your terminal (typically `http://localhost:5173`):
```
http://localhost:5173
```

---

## 🛠️ Available Scripts

In the project root directory, you can run:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Copies PDF worker file to `public/` and starts the Vite development server with HMR. |
| `npm run build` | Builds the application for production deployment. |
| `npm run preview` | Previews the production build locally. |
| `npm run lint` | Runs code quality checks using Oxlint. |

---

## 🏗️ Tech Stack

- **Frontend**: React 19, Vite, Lucide React (Icons), Framer Motion
- **3D Graphics & Animations**: Three.js, GSAP
- **PDF Engine**: PDF.js (`pdfjs-dist`)
- **Storage**: Dexie.js (IndexedDB) for offline storage
- **Backend / Database**: Supabase JS Client (Cloud sync)
- **Styling**: Vanilla CSS with CSS custom variables for dynamic light/dark theme switching

---

## 📂 Project Structure

```
clownkosh/
├── public/                # Static assets & PDF worker script
├── src/
│   ├── assets/            # Images, icons, and media files
│   ├── components/        # React UI components (Reader, 3D Mascot, Modals, Library Grid)
│   ├── db/                # Dexie IndexedDB database & Supabase cloud sync setup
│   ├── utils/             # Gamification logic, PDF utilities, file helpers
│   ├── App.jsx            # Core application layout & state management
│   ├── main.jsx           # React app entry point
│   └── index.css          # Design system, themes, & global CSS styles
├── .env.example           # Environment variable template
├── package.json           # NPM dependencies and scripts
└── vite.config.js         # Vite bundler configuration
```

---

## 📄 License

This project is open-source and available for personal, educational, and community use.
