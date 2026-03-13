package com.securechat.controller;

import com.securechat.model.Chat;
import com.securechat.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chats")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @PostMapping("/{userId}")
    public ResponseEntity<Chat> createOrGetChat(@PathVariable String userId, Authentication authentication) {
        String currentUserId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(chatService.createOrGetChat(currentUserId, userId));
    }

    @GetMapping
    public ResponseEntity<List<Chat>> getUserChats(Authentication authentication) {
        String currentUserId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(chatService.getUserChats(currentUserId));
    }

    @PutMapping("/{chatId}/wallpaper")
    public ResponseEntity<Chat> updateWallpaper(@PathVariable String chatId, @RequestBody WallpaperRequest request) {
        return ResponseEntity.ok(chatService.updateWallpaper(chatId, request.getWallpaperUrl()));
    }

    @DeleteMapping("/{chatId}")
    public ResponseEntity<Void> deleteChat(@PathVariable String chatId) {
        chatService.deleteChat(chatId);
        return ResponseEntity.ok().build();
    }
}

class WallpaperRequest {
    private String wallpaperUrl;
    public String getWallpaperUrl() { return wallpaperUrl; }
    public void setWallpaperUrl(String wallpaperUrl) { this.wallpaperUrl = wallpaperUrl; }
}
