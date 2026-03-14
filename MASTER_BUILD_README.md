# SecureChat Mobile & Backend - Build Documentation

## Overview
This builds a production-grade secure messaging platform with E2EE, real-time sync, and a premium dark UI.

## Technology Stack
- **Frontend**: React Native
- **Backend**: Spring Boot (Java 17)
- **Database**: MongoDB
- **Real-time**: STOMP over WebSockets
- **Encryption**: RSA + AES (via node-forge)

## Backend Setup (Spring Boot)
1. **Prerequisites**: JDK 17, Maven, MongoDB.
2. **Environment Variables** (application.properties):
   - `spring.data.mongodb.uri=mongodb://localhost:27017/securechat`
   - `cloudinary.url=your_cloudinary_url`
3. **Start Commands**:
   ```bash
   cd backend
   mvn spring-boot:run
   ```

## Mobile Setup (React Native)
1. **Prerequisites**: Node.js, React Native CLI, Android Studio / Xcode.
2. **Installation**:
   ```bash
   cd mobile
   npm install
   ```
3. **Running**:
   - For Android: `npx react-native run-android`
   - For iOS: `npx react-native run-ios`
4. **Build APK**:
   ```bash
   cd mobile/android
   ./gradlew assembleRelease
   ```
   *Output: `mobile/android/app/build/outputs/apk/release/app-release.apk`*

## Key Features
- **E2EE**: Messages are encrypted locally using AES keys, which are exchanged via RSA.
- **Quantum UI**: Premium glassmorphic design optimized for mobile screens.
- **Real-time**: Instant message delivery and activity indicators (typing/recording).
- **Read Receipts**: Status updates from 'sent' to 'read' in real-time.
- **Group Chats**: Create and manage groups with ease.

## Architecture
Mobile App → REST API (Auth/Search) & WebSocket (Messaging) → Spring Boot → MongoDB.
Media handled via Cloudinary.
Encrypt -> Transport -> Decrypt flow ensures total privacy.
