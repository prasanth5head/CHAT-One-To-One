package com.securechat.controller;

import com.securechat.model.Message;
import com.securechat.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class MessageController {

    @Autowired
    private MessageService messageService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // REST endpoint to get history
    @GetMapping("/api/messages/{chatId}")
    public ResponseEntity<List<Message>> getChatMessages(@PathVariable String chatId, Authentication authentication) {
        // Here we could add verification that the user belongs to chat
        return ResponseEntity.ok(messageService.getMessages(chatId));
    }

    // WebSocket endpoint to receive messages
    @MessageMapping("/chat.sendMessage")
    public void processMessage(@Payload Message message) {
        Message saved = messageService.saveMessage(message);
        // Send to topic for this chat, clients sub to /topic/chat/{chatId}
        messagingTemplate.convertAndSend("/topic/chat/" + message.getChatId(), saved);

        // Optionally send push notification logic depending on target users
    }

    // Activity indicator (typing, recording)
    @MessageMapping("/chat.activity")
    public void processActivity(@Payload ActivityPayload activityPayload) {
        messagingTemplate.convertAndSend("/topic/chat/" + activityPayload.getChatId() + "/activity", activityPayload);
    }
}

class ActivityPayload {
    private String chatId;
    private String userId;
    private boolean typing;
    private boolean recording;

    // Getters and Setters
    public String getChatId() {
        return chatId;
    }

    public void setChatId(String chatId) {
        this.chatId = chatId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public boolean isTyping() {
        return typing;
    }

    public void setTyping(boolean typing) {
        this.typing = typing;
    }

    public boolean isRecording() {
        return recording;
    }

    public void setRecording(boolean recording) {
        this.recording = recording;
    }
}
