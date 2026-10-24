# StudySnap

> A multimodal study assistant for university students at IIUC and beyond.

StudySnap turns handwritten notes, lecture slides, and question-paper PDFs into a structured study session: a detailed summary, key points, focus topics, and a 10-question quiz grounded only in the uploaded material. Students can choose Bangla or English, review previous sessions, ask follow-up questions, and browse a searchable bank of past exam papers.

## Live demo

Try the deployed application at **[studysnapiiuc.vercel.app](https://studysnapiiuc.vercel.app/)**.

## The problem

University students often prepare from a mixture of handwritten notebooks, photographed slides, and scattered past papers. Important explanations are difficult to search, revision is passive, and generic AI quizzes may introduce information that was never taught in class.

StudySnap addresses that workflow with a simple upload-first experience:

1. Upload note images or a PDF.
2. Choose Bangla or English.
3. Receive a source-grounded summary and quiz.
4. Practice the material and save the session for later review.

## What StudySnap does

- Reads handwritten notes, lecture slides, and uploaded PDFs.
- Renders every page of an uploaded PDF in the browser before analysis.
- Produces a detailed summary, key points, and focus topics.
- Generates exactly 10 multiple-choice questions with four options each.
- Generates 3 short-answer questions with model answers.
- Keeps every quiz question grounded in the uploaded notes.
- Includes the exact source line used for each multiple-choice question.
- Tracks quiz attempts and displays progress and weak topics.
- Supports Bangla and English output.
- Provides follow-up Q&A about the current study session.
- Reads summaries and answers aloud with the browser's free Web Speech API.
- Saves sessions by an anonymous browser `deviceId`, without requiring sign-up.
- Provides a searchable past-question-paper bank with View PDF links.

## Screenshots

### Upload notes or questions

The home screen keeps the main flow focused: choose a language, upload images or a PDF, and start analysis.

![StudySnap home upload screen](public/studysnap-home-upload.png)

### Upload and analysis panel

The upload panel accepts JPG, PNG, WEBP, and PDF files. PDF pages are rendered before they are sent for analysis.

![StudySnap upload panel](public/studysnap-upload-panel.png)

### Saved study sessions

Past sessions can be reopened from the device-based history page.

![StudySnap past study sessions](public/studysnap-past-sessions.png)

### Past question-paper bank

Students can search and filter the existing exam-paper collection, then open a paper directly.

![StudySnap exam papers bank](public/studysnap-exam-papers.png)

## How it works

```mermaid
flowchart TD
    A[Student uploads note images or PDF] --> B[Client resizes images and renders PDF pages]
    B --> C[POST /api/analyze]
    C --> D[Gemma multimodal analysis]
    D --> E[Strict JSON validation]
    E --> F[Save Session and Questions with Prisma]
    F --> G[Summary, quiz, and short questions]
    G --> H[POST /api/attempts]
    G --> I[POST /api/chat for follow-up questions]
```

The analysis request contains all uploaded pages and asks the model for one strict JSON response. The server validates the response before saving it. The application does not store the original note photos in the database.

### AI models

StudySnap uses open-weight models only:

- **Primary model:** `gemma-4-31b-it`
- **Fallback model:** `gemma-4-26b-a4b-it`
- **Emergency fallback:** `qwen/qwen3.8-27b` through Groq when configured

The primary and fallback models are accessed through Google's OpenAI-compatible endpoint. Provider selection, model names, retry behavior, and fallback handling are centralized in [`lib/ai.ts`](lib/ai.ts), so API routes do not hardcode provider logic.

Learn more:

- [Gemma documentation](https://ai.google.dev/gemma)
- [Google AI Studio](https://aistudio.google.com/)
- [Groq](https://groq.com/)

### Prompt and response contract

The prompt in [`lib/prompts.ts`](lib/prompts.ts) requires:

- Output in the selected language.
- Detailed explanations based only on the uploaded content.
- Exactly 10 MCQs.
- Exactly 4 options per MCQ.
- Exactly 3 short questions.
- A source line from the notes for every MCQ.

If the model returns invalid JSON or the wrong question counts, the server rejects the result instead of saving an incomplete session.

### PDF processing

PDFs are not stored as raw note files. In the browser, [`lib/pdf.ts`](lib/pdf.ts) uses `pdfjs-dist` to render every page to a PNG. Those page images go through the same analysis path as uploaded note photographs. This allows multi-page PDFs to be analyzed while keeping the database limited to structured study-session data.

## Tech stack

- [Next.js](https://nextjs.org/) 16 App Router
- TypeScript
- React 19
- Tailwind CSS 4
- [Prisma](https://www.prisma.io/) 7
- [Supabase PostgreSQL](https://supabase.com/)
- [Supabase Storage](https://supabase.com/storage) for the public `past-papers` bucket
- `pdfjs-dist` for client-side PDF rendering
- Browser Web Speech API for free read-aloud
- [Vercel](https://vercel.com/) deployment target

## Database

The Prisma schema contains four application models:

- **Session**: title, language, summary, key points, focus topics, device ID, and creation time.
- **Question**: quiz question, four options, answer index, explanation, source quote, and topic.
- **Attempt**: whether a question attempt was correct and when it was submitted.
- **PastPaper**: course information, topics, searchable text, device ID, and public PDF URL.

Raw note photos are never written to the database. Past-paper PDFs are hosted in the public Supabase Storage bucket `past-papers`, with their public URL stored in the `PastPaper` record.

## Run locally

### Prerequisites

- Node.js 20 or newer recommended
- A Supabase PostgreSQL database
- A Google AI Studio API key for Gemma
- A Groq API key only if emergency fallback or optional speech-to-text is enabled

### Install

```bash
git clone https://github.com/ashrafulalamasad/study-snap.git
cd study-snap
npm install
```

### Configure environment variables

Create a local `.env` file. Never commit it.

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
GEMINI_API_KEY="your-google-ai-studio-key"

# Optional emergency model and optional speech-to-text support
GROQ_API_KEY="your-groq-key"
```

### Generate Prisma and sync the database

```bash
npx prisma generate
npx prisma db push
```

This project intentionally uses `prisma db push` for the hackathon database setup. The `postinstall` script also runs `prisma generate` after installation.

### Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Validate the production build

```bash
npm run build
```

## API routes

- `POST /api/analyze` — analyzes uploaded image/PDF pages, validates the JSON contract, and saves the session and questions.
- `POST /api/attempts` — records a quiz attempt.
- `GET /api/history` — returns sessions for the current browser device.
- `GET /api/sessions/[id]` — reopens an owned session.
- `GET /api/past-papers` — searches the past-paper bank.
- `POST /api/chat` — answers one follow-up question using the session context.
- `POST /api/stt` — optional speech-to-text route when the required provider is configured.

The app uses a browser-generated UUID in `localStorage` as `deviceId`. API requests send that identifier so one browser cannot freely read another browser's sessions.

## Design principles

- Light paper-and-ink visual system.
- Mobile-first upload flow.
- No sign-up required for the demo.
- No raw note-photo persistence.
- No proprietary model API in the analysis path.
- One analysis call per upload and one model call per follow-up question.
- User-facing errors are translated into clear application messages rather than exposing raw provider failures.

## What's not finished yet

- **Authentication:** History is demo-scoped to an anonymous browser-generated `deviceId`. A production version should add IIUC or institutional student login.
- **Large-document scaling:** Very large PDFs may exceed browser request, image, or model-token limits. A production version should add server-side page batching or a clear upload-size policy.
- **Offline support:** Analysis currently requires an internet connection.
- **Diagram reconstruction:** The app can analyze diagrams as part of the uploaded page, but it does not yet redraw them as interactive graphics.
- **Final deployment evidence:** The screenshots in this README document the implemented UI; a deployed demo URL and final event submission are still external submission steps.

## Credits

- **Project:** StudySnap
- **Context:** International Islamic University Chittagong (IIUC), Bangladesh
- **AI:** Google DeepMind Gemma open-weight models
- **Inference:** Google AI Studio, with optional Groq emergency fallback
- **Database:** Supabase PostgreSQL and Prisma
- **Storage:** Supabase Storage
- **Application:** Next.js, React, TypeScript, and Tailwind CSS

Built for students who want to turn the notes they already have into a more active, focused revision session.
