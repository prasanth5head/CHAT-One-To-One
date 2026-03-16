package com.securechat.service;

import com.securechat.model.Chat;
import com.securechat.model.User;
import com.securechat.repository.ChatRepository;
import com.securechat.repository.MessageRepository;
import com.securechat.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Arrays;
import java.util.stream.Collectors;

@Service
public class ChatService {

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    public Chat createOrGetChat(String currentUserId, String targetUserId) {
        // Resolve email to ID if needed for test accounts
        if (targetUserId.contains("@")) {
            Optional<User> targetUser = userRepository.findByEmail(targetUserId);
            if (targetUser.isPresent()) {
                targetUserId = targetUser.get().getId();
            } else if (targetUserId.endsWith("@test.com")) {
                // Auto-provision test account if it doesn't exist
                User newUser = new User();
                newUser.setEmail(targetUserId);
                newUser.setName(targetUserId.split("@")[0]);
                newUser.setPublicKey(""); 
                newUser.setStatus("offline");
                targetUserId = userRepository.save(newUser).getId();
            }
        }

        final String finalTargetId = targetUserId;
        List<Chat> chats = chatRepository.findByParticipantsContaining(currentUserId);

        Optional<Chat> existingChat = chats.stream()
                .filter(c -> !c.isGroup() && c.getParticipants().contains(finalTargetId))
                .findFirst();

        if (existingChat.isPresent()) {
            return existingChat.get();
        }

        Chat chat = new Chat();
        chat.setParticipants(Arrays.asList(currentUserId, finalTargetId));
        chat.setGroup(false);
        chat.setUpdatedAt(new Date());
        return chatRepository.save(chat);
    }

    public List<Chat> getUserChats(String userId) {
        return chatRepository.findByParticipantsContaining(userId);
    }

    public Chat updateWallpaper(String chatId, String wallpaperUrl) {
        Chat chat = chatRepository.findById(chatId).orElseThrow(() -> new RuntimeException("Chat not found"));
        chat.setWallpaperUrl(wallpaperUrl);
        return chatRepository.save(chat);
    }

    public void deleteChat(String chatId) {
        messageRepository.deleteByChatId(chatId);
        chatRepository.deleteById(chatId);
    }
}
