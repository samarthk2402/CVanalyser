## Plan: CV Analyzer for Degree Apprenticeships

TL;DR: Build a secure React app with Supabase authentication and storage, add a FastAPI backend that extracts text from uploaded CVs, sends the content to a locally hosted Llama 3 model via Ollama, and stores analysis results in Supabase. The first release should focus on CV upload, structured suitability analysis for degree apprenticeships, and a simple history dashboard for students.

**Steps**
1. Define the core data model in Supabase: users remain on Supabase Auth, with tables for cv_submissions, analysis_results; create a storage bucket for uploaded CVs and set row-level security policies for owner-only access.
2. Create the Python backend service with FastAPI endpoints for health checks, CV analysis, and status polling; use libraries such as pypdf or python-docx to extract text, then call an open-source Llama 3 model through Ollama or a similar local HTTP API with a strict JSON response schema.
3. Implement the frontend flow in the existing React app: extend the protected home page to support upload, show progress states, call the analysis endpoint, and render a results dashboard with strengths, gaps.
4. Integrate the two systems: the frontend uploads the CV to Supabase Storage, stores a record in the database, then calls the backend using a signed URL or file reference; the backend writes the final analysis back to Supabase and marks the submission status as complete.
5. Add user experience improvements such as drag-and-drop upload, file type validation, duplicate submission handling, and clear error states for failed OCR or model availability.

**Relevant files**
- [app/src/App.jsx](app/src/App.jsx) — existing route structure to protect the main analyzer workflow.
- [app/src/pages/Home.jsx](app/src/pages/Home.jsx) — main dashboard area to replace the placeholder with upload and results UI.
- [app/src/pages/Login.jsx](app/src/pages/Login.jsx) and [app/src/pages/Register.jsx](app/src/pages/Register.jsx) — authentication pages to preserve and reuse.
- [app/src/components/ProtectedRoute.jsx](app/src/components/ProtectedRoute.jsx) — auth guard for analyzer routes.
- [app/src/supabase.js](app/src/supabase.js) — Supabase client setup to reuse for auth, storage, and database calls.
- The new backend service folder (FastAPI app) — to contain the analysis endpoints, prompt logic, file parsing, and model integration.

**Verification**
1. Verify the frontend with a production build using the existing Vite setup and confirm the protected route flow still redirects unauthenticated users correctly.
2. Verify the backend with local smoke tests for /health and /analyze using sample CV PDFs and confirm the response schema matches the expected JSON fields.
3. Verify the end-to-end flow by uploading a sample CV through the UI, confirming the file lands in Supabase Storage, the analysis completes, and the result is visible in the dashboard.

**Decisions**
- Use Supabase Auth for all user login and identity, Supabase Storage for file persistence, and Supabase tables for submission metadata.
- Use FastAPI as the analysis worker and connect it to Llama 3 through Ollama so the model stays local/open-source while keeping the frontend simple.
- Keep the first version focused on one CV analysis workflow and apprenticeship suitability feedback, excluding direct employer applications or advanced career coaching features.

**Further Considerations**
1. Decide whether the backend should fetch uploaded files directly from Supabase Storage using signed URLs or receive the file blob from the frontend for a simpler first implementation.
2. Decide whether the initial model should be a lightweight local Llama 3 variant or a slightly larger model if the hardware budget allows better analysis quality.
