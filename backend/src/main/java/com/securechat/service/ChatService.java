package com.securechat.service;

import com.securechat.model.Chat;
import com.securechat.repository.ChatRepository;
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
}
