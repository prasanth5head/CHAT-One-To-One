package com.securechat.service;

import com.securechat.model.Message;
import com.securechat.repository.ChatRepository;
import com.securechat.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ChatRepository chatRepository;

    public Message saveMessage(Message message) {
        message.setTimestamp(new Date());
        message.setStatus("sent");
        Message saved = messageRepository.save(message);

        // Update chat last message
        chatRepository.findById(message.getChatId()).ifPresent(chat -> {
            chat.setLastMessage(saved.getEncryptedMessage());
            chat.setUpdatedAt(new Date());
            chatRepository.save(chat);
        });

        return saved;
    }

    public List<Message> getMessages(String chatId) {
        return messageRepository.findByChatIdOrderByTimestampAsc(chatId);
    }

    public void deleteMessage(String messageId) {
        messageRepository.findById(messageId).ifPresent(msg -> {
            String chatId = msg.getChatId();
            messageRepository.deleteById(messageId);
            
            // After deletion, find the new "last message"
            List<Message> remaining = messageRepository.findByChatIdOrderByTimestampAsc(chatId);
            chatRepository.findById(chatId).ifPresent(chat -> {
                if (remaining.isEmpty()) {
                    chat.setLastMessage(null);
                } else {
                    chat.setLastMessage(remaining.get(remaining.size() - 1).getEncryptedMessage());
                }
                chat.setUpdatedAt(new Date());
                chatRepository.save(chat);
            });
        });
    }
}
