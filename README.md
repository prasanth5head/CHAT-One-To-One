# SecureChat - End-to-End Encrypted Messaging App

SecureChat is a modern, responsive, end-to-end encrypted chat application comparable to Telegram or WhatsApp, featuring real-time communication via WebSockets, file sharing, and robust security practices.

## 🌟 Features
- **End-to-End Encryption (E2EE)**: RSA (2048-bit) for key exchange and AES-256-GCM for message encryption. Keys are generated client-side and private keys are never transmitted to the server.
- **Real-Time Messaging**: Real-time message delivery and typing indicators via STOMP over WebSockets.
- **Modern Responsive UI**: Built with React, TailwindCSS, and Lucide icons, offering seamless dark/light modes and dynamic animations.
- **Authentication**: Stateless JWT authentication combined with Google OAuth 2.0.
- **Multimedia Support**: Integration with Cloudinary for handling media uploads, fully encrypted prior to upload.

## 🏗️ Architecture Stack
### Frontend
- React (Vite)
- Tailwind CSS
- `node-forge` for cryptographic operations
- `@stomp/stompjs` & `sockjs-client` for real-time WebSocket connection
- `axios` for REST API consumption

### Backend
- Java 17 + Spring Boot 3
- Spring Security (JWT filter chain)
- Spring WebSocket (STOMP message broker)
- Spring Data MongoDB

### Infrastructure
- Database: MongoDB (Atlas)
- Cache: Redis (optional, future use for pub/sub scaling)
- Storage: Cloudinary (Images/Files)

## 🗄️ Database Schemas (MongoDB)
**Users Collection:** `_id`, `name`, `email`, `avatar`, `publicKey`, `createdAt`
**Chats Collection:** `_id`, `participants[]`, `isGroup`, `groupName`, `lastMessage`, `updatedAt`, `createdAt`
**Messages Collection:** `_id`, `chatId`, `senderId`, `encryptedMessage`, `encryptedKeys{}`, `mediaUrl`, `messageType`, `status`, `timestamp`

## 🔒 End-to-End Encryption Workflow
1. User logs in via Google and device automatically generates an RSA 2048 key pair. 
2. The Public Key is sent to the server. The Private Key is kept locked securely on the local device (`localStorage` for web clients).
3. To send a message, the client generates a unique 256-bit AES key.
4. The message text/media is encrypted with this AES key.
5. The AES key is itself encrypted using the recipient's public key (RSA-OAEP).
6. The backend receives only the AES-encrypted message and the RSA-encrypted AES key, completely incapable of reading either.
7. Upon receiving via WebSocket, the recipient uses their private key to decrypt the AES key, which is then used to decipher the message payload.

## 🚀 Deployment Guide (Render)

### 1. Database & External Services
- **MongoDB Atlas**: Create a free tier cluster. Capture the URI connection string.
- **Cloudinary**: Create an account and capture `Cloud Name`, `API Key`, and `API Secret`.
- **Google Cloud Console**: Set up OAuth 2.0 Credentials (Client ID).

### 2. Deploying the Backend (Web Service)
1. In Render, select **New + -> Web Service -> Connect GitHub Repository**.
2. Select your repository containing the `backend` folder.
3. **Environment**: `Java`
4. **Build Command**: `cd backend && ./mvnw clean package -DskipTests` (you must add the Maven wrapper to your project, or change env to Docker and use a multi-stage `Dockerfile`).
5. **Start Command**: `java -jar backend/target/backend-0.0.1-SNAPSHOT.jar`
6. Add the following Environment Variables in the Render dashboard:
   - `MONGODB_URI`: Your Atlas URI
   - `CLOUDINARY_CLOUD_NAME`: Cloudinary Name
   - `CLOUDINARY_API_KEY`: Cloudinary Key
   - `CLOUDINARY_API_SECRET`: Cloudinary Secret
   - `JWT_SECRET`: A sturdy, 64+ character random hex string.
   - `JWT_EXPIRATION`: `86400000` (1 day in ms)
   - `CORS_ORIGINS`: Your frontend URL

### 3. Deploying the Frontend (Static Site)
1. In Render, select **New + -> Static Site -> Connect GitHub Repository**.
2. **Build Command**: `cd frontend && npm install && npm run build`
3. **Publish Directory**: `frontend/dist`
4. Add the following Environment Variables:
   - `VITE_API_URL`: URL of your backend + `/api` (e.g., `https://my-backend.onrender.com/api`)
   - `VITE_WS_URL`: URL of your backend + `/ws` (e.g., `https://my-backend.onrender.com/ws`)
5. Deploy and enjoy end-to-end secure communication!
