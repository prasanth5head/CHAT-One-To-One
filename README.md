# SecureChat — Real-Time Encrypted Messenger

A full-stack real-time chat application with end-to-end encryption, built with a modern JavaScript stack.

## 🏗 Tech Stack

| Layer           | Technology                        |
|-----------------|-----------------------------------|
| **Frontend**    | React 18 + Vite + MUI            |
| **Backend**     | Node.js + Express                 |
| **Real-Time**   | Socket.IO                         |
| **Database**    | MongoDB (Mongoose ODM)            |
| **Cache**       | Redis (with in-memory fallback)   |
| **Auth**        | JWT + Google OAuth 2.0            |
| **Encryption**  | RSA-2048 + AES-256-GCM (E2EE)    |
| **Media**       | Cloudinary (CDN uploads)          |
| **PWA**         | Vite PWA Plugin + Service Worker  |
| **Deployment**  | Render (render.yaml)              |

## 📂 Project Structure

```
RealTimeChat/
├── backend_node/                # Node.js + Express API Server
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js            # MongoDB connection
│   │   │   └── redis.js         # Redis + memory fallback
│   │   ├── controllers/
│   │   │   ├── authController.js     # Google OAuth + JWT
│   │   │   ├── chatController.js     # Chat CRUD + Groups
│   │   │   ├── messageController.js  # Messages + Pagination
│   │   │   ├── userController.js     # User search + profile
│   │   │   └── mediaController.js    # Cloudinary uploads
│   │   ├── middleware/
│   │   │   └── authMiddleware.js     # JWT verification
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Chat.js
│   │   │   └── Message.js
│   │   ├── routes/
│   │   │   └── api.js           # Express router
│   │   └── index.js             # Server entry + Socket.IO
│   ├── .env                     # Environment variables
│   └── package.json
├── frontend/                    # React + Vite Frontend
│   ├── public/
│   │   ├── icon-512.png         # PWA icon
│   │   ├── manifest.json        # PWA manifest
│   │   └── sw.js                # Service worker
│   ├── src/
│   │   ├── components/
│   │   │   ├── BackgroundVideo.jsx
│   │   │   └── InstallPWA.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  # Auth state + JWT
│   │   │   └── ChatContext.jsx  # Chat state + Socket.IO
│   │   ├── pages/
│   │   │   ├── Welcome.jsx      # Landing page
│   │   │   ├── Login.jsx        # Google OAuth login
│   │   │   ├── Register.jsx     # Registration
│   │   │   └── ChatPage.jsx     # Main chat UI
│   │   ├── services/
│   │   │   ├── api.js           # Axios HTTP client
│   │   │   ├── socket.js        # Socket.IO client
│   │   │   └── notification.js  # Browser notifications
│   │   ├── utils/
│   │   │   └── encryption.js    # RSA + AES encryption
│   │   ├── theme.js             # MUI dark theme
│   │   ├── index.css            # Global styles
│   │   ├── App.jsx              # Routes + providers
│   │   └── main.jsx             # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── render.yaml                  # Deployment config
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18
- **MongoDB** (local or Atlas)
- **Redis** (optional — falls back to in-memory)
- **Google Cloud Console** project with OAuth 2.0 credentials

### 1. Backend Setup

```bash
cd backend_node
npm install
```

Create `.env` (already provided with defaults):

```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/securechat
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
CORS_ORIGINS=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-client-id
REDIS_URL=redis://localhost:6379
```

Start the server:

```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` in the frontend folder:

```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

Start the dev server:

```bash
npm run dev
```

### 3. Open the App

Navigate to `http://localhost:5173` in your browser.

## 🔐 Security Features

- **End-to-End Encryption**: All messages are encrypted client-side using RSA-2048 + AES-256-GCM
- **Zero-Knowledge Architecture**: Private keys never leave the user's device
- **JWT Authentication**: Stateless auth with auto-refresh
- **Helmet.js**: HTTP security headers
- **Rate Limiting**: API protection against abuse
- **CORS**: Whitelisted origins only

## 📡 Real-Time Features

- **Instant messaging** via Socket.IO WebSockets
- **Presence tracking** (online/offline)
- **Typing indicators** and voice recording status
- **Read receipts** (sent → delivered → read)
- **Emoji reactions** on messages
- **Multi-device support** (multiple sockets per user)

## 🎨 Frontend Features

- **Progressive Web App** — installable, offline-capable
- **Material UI** dark cyberpunk theme
- **Responsive design** — mobile-first with drawer sidebar
- **Media uploads** — images, files, voice messages
- **Group chats** with member management
- **Visual encryption** — messages auto-encrypt after 30s
- **Chat wallpapers** — customizable per chat

## 📬 API Endpoints

| Method | Endpoint                      | Description              |
|--------|-------------------------------|--------------------------|
| POST   | `/api/auth/google`            | Google OAuth login       |
| POST   | `/api/auth/test`              | Test account login       |
| GET    | `/api/auth/me`                | Get current user         |
| GET    | `/api/users/search?email=`    | Search users             |
| GET    | `/api/users/:id`              | Get user by ID           |
| PUT    | `/api/users/profile`          | Update profile           |
| GET    | `/api/chats`                  | Get user's chats         |
| POST   | `/api/chats/:userId`          | Create/get direct chat   |
| DELETE | `/api/chats/:chatId`          | Delete chat              |
| POST   | `/api/groups/create`          | Create group chat        |
| GET    | `/api/messages/:chatId`       | Get messages (paginated) |
| DELETE | `/api/messages/:messageId`    | Delete message           |
| POST   | `/api/messages/:chatId/read`  | Mark as read             |
| POST   | `/api/media/upload`           | Upload media file        |

## 🔌 Socket.IO Events

| Event            | Direction      | Description                |
|------------------|----------------|----------------------------|
| `authenticate`   | Client → Server | Auth with userId           |
| `joinChat`       | Client → Server | Join a chat room           |
| `sendMessage`    | Client → Server | Send encrypted message     |
| `receiveMessage` | Server → Client | Receive new message        |
| `activity`       | Bidirectional   | Typing/recording status    |
| `reaction`       | Bidirectional   | Emoji reaction on message  |
| `presence`       | Server → Client | User online/offline        |
| `messagesRead`   | Server → Client | Read receipt notification  |
| `markRead`       | Client → Server | Mark messages as read      |
