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

    @GetMapping("/api/messages/{chatId}")
    public ResponseEntity<List<Message>> getChatMessages(@PathVariable String chatId, Authentication authentication) {
        return ResponseEntity.ok(messageService.getMessages(chatId));
    }

    @DeleteMapping("/api/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(@PathVariable String messageId) {
        messageService.deleteMessage(messageId);
        return ResponseEntity.ok().build();
    }

    @MessageMapping("/chat.sendMessage")
    public void processMessage(@Payload Message message) {
        Message saved = messageService.saveMessage(message);
        messagingTemplate.convertAndSend("/topic/chat/" + message.getChatId(), saved);
    }

    @MessageMapping("/chat.activity")
    public void processActivity(@Payload ActivityPayload activityPayload) {
        messagingTemplate.convertAndSend("/topic/chat/" + activityPayload.getChatId() + "/activity", activityPayload);
    }

    @MessageMapping("/chat.reaction")
    public void processReaction(@Payload ReactionPayload reactionPayload) {
        messageService.addReaction(reactionPayload.getMessageId(), reactionPayload.getReaction());
        messagingTemplate.convertAndSend("/topic/chat/" + reactionPayload.getChatId() + "/reaction", reactionPayload);
    }

    @PostMapping("/api/messages/{chatId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable String chatId, Authentication authentication) {
        messageService.markAsRead(chatId, authentication.getName());
        return ResponseEntity.ok().build();
    }
}

class ActivityPayload {
    private String chatId;
    private String userId;
    private boolean typing;
    private boolean recording;

    public String getChatId() { return chatId; }
    public void setChatId(String chatId) { this.chatId = chatId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public boolean isTyping() { return typing; }
    public void setTyping(boolean typing) { this.typing = typing; }
    public boolean isRecording() { return recording; }
    public void setRecording(boolean recording) { this.recording = recording; }
}

class ReactionPayload {
    private String chatId;
    private String messageId;
    private com.securechat.model.Reaction reaction;

    public String getChatId() { return chatId; }
    public void setChatId(String chatId) { this.chatId = chatId; }
    public String getMessageId() { return messageId; }
    public void setMessageId(String messageId) { this.messageId = messageId; }
    public com.securechat.model.Reaction getReaction() { return reaction; }
    public void setReaction(com.securechat.model.Reaction reaction) { this.reaction = reaction; }
}
