# GenCourse AI - Backend API Service

This is the Express.js backend API server for GenCourse AI, a dynamic curriculum builder that uses large language models (LLMs) to synthesize customized outlines, textbook chapters, and interactive quizzes in real time.

The backend supports local Ollama models (`qwen2.5:1.5b-instruct`), falls back to Google Gemini, streams generated data via Server-Sent Events (SSE), and secures endpoints with backend-driven session authentication using Auth0.

---

## Features

* **Real-time Course Outline Synthesis**: Generates modular course structures including objectives, resource lists, and quizzes using LLM configurations.
* **Chapter-by-Chapter Lesson textbook Generation**: Compiles detailed textbook lessons in English, Spanish, and French, with automatic code block sanitization for non-technical courses.
* **SSE Generation Streaming**: Streams live compiler logs, generated outlines, and parsed modules directly to the client to avoid request timeouts.
* **Context-Aware AI Tutor Chat**: Hosts an intelligent tutoring assistant endpoint that dynamically compiles active course/lesson context into prompts to answer student queries.
* **Backend-Driven Authentication**: Implements state-of-the-art secure OIDC session authentication using Auth0 (`express-openid-connect`), mitigating token exposure to client-side scripts.
* **Local Development Mock Mode**: Supports a signature-free mock authentication override using header/query parameters for offline development.
* **Just-in-Time (JIT) Provisioning**: Automatically registers user documents in MongoDB upon first successful authentication callback.

---

## Tech Stack

* **Runtime**: Node.js (v18+)
* **Framework**: Express.js
* **Database**: MongoDB (Mongoose ODM)
* **Authentication**: Auth0, Express OpenID Connect
* **LLM Engine Integration**: Axios (Ollama HTTP API) & `@google/genai` (Google Gemini SDK)

---

## Prerequisites

Before setting up the server, ensure you have the following installed and running:

1. **Node.js**: Version 18.x or higher.
2. **MongoDB**: A local instance running on `mongodb://localhost:27017` or a remote MongoDB Atlas URI.
   * **Tip (Docker)**: Spin up an instance matching the default `.env` credentials using:
     ```bash
     docker run -d --name gencourse-mongo -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=<username> -e MONGO_INITDB_ROOT_PASSWORD=<password> -v mongo-data:/data/db mongo:latest
     ```
3. **LLM Workers**:
   * API keys or connection info for any configured LLM providers (e.g. Google Gemini, Cerebras Cloud, or a local Ollama instance running at `http://localhost:11434`).
4. **Auth0 Account (Optional for Production Auth)**:
   * An Auth0 Regular Web Application configuration with Allowed Callback URLs set to `http://localhost:5174/auth/callback` (or your domain callback) and Allowed Logout URLs set to `http://localhost:5174`.

---

## Setup & Installation

### 1. Install Dependencies
Navigate to the backend directory and run:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root of the `backend` directory based on the `.env.example` file:
```bash
cp .env.example .env
```

Open `.env` and fill in the required parameters:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://<username>:<password>@localhost:27017/gencourse_ai?authSource=admin

# LLM Workers Configuration
LLM_WORKERS_CONFIG='[{"provider":"gemini","name":"GeminiPrimaryWorker","apiKey":"your_gemini_key","model":"gemini-3.1-flash-lite","maxConcurrency":2}]'

# Auth0 & Session Session Configuration
SESSION_SECRET=your_32_character_long_session_secret_key
AUTH0_CLIENT_ID=your_auth0_client_id_here
AUTH0_ISSUER_BASE_URL=https://your-auth0-domain.auth0.com

# YouTube API Configuration (Optional: if omitted, searches fall back to yt-search scraping)
YOUTUBE_API_KEY=your_youtube_data_api_v3_key
```

### 3. Seed the Database
Seed the database with pre-configured developer accounts, mock student profiles, and standard offline sample courses:
```bash
npm run seed
```

---

## Running the Server

### Option A: Local Execution

#### Development Mode (with hot-reloading)
Runs nodemon to watch file changes:
```bash
npm run dev
```

#### Production Mode
Starts the server normally:
```bash
npm run start
```
The server will bind to the configured port (default: `5000`).

### Option B: Docker Containerization

You can run the backend and database inside Docker containers.

#### 1. Setup Environment
Ensure your `.env` contains the required keys (e.g., `LLM_WORKERS_CONFIG`, Auth0 configurations). These will be injected into the container by Docker Compose.

#### 2. Start Services
From the **root workspace directory**, run:
```bash
docker compose up --build
```
This spins up:
- A MongoDB instance at `localhost:27017`
- The backend API service at `localhost:5000`

#### 3. Database Seeding (Optional)
To seed the database inside the container with developer/mock data:
```bash
docker exec -it gencourse-backend npm run seed
```

---

## API Reference

### 🔐 Authentication Endpoints

* **`GET /auth/login`**: Initiates the Auth0 redirection handshake.
* **`GET /auth/logout`**: Clears the backend session cookie and logs out of the Auth0 SSO session.
* **`GET /auth/callback`**: Internal endpoint for Auth0 authentication callback processing.
* **`GET /api/auth/me`**: Fetches the currently authenticated user session. Requires authentication.

### 📚 Course Management

* **`GET /api/courses`**: Returns all courses created by/enrolled under the logged-in user. Requires authentication.
* **`POST /api/courses`**: Initializes a new course shell with a title. Returns a `courseId`. Requires authentication.
* **`DELETE /api/courses/:id`**: Deletes the specified course, its modules, lessons, and pulls user references. **Restricted to Instructors and Admins**.
* **`GET /api/courses/:id/stream`**: Establishes a Server-Sent Events (SSE) connection that compiles the syllabus outline and streams detailed chapters one-by-one.

### 🤖 AI Tutor assistant

* **`POST /api/tutor/chat`**: Receives messages from the tutor sidebar. Accepts optional `courseId` and `lessonId` parameters to provide context-aware feedback referencing textbook materials. Requires authentication.
