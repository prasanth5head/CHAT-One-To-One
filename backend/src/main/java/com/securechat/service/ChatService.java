package com.securechat.service;

import com.securechat.model.Chat;
import com.securechat.repository.ChatRepository;
import com.securechat.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Arrays;

@Service
public class ChatService {

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private MessageRepository messageRepository;

    public Chat createOrGetChat(String currentUserId, String targetUserId) {
        List<Chat> chats = chatRepository.findByParticipantsContaining(currentUserId);

        Optional<Chat> existingChat = chats.stream()
                .filter(c -> !c.isGroup() && c.getParticipants().contains(targetUserId))
                .findFirst();

        if (existingChat.isPresent()) {
            return existingChat.get();
        }

        Chat chat = new Chat();
        chat.setParticipants(Arrays.asList(currentUserId, targetUserId));
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
