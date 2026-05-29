# GenCourse AI - Frontend Landing Page

This is the futuristic, interactive SaaS landing page and simulation playground for **GenCourse AI**, built with **React**, **TypeScript**, **Tailwind CSS v4**, and **Vite**.

## 🚀 Live Demo Workspace

The application is hosted locally. You can spin up the workspace and preview the AI agent pipeline immediately:
- **Local URL:** [http://localhost:5173/](http://localhost:5173/)

---

## 🛠️ Technology Stack

* **Core Framework:** React 19 + TypeScript
* **Styling Engine:** Tailwind CSS v4 (using the `@tailwindcss/vite` plugin for native CSS configuration and lightning-fast builds)
* **Icons:** Lucide React
* **Build System:** Vite 8

---

## 🎨 Key Features & Components

### 1. Interactive Course Generator Simulator
Typing a topic (e.g. *Intro to React Hooks*) and triggering "Generate" launches a mock pipeline simulation in the workspace.
- **Workflow Checklist:** Monitors live generation milestones from analysis to final translation.
- **System Telemetry Logs:** Prints step-by-step agent activities in an animated terminal shell.
- **Lesson Reader:** Shows full formatted study text with highlights and code blocks.
- **Video Script Renderer:** Displays generated slide structures alongside voiceover transcripts and an active audio waveform visualizer.
- **Downloads Module:** Simulates exporting worksheets and cheat sheets.
- **Multilingual localization:** Toggles UI curriculum views instantly between English, Spanish, and French.

### 2. The 6-Step Pipeline Visualizer
Detailed step-by-step visual map representing the course compiler:
1. **Topic Analyzer:** Parses prompts, identifies conceptual boundaries, and drafts target audience profiles.
2. **Curriculum Planner:** Formulates module outlines and plans dependencies.
3. **Lesson Generator:** Drafts in-depth textbook chapters, examples, and video slide narration sheets.
4. **Quiz Builder:** Automatically constructs knowledge review assessments.
5. **Assessment Engine:** Sets grading metrics and compiles standard examinations.
6. **Publishing Layer:** Renders the localized student portals and outputs offline PDF packages.

---

## 💻 Local Development Setup

To run the application locally, make sure you have [Node.js](https://nodejs.org/) installed, then follow these steps:

### 1. Install Dependencies
```bash
# Navigate to the frontend directory if you aren't already there
cd frontend

# Install packages
npm install
```

### 2. Spin Up Local Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 3. Build for Production
To package the app for production deployment:
```bash
npm run build
```
This generates optimized static files inside the `dist/` directory.
