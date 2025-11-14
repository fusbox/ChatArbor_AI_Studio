
# Job Connections AI Assistant

## 1. Overview

The Job Connections AI Assistant is a sophisticated, RAG (Retrieval-Augmented Generation) powered conversational chatbot designed to assist job seekers. It provides users with accurate, context-aware answers to their questions by drawing from a managed knowledge base.

The application features a user-friendly chat interface and a comprehensive admin panel for full control over the AI's knowledge, behavior, and for monitoring user interactions.

### Key Features:

*   **Conversational AI:** A dynamic chat interface powered by the Google Gemini API for natural and helpful conversations.
*   **Retrieval-Augmented Generation (RAG):** The AI's responses are grounded in a curated knowledge base, ensuring answers are relevant and accurate.
*   **Comprehensive Admin Panel:**
    *   **Knowledge Base Management:** Add, edit, and delete knowledge sources from text, URLs, or file uploads (.txt, .md, .pdf, .docx).
    *   **Greeting Management:** Customize and control the AI's initial greeting messages.
    *   **System Prompt Control:** Define the AI's core persona, instructions, and constraints.
    *   **Chat Log Viewer:** Review past conversations to understand user interactions.
    *   **User Feedback Analysis:** View and analyze detailed feedback submitted by users to improve AI performance.
*   **User Authentication:** Supports both guest users (with session-based history) and registered users (with persistent chat history).
*   **Persistent Memory:** Logged-in users' chat histories are saved, allowing conversations to be picked up later.

## 2. Tech Stack

*   **Frontend:** React, TypeScript, Tailwind CSS
*   **AI Model:** Google Gemini API (`@google/genai`)
*   **Backend (Current):** A mock API service (`mockApiService.ts`) using Browser Local Storage to simulate a database and backend logic. **This must be replaced for production.**

## 3. Project Structure

The project is organized into a logical structure to separate concerns and improve maintainability:

```
/
├── components/           # Reusable React components
│   ├── admin/            # Components for the Admin Dashboard
│   ├── auth/             # Sign-in/Sign-up modal component
│   ├── chat/             # Components for the Chat interface
│   └── shared/           # Common components (Header, Spinner, etc.)
├── constants.ts          # Application-wide constants
├── contexts/             # React Context providers (e.g., AuthContext)
├── hooks/                # Custom React hooks (e.g., useChat)
├── services/             # API communication and external service logic
│   ├── apiService.ts     # Frontend service to call the backend (currently points to mock)
│   ├── mockApiService.ts # Mock backend using Local Storage (FOR DEVELOPMENT ONLY)
│   └── geminiService.ts  # Logic related to embedding generation
├── types.ts              # TypeScript type definitions and interfaces
├── App.tsx               # Main application component and routing
├── index.html            # Main HTML entry point
└── index.tsx             # React application root
```

---

## 4. Production Implementation Guide

The current application runs entirely in the browser with a mock backend. To make it production-ready, you must build a real backend service to handle business logic, security, and data persistence securely.

### Step 1: Set Up a Backend Server

First, choose a backend framework. A Node.js-based solution is a natural fit for a React frontend.

*   **Recommended:** **Next.js (API Routes)** or **Express.js**.
    *   **Next.js:** If you plan to migrate the entire app to Next.js for features like Server-Side Rendering (SSR), its built-in API routes are a perfect choice.
    *   **Express.js:** A robust, minimalist framework ideal for creating a standalone API server that the React client can communicate with.

The backend server will be responsible for:
1.  **Securing API Keys:** Your Gemini API key should **never** be exposed on the frontend. The backend will make all calls to the Gemini API.
2.  **Managing Database Connections:** Interacting with your chosen databases.
3.  **Authentication:** Handling user sign-up, login, and session management.
4.  **Business Logic:** Processing file uploads, scraping URLs, etc.

### Step 2: Implement API Endpoints

Your backend should expose REST or GraphQL endpoints that correspond to the functions in `services/apiService.ts`. The frontend will then call these endpoints instead of the mock functions.

**Required Endpoints:**

*   **Auth:** `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
*   **Knowledge Base:** `GET /api/knowledge`, `POST /api/knowledge`, `PUT /api/knowledge/:id`, `DELETE /api/knowledge/:id`, `POST /api/knowledge/re-index`, `POST /api/knowledge/scrape-url`
*   **Chat:** `POST /api/chat`, `GET /api/chat-history`, `POST /api/chat-history`
*   **Admin:** `GET /api/admin/logs`, `GET /api/admin/system-prompt`, `POST /api/admin/system-prompt`, `GET /api/admin/greetings`, `POST /api/admin/greetings`, `GET /api/admin/feedback`
*   **Feedback:** `POST /api/feedback`

### Step 3: Secure User Authentication

The current Local Storage-based authentication is insecure. Replace it with a standard, secure method.

1.  **Password Hashing:** Use a strong hashing algorithm like **bcrypt** to hash user passwords before storing them in the database. **Never store plain-text passwords.**
2.  **Session Management:** Use **JSON Web Tokens (JWT)** or session cookies to manage user login states.
    *   **JWT:** Upon successful login, the server generates a signed JWT and sends it to the client. The client stores this token and includes it in the `Authorization` header of subsequent requests.

### Step 4: Choose and Implement Databases

The mock service uses Local Storage, which is not persistent, scalable, or secure. You need to integrate real databases. This application has two distinct data storage needs: **structured application data** and **vector data** for similarity search.

#### A. Structured Data Storage

This database will store user info, chat logs, feedback, greetings, etc.

*   **Option 1: Relational Database (Recommended for this project)**
    *   **Examples:** PostgreSQL, MySQL.
    *   **Implementation:** Define a clear schema with tables for `users`, `knowledge_sources`, `chat_logs`, `messages`, `feedback`, and `greetings`. Use an ORM like **Prisma** or **TypeORM** to simplify database interactions in your Node.js backend.
    *   **Pros:** ACID compliance ensures data integrity, powerful querying with SQL, mature and reliable. Excellent for structured application data.
    *   **Cons:** Requires schema migrations if the data model changes.

*   **Option 2: NoSQL Document Database**
    *   **Examples:** MongoDB, Firestore.
    *   **Implementation:** Create collections for `users`, `knowledgeSources`, etc. Chat logs could be stored as a single document with an array of nested message objects.
    *   **Pros:** Flexible schema, scales horizontally, maps naturally to JavaScript objects.
    *   **Cons:** Can be less consistent than SQL databases; complex queries and aggregations can be more difficult.

#### B. Vector Data Storage (for RAG)

The mock service simulates vector search with a `cosineSimilarity` function. This will be too slow for a production application. A dedicated vector database is essential for fast and accurate RAG performance.

*   **Implementation Path:**
    1.  When a knowledge source is added/updated via the admin panel, your backend server receives the text.
    2.  The server calls the Gemini Embedding API (e.g., `text-embedding-004`) to convert the text into a 768-dimension vector.
    3.  The server "upserts" (inserts/updates) this vector, along with metadata (like the source ID), into your chosen vector database.
    4.  When a user sends a chat query, the backend embeds the query into a vector and queries the vector database to find the most similar content.

*   **Option 1: Use a Relational DB with Vector Capabilities (Excellent Starting Point)**
    *   **Technology:** **PostgreSQL** with the **`pgvector`** extension.
    *   **Benefits:** This is a highly practical and cost-effective approach. It keeps all your data—structured and vector—in a single, unified database, simplifying your architecture and operations.
    *   **Limitations:** For extremely large-scale applications (billions of vectors), a dedicated managed service might offer better performance, but `pgvector` is more than capable for most use cases.

*   **Option 2: Managed Vector Database Services**
    *   **Examples:** Pinecone, Weaviate, Google Vertex AI Vector Search.
    *   **Benefits:** Fully managed, highly optimized for low-latency vector search at massive scale. Easy to integrate with SDKs.
    *   **Limitations:** Adds another third-party service and associated costs to your stack.

### Step 5: Handle File Uploads

The mock service only simulates file content. Your backend needs to handle actual file uploads.

1.  **Storage:** Use a cloud storage service like **AWS S3** or **Google Cloud Storage** to store uploaded files persistently.
2.  **Parsing:** When a file is uploaded, the backend must parse its content into plain text before it can be embedded. Use libraries like:
    *   `pdf-parse` for PDFs.
    *   `mammoth.js` for DOCX files.
3.  **Workflow:**
    *   Client uploads file to a secure backend endpoint.
    *   Backend streams the file to cloud storage.
    *   Backend uses a parsing library to extract text.
    *   Backend generates an embedding from the extracted text and stores it in the vector database.
