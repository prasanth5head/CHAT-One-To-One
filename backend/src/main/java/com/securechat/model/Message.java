package com.securechat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;
import java.util.Map;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "messages")
public class Message {
    @Id
    private String id;
    private String chatId;
    private String senderId;
    private String encryptedMessage;
    // Maps userId -> encrypted AES key for that user
    private Map<String, String> encryptedKeys;
    private String mediaUrl;
    private String messageType; // text, image, video, file, voice
    private String status; // sent, delivered, read
    private Date timestamp = new Date();
}
