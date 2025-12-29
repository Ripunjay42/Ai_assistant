# Query Quill - AI-Powered Document Q&A System

A full-stack RAG (Retrieval-Augmented Generation) application that enables users to upload documents and interact with them through an intelligent chat interface powered by Google's Gemini AI.

![Tech Stack](https://img.shields.io/badge/Stack-PERN-blue)
![AI](https://img.shields.io/badge/AI-Gemini-orange)
![Vector DB](https://img.shields.io/badge/Vector-Qdrant-green)

## 🚀 Features

- **Document Upload & Processing**: Upload PDF, TXT, MD, and JSON files (up to 10MB)
- **AI-Powered Chat**: Ask questions about your documents using natural language
- **Real-time Streaming**: Get responses streamed in real-time using Server-Sent Events (SSE)
- **Smart Caching**: Redis-based caching for embeddings and RAG answers
- **User Isolation**: Complete data isolation per user with workspace support
- **Live Status Updates**: Real-time document processing status with polling mechanism
- **Vector Search**: Semantic search using Qdrant vector database
- **Background Processing**: Asynchronous document ingestion using RabbitMQ

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │────────▶│   Backend    │────────▶│   Worker    │
│   (React)   │         │  (Express)   │         │   Process   │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                        │
      │                        │                        │
      ▼                        ▼                        ▼
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│ localStorage│         │  PostgreSQL  │         │   Qdrant    │
│   Zustand   │         │    Redis     │         │  Gemini AI  │
└─────────────┘         │   RabbitMQ   │         │     S3      │
                        │      S3      │         └─────────────┘
                        └──────────────┘
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Zustand** - State management with persistence
- **TailwindCSS v4** - Styling with custom design system
- **Lucide React** - Icon library
- **React Router** - Client-side routing

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Sequelize** - PostgreSQL ORM
- **JSON Web Tokens** - Authentication
- **Multer** - File upload handling

### Databases & Storage
- **PostgreSQL (Aiven)** - Primary relational database
- **Redis (Redis Cloud)** - Caching and rate limiting
- **Qdrant** - Vector database for embeddings (768 dimensions)
- **AWS S3** - Document file storage

### Message Queue
- **RabbitMQ (CloudAMQP)** - Asynchronous document processing queue

### AI Services
- **Google Gemini AI**
  - `text-embedding-004` - 768-dimensional embeddings
  - `gemini-2.5-flash` - Chat and text generation

### DevOps
- **Render** - Backend deployment
- **Vercel** - Frontend deployment

## 📊 Database Design

### Entity Relationship Diagram

```
┌──────────────┐       ┌────────────────────┐       ┌──────────────┐
│    Users     │       │ WorkspaceMembers   │       │  Workspaces  │
├──────────────┤       ├────────────────────┤       ├──────────────┤
│ id (PK)      │───┐   │ id (PK)            │   ┌───│ id (PK)      │
│ name         │   └──▶│ userId (FK)        │   │   │ name         │
│ email        │       │ workspaceId (FK)   │◀──┘   │ createdAt    │
│ password     │       │ role (ENUM)        │       │ updatedAt    │
│ workspaceId  │       │ createdAt          │       └──────────────┘
│ createdAt    │       │ updatedAt          │
│ updatedAt    │       └────────────────────┘
└──────────────┘                │
                                │
                                ▼
                      ┌──────────────────┐
                      │    Documents     │
                      ├──────────────────┤
                      │ id (PK)          │
                      │ name             │
                      │ url              │
                      │ s3Key            │
                      │ workspaceId (FK) │
                      │ status (ENUM)    │
                      │ createdAt        │
                      │ updatedAt        │
                      └──────────────────┘
```

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  workspace_id UUID REFERENCES workspaces(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Workspaces Table
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Workspace Members Table
```sql
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  role ENUM('OWNER', 'MEMBER') DEFAULT 'MEMBER',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Documents Table
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  s3_key VARCHAR(500),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  status ENUM('UPLOADED', 'PROCESSING', 'READY', 'FAILED') DEFAULT 'UPLOADED',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Qdrant Vector Schema

```javascript
{
  collection: "documents",
  vectors: {
    size: 768,           // text-embedding-004 dimensions
    distance: "Cosine"   // Similarity metric
  },
  payload: {
    documentId: "uuid",
    workspaceId: "uuid",
    chunkIndex: number,
    text: "string"
  },
  indexes: [
    "workspaceId",       // For workspace filtering
    "documentId"         // For document deletion
  ]
}
```

### Redis Cache Structure

```javascript
// Embeddings Cache (7 days TTL)
`embedding:${md5(text)}` → JSON(embedding_vector)

// RAG Answer Cache (5 minutes TTL)
`rag:${workspaceId}:${md5(question)}` → JSON(answer)

// Chat Memory (30 minutes TTL, max 10 messages)
`chat:${chatId}:messages` → List<JSON(message)>

// Rate Limiting (1 hour window, 20 requests max)
`rate:${userId}` → count
```

## 🔄 System Flow

### 1. Document Upload Flow

```
User uploads file
       ↓
Frontend validates (type, size)
       ↓
POST /api/documents/upload
       ↓
Backend checks authentication
       ↓
Check workspace permissions
       ↓
Check for duplicate files
       ↓
Upload to S3 (documents/{workspaceId}/{uuid}-{filename})
       ↓
Create document record (status: UPLOADED)
       ↓
Publish to RabbitMQ queue
       ↓
Return document metadata to frontend
```

### 2. Document Processing Flow (Worker)

```
Worker consumes RabbitMQ message
       ↓
Update status to PROCESSING
       ↓
Download file from S3
       ↓
Extract text (PDF parser or UTF-8)
       ↓
Chunk text (500 chars, 50 char overlap)
       ↓
Generate embeddings (Gemini text-embedding-004)
       ↓
Store vectors in Qdrant with metadata
       ↓
Update status to READY
       ↓
ACK RabbitMQ message
```

### 3. Chat Query Flow

```
User sends question
       ↓
POST /api/chat/stream
       ↓
Check authentication & rate limit
       ↓
Check RAG cache (Redis)
       ↓
If cached → Return cached answer
       ↓
If not cached:
  ├─ Load chat memory (last 10 messages)
  ├─ Generate question embedding
  ├─ Vector search in Qdrant (top 5 chunks)
  ├─ Build context from chunks
  ├─ Create prompt with context + history
  ├─ Stream from Gemini AI
  ├─ Cache answer
  └─ Save to chat memory
       ↓
Stream response to frontend (SSE)
```

### 4. Document Deletion Flow

```
User clicks delete
       ↓
DELETE /api/documents/:id
       ↓
Check authentication & ownership
       ↓
Delete from S3
       ↓
Delete vectors from Qdrant (by documentId)
       ↓
Delete database record
       ↓
Return success
       ↓
Frontend removes from UI
```

## 🔐 Authentication & Security

- **JWT-based authentication** with Bearer tokens
- **Rate limiting**: 20 requests per hour per user (Redis-backed)
- **Workspace isolation**: Users can only access their workspace documents
- **SSL/TLS**: All cloud services use encrypted connections
- **Environment variables**: Sensitive credentials stored securely
- **CORS**: Configured for specific origins only

## 📁 Project Structure

```
ai-assistant/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Redis, S3, Qdrant, RabbitMQ configs
│   │   ├── controllers/     # Route handlers
│   │   ├── middlewares/     # Auth, error handling, rate limiting
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic (RAG, embeddings, caching)
│   │   ├── utils/           # Helper functions (JWT, password, retry)
│   │   ├── worker/          # Background job processors
│   │   │   ├── consumers/   # RabbitMQ consumers
│   │   │   └── services/    # Worker services (chunking, embeddings, S3)
│   │   ├── scripts/         # Database and Qdrant setup scripts
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Server entry point
│   ├── migrations/          # Database migrations
│   ├── .env                 # Environment variables
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── auth/        # Login/Signup modal
    │   │   ├── chat/        # Chat window, input, message bubbles
    │   │   ├── documents/   # Document upload component
    │   │   ├── layout/      # Navbar, Sidebar
    │   │   └── ui/          # Reusable UI components
    │   ├── pages/           # Main pages (Chat)
    │   ├── services/        # API client
    │   ├── store/           # Zustand stores (auth, chat, documents, UI)
    │   ├── lib/             # Utilities
    │   ├── App.jsx          # App entry point
    │   └── main.jsx         # React DOM root
    ├── public/              # Static assets
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or Aiven)
- Redis instance (local or Redis Cloud)
- Qdrant instance (local or cloud)
- AWS S3 bucket
- RabbitMQ instance (local or CloudAMQP)
- Google Gemini API key

### Backend Setup

1. **Clone and install dependencies**
```bash
cd backend
npm install
```

2. **Configure environment variables**
```bash
# Create .env file with:
PORT=5000
NODE_ENV=development

# PostgreSQL (Aiven)
DB_HOST=your-pg-host
DB_PORT=10546
DB_NAME=defaultdb
DB_USER=avnadmin
DB_PASSWORD=your-password
DB_CA_CERT="-----BEGIN CERTIFICATE-----..."

# Redis Cloud
REDIS_HOST=your-redis-host
REDIS_PORT=16379
REDIS_USERNAME=default
REDIS_PASSWORD=your-password

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name

# Qdrant
QDRANT_URL=https://your-qdrant-url
QDRANT_API_KEY=your-api-key

# RabbitMQ (CloudAMQP)
RABBITMQ_URL=amqps://user:pass@host/vhost

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# JWT
JWT_SECRET=your-jwt-secret
```

3. **Run database migrations**
```bash
npx sequelize-cli db:migrate --config sequelize.config.cjs
```

4. **Create Qdrant collection**
```bash
node src/scripts/create-qdrant-collection.js
```

5. **Start the backend server**
```bash
npm run dev
```

6. **Start the worker process** (in a new terminal)
```bash
npm run worker
```

### Frontend Setup

1. **Install dependencies**
```bash
cd frontend
npm install
```

2. **Update API endpoint** (in `src/services/api.js`)
```javascript
const API_BASE_URL = "http://localhost:5000/api";
```

3. **Start development server**
```bash
npm run dev
```

4. **Access the application**
```
http://localhost:5173
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Documents
- `POST /api/documents/upload` - Upload document (multipart/form-data)
- `GET /api/documents?workspaceId={id}` - List workspace documents
- `DELETE /api/documents/:id` - Delete document

### Chat
- `POST /api/chat/query` - Ask question (JSON response)
- `POST /api/chat/stream` - Ask question (SSE streaming)

### Health
- `GET /api/health` - Health check

## 🎨 UI Features

- **Dark theme** with cyan accent colors
- **Animated grid background** with flowing effect
- **Collision beam animations** for visual appeal
- **Real-time status indicators** for document processing
- **Smooth scrolling** with hidden scrollbars
- **Responsive design** for mobile and desktop
- **Toast notifications** for user feedback

## 🔧 Configuration

### Rate Limiting
```javascript
MAX_REQ = 20           // Requests per window
WINDOW = 60 * 60       // 1 hour in seconds
```

### Chat Memory
```javascript
MAX_MESSAGES = 10      // Messages to keep in memory
TTL = 60 * 30          // 30 minutes
```

### RAG Cache
```javascript
TTL = 60 * 5           // 5 minutes
```

### Text Chunking
```javascript
chunkSize = 500        // Characters per chunk
overlap = 50           // Overlap between chunks
```

## 🚀 Deployment

### Backend (Render)
1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `cd backend && npm install`
4. Set start command: `node src/server.js`
5. Add environment variables
6. Create background worker service for `npm run worker`

### Frontend (Vercel)
1. Import project from GitHub
2. Set root directory to `frontend`
3. Framework preset: Vite
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy

## Author

**Ripunjay Choudhury**
- GitHub: [@Ripunjay42](https://github.com/Ripunjay42)

## Acknowledgments

- Google Gemini AI for embeddings and chat
- Qdrant for vector search capabilities
- Aiven for managed PostgreSQL
- Redis Cloud for caching infrastructure
- CloudAMQP for managed RabbitMQ
- Render & Vercel for deployment

---
