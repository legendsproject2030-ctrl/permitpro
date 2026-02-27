# PermitPro — Ontario Permit Filing App

A full-stack web app for Ontario residents to upload, fill out, and download completed permit documents.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Backend | Python + FastAPI |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| AI | Anthropic Claude API |
| PDF Processing | PDF.co API |
| Hosting (Frontend) | Vercel |
| Hosting (Backend) | Railway |

---

## Step-by-Step Setup

### 1. Get Your API Keys

Sign up for these services (all have free tiers):

- **Supabase**: https://supabase.com — Create a new project, get URL + anon key + service role key
- **Anthropic**: https://console.anthropic.com — Get your Claude API key
- **PDF.co**: https://pdf.co — Get your API key

---

### 2. Set Up Supabase Database

1. Go to your Supabase project → SQL Editor
2. Copy and paste the entire contents of `supabase_schema.sql`
3. Click Run
4. This creates the tables, security policies, and storage bucket

---

### 3. Deploy the Backend to Railway

1. Go to https://railway.app and create a new project
2. Connect your GitHub repo or drag the `backend/` folder
3. Set these environment variables in Railway:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
ANTHROPIC_API_KEY=sk-ant-...
PDFCO_API_KEY=your_pdfco_key
```

4. Railway will auto-detect the `railway.toml` and deploy
5. Copy your Railway backend URL (e.g. `https://permitpro-backend.railway.app`)

---

### 4. Deploy the Frontend to Vercel

1. Go to https://vercel.com and import your project
2. Set these environment variables in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=https://your-railway-url.railway.app
```

3. Deploy — Vercel will auto-build the Next.js app

---

### 5. Local Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # fill in your keys
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.local.example .env.local  # fill in your keys
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

---

## Project Structure

```
permitpro/
├── backend/
│   ├── main.py           # FastAPI app — all API routes
│   ├── requirements.txt  # Python dependencies
│   └── railway.toml      # Railway deployment config
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── auth/page.tsx         # Sign up / Log in
│   │   ├── dashboard/page.tsx    # Permit sessions dashboard
│   │   ├── upload/page.tsx       # PDF upload flow
│   │   ├── wizard/[id]/page.tsx  # Step-by-step question wizard
│   │   └── complete/[id]/page.tsx # Download completed permit
│   ├── lib/supabase.ts   # Supabase client
│   └── package.json
└── supabase_schema.sql   # Database setup SQL
```

---

## How It Works

1. User uploads an Ontario permit PDF
2. PDF.co extracts form fields and coordinates
3. Claude AI generates plain-English questions for each field
4. User answers questions one at a time in the wizard
5. Answers auto-save as the user progresses
6. On completion, PDF.co fills the original PDF with all answers
7. User downloads the completed, submission-ready permit

---

## Supported Permit Types

- Building permits
- Zoning applications
- Business licences
- Sign permits
- Demolition permits
- Any Ontario municipal PDF permit

---

## Notes

- Both fillable PDFs and scanned/image-based permits are supported
- For scanned permits, Claude reads the document via OCR and text is overlaid at detected positions
- All files are stored securely in Supabase Storage
- Row-level security ensures users can only access their own data
