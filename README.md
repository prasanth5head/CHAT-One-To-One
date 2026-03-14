# SecureChat – Quantum Neural Network (PWA)

SecureChat is a production-grade, end-to-end encrypted (E2EE) real-time messaging Progressive Web App. It features a unified codebase for web and mobile, premium glassmorphic aesthetics, and military-grade security protocols.

## 🚀 Key Features
- **End-to-End Encryption (E2EE)**: Client-side RSA-2048 (Key Exchange) + AES-2048-GCM (Payload).
- **Quantum UI**: Premium 'Neural' dark theme with glassmorphism and mobile-responsive drawer.
- **Progressive Web App (PWA)**: Installable on Android, iOS, and Desktop with offline caching.
- **Real-Time Synergy**: Low-latency messaging, typing indicators, and presence tracking via STOMP WebSockets.
- **Tactical Media**: Encrypted transfers for Images, PDFs, Voice Notes, and Documents.
- **Visual Privacy**: Automatic message scrambling with "Quantum Peek" functionality.

## 🏗️ Architecture Stack
- **Frontend**: React (Vite) + Material UI (MUI) + `node-forge` (Crypto)
- **Backend**: Java 17 + Spring Boot 3 + Spring Security (JWT)
- **Database**: MongoDB (Atlas)
- **Storage**: Cloudinary (Encrypted Media)

## 🛠️ Local Development

### 1. Backend Setup
1. Ensure JDK 17 and MongoDB are installed.
2. Configure credentials in `backend/src/main/resources/application.properties`.
3. Run:
   ```bash
   cd backend
   mvn clean spring-boot:run
   ```

### 2. Frontend Setup
1. Ensure Node.js 18+ is installed.
2. Run:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🌐 Production Deployment (Render)

### Backend (Web Service)
- **Runtime**: Docker
- **Build Command**: `mvn clean install -DskipTests`
- **Start Command**: `java -jar target/backend-0.0.1-SNAPSHOT.jar`
- **Envars**: `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_URL`, `CORS_ORIGINS`.

### Frontend (Static Site)
- **Build Command**: `cd frontend && npm install && npm run build`
- **Publish Directory**: `frontend/dist`
- **Envars**: `VITE_API_URL`, `VITE_WS_URL`.

---
*Identity verified. Neural link active.*
