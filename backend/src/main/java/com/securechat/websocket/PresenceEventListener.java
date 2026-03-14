package com.securechat.websocket;

import com.securechat.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Date;

@Component
public class PresenceEventListener {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleSessionConnected(SessionConnectEvent event) {
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String userId = null;
        if (headers.getUser() != null) {
            userId = headers.getUser().getName();
        }
        
        if (userId != null) {
            updateUserStatus(userId, "online");
        }
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String userId = null;
        if (headers.getUser() != null) {
            userId = headers.getUser().getName();
        }

        if (userId != null) {
            updateUserStatus(userId, "offline");
        }
    }

    private void updateUserStatus(String userId, String status) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setStatus(status);
            user.setLastSeen(new Date());
            userRepository.save(user);
            
            // Broadcast to all (global presence topic)
            messagingTemplate.convertAndSend("/topic/presence", new PresencePayload(userId, status));
        });
    }
}

class PresencePayload {
    private String userId;
    private String status;

    public PresencePayload(String userId, String status) {
        this.userId = userId;
        this.status = status;
    }

    public String getUserId() { return userId; }
    public String getStatus() { return status; }
}
