package com.securechat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;
import java.util.List;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "chats")
public class Chat {
    @Id
    private String id;
    private List<String> participants;
    private boolean isGroup;
    private String groupName;
    private String lastMessage;
    private String wallpaperUrl; // Custom chat background URL
    private Date updatedAt;
    private Date createdAt = new Date();
}
