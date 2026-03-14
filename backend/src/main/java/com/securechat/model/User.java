package com.securechat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String name;
    private String email;
    private String password; // For traditional login
    private String avatar;
    private String bio;
    private String status; // online, offline
    private String displayName; // Custom user display name
    private String chatWallpaperUrl; // Custom chat background URL
    private String publicKey; // Public key for E2EE
    private Date lastSeen; 
    private Date createdAt = new Date();
}
