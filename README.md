# Company Board Prep

> A role-based placement preparation platform. A student selects a company and a target role, gets a curated preparation sheet for that combination, tracks progress category by category, and can generate a personalized AI study plan with Gemini.

> **Current implementation:** React (Vite) owns the UI; Express exposes JSON endpoints. Registration, login, profile, company selection, role selection, curated practice sheets, category progress tracking, weakest area calculation, Gemini 7-day study plan generation, and global candidate progress (/me) are all fully implemented.

## 1. Project Explanation (for the mentor)

A student logs in, selects a company and a target role, and gets a curated question sheet for that combination (for example Amazon + Software Engineer gives top LeetCode, GFG and Codeforces problems; Deloitte + Management gives aptitude, case and HR questions). They open each question, mark it as solved, and the system tracks preparation category by category on a dashboard. Based on weak areas, Gemini generates a personalized 7-day study plan.

**What makes it more than a list:** the system knows where the student stands (progress, weak areas) and acts on it (AI plan).

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React.js (Vite), React Router, Tailwind CSS, Axios |
| Backend | Node.js, Express.js (REST API) |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT (sent in the `Authorization` header), bcrypt password hashing |
| AI | Google Gemini API (`@google/genai`), backend only |
| Deployment | Vercel (frontend), Render (backend), MongoDB Atlas (database) |

This matches the tech stack submitted on the project allocation form.

## 3. Architecture

```
React (Vite + Tailwind)
        |  Axios, JWT in Authorization header
        v
Express REST API  --->  MongoDB Atlas (Mongoose)
        |
        v
   Gemini API  (key only in server/.env)
```

Rule: the browser never talks to Gemini. Only `server/src/services/gemini.js` does.

## 4. Scope

**Seed data: 6 companies x 3 roles = 18 sheets** (about 25-30 questions each).

| Company | Roles |
|---|---|
| Amazon | Software Engineer, Data Analyst, Management / Business |
| Google | Software Engineer, Data Analyst, Management / Business |
| Microsoft | Software Engineer, Data Analyst, Management / Business |
| TCS | Software Engineer, Data Analyst, Management / Business |
| Infosys | Software Engineer, Data Analyst, Management / Business |
| Deloitte | Software Engineer, Data Analyst, Management / Business |

The architecture is generic (any company, any role). Only the seed data is limited.

**Role categories**

| Role | Categories |
|---|---|
| Software Engineer | Arrays, Strings, Linked List, Trees, Graphs, DP, CS Fundamentals, SQL, HR |
| Data Analyst | SQL, Excel, Statistics, Python, Data Interpretation, Case Study, HR |
| Management / Business | Aptitude, Case Study, Guesstimate, GD, Business Knowledge, HR |

**Must have**
- Register / login / logout
- Company and role selection
- Question sheet with filters (category, difficulty, platform) and links
- Mark solved / unsolved, saved per user
- Preparation dashboard (overall %, per-category %, weakest area)
- Gemini 7-day study plan

**Nice to have:** search, "continue where you left off", save last plan

**Future work (mention, don't build):** AI answer evaluation, mock interview, voice, study-topic pages

## 5. User Flow

```
Register / Login
      -> Companies
      -> Roles
      -> Preparation Dashboard
            |-- Progress: 23 / 50
            |-- Category bars (weak area highlighted)
            |-- [Start Practice]   -> Question Sheet
            |-- [Generate AI Plan] -> Gemini 7-day plan
      -> Question Sheet
            -> open problem link -> Mark Solved -> progress updates -> Dashboard
```

## 6. Frontend Pages (React Router)

| Page | Path | Notes |
|---|---|---|
| Landing | `/` | Intro + Explore button |
| Register | `/register` | |
| Login | `/login` | Stores token, redirects |
| Companies | `/companies` | Company cards (protected) |
| Roles | `/companies/:companyId` | Role cards (protected) |
| Dashboard | `/prep/:companyId/:role` | Progress, categories, weak area, buttons |
| Sheet | `/prep/:companyId/:role/sheet` | Questions, filters, solved checkboxes |
| AI Plan | `/prep/:companyId/:role/plan` | Shows Gemini plan |
| My Progress | `/me` | Overview across all companies |

## 7. Backend API

```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me                                     (verify token)

GET  /api/companies
GET  /api/companies/:companyId

GET  /api/prep/:companyId/:role/sheet?category=&difficulty=&platform=
GET  /api/prep/:companyId/:role/dashboard             (progress + categories + weakest)
POST /api/prep/:companyId/:role/plan                  (calls Gemini)

POST /api/progress/toggle                             body: { questionId }
GET  /api/progress/summary                            (all companies, for /me)
```

All routes except register and login require a valid JWT.

## 8. Data Model

**User**: `name`, `email`, `passwordHash`, `createdAt`

**Company**: `name`, `description`, `roles: [String]`

**Question**
```
title, url, platform (LeetCode | GFG | Codeforces | IndiaBix | Other),
category, difficulty (Easy | Medium | Hard),
type (coding | aptitude | case | hr | gd | sql | knowledge),
role (String), companies: [String]
```
One question can belong to several companies, so a shared question bank per role is reused across companies. A company's sheet = questions where `role` matches and `companies` includes that company.

**Progress**: `user` (ref), `question` (ref), `solved` (Boolean), `solvedAt`
Unique index on `(user, question)`.

**Optional - StudyPlan**: `user`, `company`, `role`, `plan` (text), `createdAt`

## 9. How Progress Is Calculated

- **Sheet total** = number of questions for (company, role)
- **Solved** = Progress records with `solved: true` for those questions
- **Overall %** = solved / total x 100
- **Category %** = solved in category / total in category x 100
- **Weakest area** = category with the lowest %, ignoring categories with fewer than 3 questions

This logic is planned for `server/src/services/progress.js`.

## 10. Folder Structure

```
company-board-prep/
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env
│   └── package.json
├── .gitignore
└── README.md
```

React owns the browser UI and routing. Express is a JSON API only: it does not configure a view engine, render templates, or serve frontend pages.

## 11. Environment Variables

`server/.env`
```
PORT=5000
MONGO_URI=your_atlas_connection_string
JWT_SECRET=a_long_random_string
GEMINI_API_KEY=your_google_ai_studio_key
CLIENT_URL=http://localhost:5173
```

`client/.env`
```
VITE_API_URL=http://localhost:5000/api
```

The root `.gitignore` excludes `.env` files and `node_modules` in both folders.

## 12. Setup

Install the existing dependencies from the project root:

```bash
npm install --prefix server
npm install --prefix client
```

Run the API and React development server in separate terminals:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

The API implements auth (`/api/auth`), company listing and detail (`/api/companies`), preparation sheets and dashboard stats (`/api/prep`), Gemini study plan generation, and progress tracking (`/api/progress`). Vite proxies `/api` to the Express server on port 5000. Seed data can be re-run at any time with `npm run seed --prefix server`.

## 13. Gemini Study Plan (`server/src/services/gemini.js`)

Input: company, role, per-category progress.

```js
import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateStudyPlan({ company, role, categories }) {
  const progress = categories
    .map(c => `${c.name}: ${c.solved}/${c.total} (${c.percent}%)`)
    .join("\n");

  const prompt = `Company: ${company}
Role: ${role}

Student progress by category:
${progress}

Create a 7-day preparation plan. Prioritize the weakest categories.
For each day give: focus topic, what to revise, and how many questions to solve.
Keep it concise and practical. Use plain text with "Day 1", "Day 2", etc.`;

  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash", // confirm current model name in Google AI Studio
    contents: prompt,
  });
  return res.text;
}
```

Wrap the call in try/catch and show a friendly message if Gemini fails or rate-limits.

## 14. Seed Data Strategy

- One shared question bank per role (about 60-80 questions each), each question tagged with the companies it suits.
- Coding questions link to real LeetCode / GFG / Codeforces problems. Aptitude and case questions link to free practice sites or have no link.
- Label sheets as **"Curated sheet"** or **"Frequently asked"**, not official company data.
- Spot-check every link before submitting.

## 15. Build Order

1. Server setup: Express, MongoDB connection, `.env`
2. Models + seed script
3. Auth API (register, login, middleware)
4. Client setup: Vite, Tailwind, Router, Axios, AuthContext
5. Login / Register pages + ProtectedRoute
6. Companies and Roles pages
7. Sheet page: filters + mark solved
8. Dashboard: progress and category bars
9. Gemini study plan
10. UI polish, README, deploy (Render + Vercel)

**Rule:** if a step takes more than 2 hours, simplify it. Get login -> company -> role -> sheet -> mark solved working end to end before anything else.

## 16. React Concepts Needed (learn as you go)

Components and JSX, props, `useState`, `useEffect`, Axios calls, React Router (`Routes`, `Link`, `useParams`, `useNavigate`), and Context for auth. Nothing else is required.

## 17. Timeline (until Wednesday)

| Day | Goal |
|---|---|
| Sunday / Monday | Steps 1-7 (login, companies, roles, sheet, solved tracking) |
| Tuesday | Steps 8-9 (dashboard, Gemini), start polish |
| Wednesday | Polish, README, deploy, demo prep |

If time runs short, skip the AI plan before skipping the dashboard.