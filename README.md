# Margin Notes: An English Learner's Notebook

**Margin Notes** is a web-based English learner's study companion designed to help learners capture, review, and master real-world English. Built with modular HTML, Vanilla CSS, and JavaScript, it features spaced repetition review, error tracking, and AI-powered learning tools.

---

## 🌟 Key Features

### 📚 Notebook Categories
- **Collocations & Phrases**: Store natural word pairs, phrasal verbs, and idioms (e.g., *heavy rain*, *break the ice*).
- **Error Log**: Track your mistakes with before & after comparisons and simple explanations.
- **Words**: Build a personal vocabulary list with definitions, translations, and example sentences.
- **Grammar**: Document grammar rules written in your own words.

### 🧠 Spaced Repetition Review System
- Automatic flashcard queue for items due for review.
- Leitner-style box grading algorithm to reinforce memory over time.
- Overview dashboard showing daily due cards and error source breakdowns.

### 🤖 AI Tutor & Study Buddy
- **AI Sentence Checker**: Automatically analyzes mistakes, suggests corrections, and provides simple explanations.
- **Automated Dictionary Lookup**: Instant definitions, IPA pronunciation, translations, and natural example sentences.
- **Study Buddy Chat**: Interactive floating chat widget to ask questions, practice, or get quizzed on your notebook entries.
- **Private AI service**: Gemini is called through a server-side function, so app users do not enter or receive the API key.

### 💾 Data & Portability
- **Local Storage**: Automatically persists all data locally in the browser.
- **Account Sync**: Built-in cloud account synchronization support.
- **Import & Export**: Backup and restore your notebook data anytime as JSON.

---

## 📁 Project Structure

```text
Margin Note/
├── index.html            # Main HTML application entry point
├── README.md             # Project documentation
├── css/
│   └── style.css          # Core design system and responsive styles
└── js/
    ├── config.js         # Constants, tag categories, and helper utilities
    ├── state.js          # Centralized application state management
    ├── storage.js        # Data persistence, migration, and account sync
    ├── views.js          # View renderers (Today, Cards, Review, AI tutor)
    ├── ai.js             # AI integration services (Claude, OpenAI, Ollama)
    └── app.js            # Main application controller and event delegation
```

---

## 🚀 Getting Started

1. Push this project to a GitHub repository and create a **Cloudflare Pages** project connected to it. Leave the build command blank and set the output directory to `.` so Pages serves `index.html` from the repository root. The `functions/api/ai.js` file provides the `/api/ai` endpoint.
2. In Cloudflare, open the Pages project **Settings → Variables and Secrets** and add `GEMINI_API_KEY` as an encrypted secret with a newly created key from [Google AI Studio](https://aistudio.google.com/apikey). Never put the key in a source file or commit it. Redeploy after adding the secret.
3. Open the deployed Cloudflare Pages URL. AI lookup and Study Buddy are ready without per-user setup. For local development, put `GEMINI_API_KEY=your-key` in `.dev.vars` and run `npx wrangler pages dev .`; opening `index.html` directly with `file://` cannot reach the server function.

The API route accepts bounded prompts, checks same-origin browser requests, and applies a basic per-IP request limit. That in-memory limit is best-effort and can reset across serverless instances; before sharing widely, add a durable rate limiter or authentication and set provider quotas. The server keeps the Gemini key out of browser code, but a public endpoint can still be called by others and use your quota. Revoke the key pasted into chat and use a fresh key as the Cloudflare secret.

---

## 🛠 Tech Stack

- **HTML5**: Semantic layout & accessibility
- **Vanilla CSS**: Custom properties (CSS variables), glassmorphism, responsive grid/flexbox layouts, dark mode support
- **JavaScript (ES6+)**: Modular component structure, LocalStorage API, Fetch API for AI integration
