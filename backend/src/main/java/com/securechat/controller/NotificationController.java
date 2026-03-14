package com.securechat.controller;

import com.securechat.model.Notification;
import com.securechat.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(notificationRepository.findByUserId(userId));
    }

    @PutMapping("/read")
    public ResponseEntity<Void> markAsRead(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        List<Notification> notifications = notificationRepository.findByUserId(userId);
        notifications.forEach(n -> n.setSeen(true));
        notificationRepository.saveAll(notifications);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Void> clearNotifications(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        notificationRepository.deleteAll(notificationRepository.findByUserId(userId));
        return ResponseEntity.ok().build();
    }
}
