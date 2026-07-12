# GenCourse AI - Custom Syllabus & Lesson Builder

GenCourse AI is a dynamic, LLM-powered custom syllabus builder and lesson playground. It enables students and educators to type any topic, generate detailed multi-modular course structures (including textbook chapters and voiceover scripts), and chat with an interactive context-aware AI Tutor in real time.

---

## 📂 Project Architecture & Layout

This project is organized as a monorepo containing the following components:

```text
/
├── backend/            # Express.js API Server
│   ├── load-test.js    # Programmatic SSE stream load test runner
│   ├── load-test-k6.js # k6 load test script
│   └── server.js       # Main server entry point
├── frontend/           # Vite + React + Tailwind CSS v4 Landing & Player app
│   ├── e2e/            # Playwright E2E browser tests
│   └── src/            # Client source code
├── docs/               # Architecture, schemas, and testing documentation
│   ├── architecture/   # Detailed workflow and subsystem architecture diagrams
│   └── test/           # Grouped unit, integration, component, E2E, and load test docs
└── docker-compose.yml  # Docker environment config for backend and database
```

For detailed system specifications, sequence diagrams, and operational flows, review the [GenCourse AI Architecture Overview](docs/architecture/overview.md).

---

## ⚡ Quickstart

### 1. Manual Execution (Development)

To spin up the platform manually, you will need to start both services:

#### Backend:
1. Navigate to `/backend` and install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your keys (Gemini API key, Auth0 parameters, etc.).
3. Seed the database with mock accounts and profiles:
   ```bash
   npm run seed
   ```
4. Start the server in hot-reload development mode:
   ```bash
   npm run dev
   ```

#### Frontend:
1. Navigate to `/frontend` and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Spin up the Vite development server:
   ```bash
   npm run dev
   ```
3. Open **[http://localhost:5173/](http://localhost:5173/)** in your browser. Pass `?mockUser=true` in the URL to automatically bypass Auth0 validation in local development.

---

### 🐳 2. Running with Docker Compose

You can containerize the database and backend. From the root directory, run:
```bash
docker compose up --build
```
This starts MongoDB on `localhost:27017` and the Express server on `localhost:5000`. To seed the MongoDB database inside the running container, execute:
```bash
docker exec -it gencourse-backend npm run seed
```

---

## 🧪 Testing & Quality Assurance

GenCourse AI is validated across every layer. For full setup details and execution guides, review the [GenCourse AI Testing Index](docs/test/README.md).

Here is a quick summary of testing commands:

| Testing Scope | Command | Directory |
| :--- | :--- | :--- |
| **Backend Unit & Integration** | `npm run test` | `/backend` |
| **Frontend Unit & Components** | `npm run test` | `/frontend` |
| **Playwright E2E Browser Journey** | `npx playwright test` | `/frontend` |
| **Programmatic SSE Load Tests** | `node load-test.js` | `/backend` |
| **k6 Concurrency Sockets Tests** | `k6 run load-test-k6.js` | `/backend` |
