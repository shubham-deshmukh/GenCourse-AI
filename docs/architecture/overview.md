# System Architecture & Workflow Documentation

This document describes the high-level architecture, subsystem boundaries, and sequential process execution flows of GenCourse AI.

---

## 🏛️ System Architecture Overview

GenCourse AI is built on a decoupled, asynchronous multi-tier architecture consisting of three main subsystems:

```mermaid
graph TD
  Client[Vite + React Frontend] <-->|HTTP Rest / SSE Stream| Server[Express.js Backend API]
  Server <-->|Mongoose ODM| Database[(MongoDB Database)]
  Server <-->|Decoupled Job Queue| Scheduler[Lesson Scheduler & Throttler]
  Scheduler <-->|Parallel Task Threads| Workers[LLM Worker Pool: Gemini / Cerebras]
```

### 1. Client Layer (Vite + React)
*   State management orchestrated via lightweight, single-directional **Zustand** stores (`useAuthStore`, `useGenerationStore`).
*   Negotiates backend authentication implicitly through secure OIDC redirections and reads telemetry progress streams via `EventSource` listeners.

### 2. Backend API Layer (Express.js)
*   Exposes endpoints for user profile access, library updates, and tutor panels.
*   Enforces secure HttpOnly session authorization states to mitigate cookie/token hijacking.
*   Acts as the central orchestrator for background compiling pipelines.

### 3. Worker Engine Pool (LLM Scheduler)
*   Manages a decoupled, multi-worker concurrency queue.
*   Distributes tasks based on concurrent worker capacity parameters defined in `LLM_WORKERS_CONFIG`.
*   Includes rate-limiting cooldown throttles and fallback switches to route requests to alternate endpoints during failures.

---

## 🔄 Sequence Workflow: Course Generation Pipeline

The diagram below outlines the sequence from initial prompt submission on the frontend to full multi-lingual textbook completion:

```mermaid
sequenceDiagram
  autonumber
  participant User as Student Client
  participant Server as Express API
  participant DB as MongoDB
  participant Queue as Job Queue
  participant Worker as LLM Worker

  User->>Server: POST /api/courses { title: "React Hooks" }
  Note over Server: Check authentication &<br/>sanitize input bounds
  Server->>DB: Save Shell Course (Status: "lessons_generating")
  Server->>Queue: Enqueue Course Outline Job
  Server-->>User: 2022 Accepted { courseId }
  
  User->>Server: Establish SSE Connection (GET /stream)
  Server->>Queue: Listen for Event Broadcasts
  
  critical Compile Course Outline
    Queue->>Worker: Run Outline Task
    Worker->>Worker: Call LLM API (Prompt + Template)
    Worker-->>Queue: Syllabus Outline JSON compiled
  end

  Queue->>DB: Save Course Outline Modules
  Queue->>Server: Emit "outline" event
  Server-->>User: Stream SSE outline packet

  loop For Each Lesson in Syllabus
    Queue->>Worker: Enqueue Lesson Details Task
    Worker->>Worker: Call LLM API (Translate + Sanitize)
    Worker-->>Queue: Complete Lesson textbook, Slide, & Script
    Queue->>DB: Save Lesson details document
    Queue->>Server: Emit "lesson" and "progress" updates
    Server-->>User: Stream SSE lesson content & progress percent
  end

  Queue->>DB: Update status to "completed"
  Queue-->>Server: Finalize course job
  Server-->>User: Stream SSE close connection
```

---

## 🤖 Sequence Workflow: Context-Aware AI Tutor Chat

The AI Tutor compiles course outlines, reading material context, and chat history before prompting the LLM worker, guaranteeing context-aware answers:

```mermaid
flowchart TD
  A[User sends question] --> B[POST /api/tutor/chat]
  B --> C{Contains courseId/lessonId?}
  
  C -->|Yes| D[Load Course Syllabus Outline from DB]
  D --> E[Load Active Lesson Textbook content from DB]
  E --> F[Load last 5 messages in conversation thread]
  F --> G[Compile System Prompt Context]
  
  C -->|No| H[Load General Assistant System Prompt]
  H --> G
  
  G --> I[Forward prompt to LLM Worker]
  I --> J[Stream Markdown response back to client]
```
