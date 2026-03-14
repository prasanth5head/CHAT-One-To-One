package com.securechat.service;

import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class NotificationService {

    // Mock implementation for FCM
    public void sendPushNotification(String userToken, String title, String body, Map<String, String> data) {
        System.out.println("Sending FCM Notification to: " + userToken);
        System.out.println("Title: " + title + " | Body: " + body);
        // In real impl: FirebaseMessaging.getInstance().send(message);
    }
}
