# StudySnap ⚡
> Multimodal AI Academic Assistant for University Students (IIUC, Bangladesh)

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.3-black?logo=next.js)](https://nextjs.org/)
[![Prisma 7](https://img.shields.io/badge/Prisma-7.10.1-2D3748?logo=prisma)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![TailwindCSS v4](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Google AI Studio](https://img.shields.io/badge/Google_AI_Studio-Gemma_4_31B-4285F4)](https://aistudio.google.com/)

---

## 1. Problem
University students (particularly at institutions like IIUC in Bangladesh) face several high-friction hurdles during midterm and final exam prep:
1. **Messy handwritten lecture notes**: Notes taken in hurried classroom sessions mix English terminology with Bengali explanations and complex diagrams. Re-reading them before an exam is time-consuming and exhausting.
2. **Disconnected past papers**: Students collect photocopies of previous years' semester exam papers, but have no quick way to correlate those exam questions with the specific lectures where those topics were taught.
3. **Passive studying vs. active recall**: Reading slides repeatedly leads to low retention. Students need fast, verified active-recall quizzes that test *only* what was actually covered in their class notes, without AI hallucinations or out-of-syllabus tangents.

---

## 2. Solution: StudySnap
**StudySnap** allows students to simply snap photos of notebook pages or lecture slides and past question papers with their phone camera. Within seconds, it generates:
- 📝 **Structured synthesis in Bangla or English**: Thorough summaries with clear paragraphs and numbered key takeaways.
- 🎯 **High-yield exam focus detection**: Detects recurring question topics when past question papers are uploaded and prioritizes them.
- ⚡ **Interactive 5-question verified quiz**: Tap an option to receive immediate right/wrong feedback, detailed explanations, and an **exact quote line** from the uploaded notes (*"From your notes: '...' "*). Every attempt is tracked in the database to compute weak topics.
- 💡 **Conceptual short-answer questions**: 3 open-ended review questions with tap-to-reveal model answers.
- 🤖 **"Ask Your Notes" follow-up Q&A**: Follow-up chat strictly grounded in the session's lecture notes, with optional voice input and text-to-speech read-aloud.
- 📚 **Session history & past papers bank**: Searchable personal vault of past lectures and previous exam papers keyed by device ID.

---

## 3. How It Works (Models & Links)

### Open-Weight Vision & Reasoning Stack
StudySnap strictly uses open-weight models with **zero closed proprietary model APIs**:

1. **Primary Vision Model**: `gemma-4-31b-it` via [Google AI Studio](https://aistudio.google.com) OpenAI-compatible endpoint (`https://generativelanguage.googleapis.com/v1beta/openai/`)
   - Dense multimodal model capable of deciphering handwritten Bengali script, bilingual notes, diagrams, and exam papers.
2. **Secondary Vision Fallback**: `gemma-4-26b-a4b-it` via Google AI Studio
   - Automatically engaged if the primary model encounters an error.
3. **Emergency Fallback**: [`qwen/qwen3.8-27b`](https://groq.com) via Groq API.
4. **Speech-to-Text (STT)**: Browser Web Speech API with fallback support for [`groq/whisper-large-v3`](https://groq.com).
5. **Speech Synthesis (TTS)**: Web SpeechSynthesis API supporting both `bn-BD` and `en-US` voices.

### The Core Efficiency Rule
StudySnap is architected for maximum speed and efficiency:
- **One vision call per upload**: The model extracts note text, compiles the summary, identifies exam topics, generates 5 MCQs, and writes 3 short questions in a **single streaming multimodal invocation**.
- **Client-side image resizing**: Images are scaled to $\le 1024\text{px}$ using HTML5 Canvas before upload, slashing network bandwidth, reducing processing latency, and conserving token quota.
- **Single follow-up call**: Follow-up Q&A queries use lightweight text-only calls containing previously summarized context.

---

## 4. Architecture & Data Flow

```mermaid
graph TD
    A[Student snaps 1-4 notes + optional past paper] --> B[Canvas client-side resize to 1024px]
    B --> C[POST /api/analyze SSE Stream]
    C --> D[Google AI Studio: Gemma 4 31B Vision]
    D --> E[Strict JSON contract verification & fallback]
    E --> F[Supabase PostgreSQL via Prisma 7]
    F --> G[Interactive Results: Summary + Quiz + Proof Quotes]
    G --> H[POST /api/attempts: Track correct/incorrect]
    H --> I[ScoreCard: Weak topics calculated]
```

### Database Schema (Prisma 7 + Supabase)
- **Session**: `id`, `deviceId`, `title`, `language`, `summary`, `keyPoints` (Json), `focusTopics` (String[]), `createdAt`
- **Question**: `id`, `sessionId`, `question`, `options` (Json), `answerIndex`, `explanation`, `source`, `topic`
- **Attempt**: `id`, `questionId`, `correct` (Boolean), `createdAt`
- **PastPaper**: `id`, `deviceId`, `course`, `topics` (String[]), `text`, `createdAt`

---

## 5. How to Run Locally

### Prerequisites
- Node.js 18+ (tested on Node 20 & 22)
- PostgreSQL database (Supabase instance)
- Google AI Studio API key (`GEMINI_API_KEY`)

### 1. Clone & Install
```bash
git clone https://github.com/ashrafulalamasad/study-snap.git
cd study-snap
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
# Supabase pooled transaction connection (port 6543)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase direct session connection (port 5432)
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Google AI Studio API Key for Gemma Vision
GEMINI_API_KEY="AIzaSy..."

# (Optional) Groq API Key for emergency fallback
GROQ_API_KEY="gsk_..."
```

### 3. Sync Database Schema
```bash
# Generate Prisma 7 TypeScript client
npx prisma generate

# Push schema directly to Supabase PostgreSQL
npx prisma db push
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Features & UI Walkthrough

1. **Upload & Camera Interface**:
   - Multi-page selector supporting up to 4 notebook photos with drag-and-drop or direct phone camera snap.
   - Dedicated secondary slot for 1–2 past-exam question papers.
   - Instant client-side canvas compression displaying KB sizes and preview thumbnails.
2. **Language Toggle**:
   - Instant toggle between **বাংলা (Bangla)** and **English**.
3. **Interactive Active-Recall Quiz**:
   - 4-choice randomized MCQs.
   - Immediate color feedback (emerald for correct, rose for wrong).
   - Provenance citation: `"From your notes: '...' "` displays the verbatim phrase from the lecture notes.
   - Each attempt is saved to `/api/attempts` in real time.
4. **Performance & Weak Topics ScoreCard**:
   - Calculated accuracy percentage and assessment grade.
   - Flags concepts that were answered incorrectly as **Identified Weak Topics to Revisit**.
   - "Practice Weak Topics Only" toggle lets students filter questions to target their review.
5. **Exam Paper Bank**:
   - Searchable repository of previously uploaded past semester exams. Filter by course code, topic, or question keywords.
6. **Voice Input & TTS**:
   - Speech synthesis for listening to summaries and answers on the go.
   - Voice microphone input for hands-free queries during late-night study sessions.

---

## 7. What's Not Done Yet (Honest Disclosures)
- **Authentication**: For hackathon velocity, session history and past papers are keyed to an anonymous browser-generated `deviceId` stored in `localStorage`. In a production deployment, this would be replaced with student institutional login (e.g., IIUC Student ID / Google OAuth).
- **Offline PWA Sync**: Sessions currently require an active internet connection to stream vision inferences from Google AI Studio. Adding ServiceWorker caching and indexedDB offline persistence is planned for v2.
- **Diagram Vectorization**: While the multimodal vision model reads handwritten diagrams and circuit sketches, generating interactive SVG re-drawings is slated for a future iteration.

---

## 8. Credits & Acknowledgments
- **Institution**: International Islamic University Chittagong (IIUC), Bangladesh
- **AI Models**: Google DeepMind Gemma open-weight team ([Gemma 4 31B Vision](https://aistudio.google.com))
- **Inference Infrastructure**: [Google AI Studio](https://aistudio.google.com) & [Groq](https://groq.com)
- **Database & Hosting**: [Supabase](https://supabase.com) & [Vercel](https://vercel.com)
- **Framework**: [Next.js](https://nextjs.org) & [Prisma ORM](https://prisma.io)
