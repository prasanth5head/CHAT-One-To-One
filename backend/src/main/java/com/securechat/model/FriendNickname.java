package com.securechat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "friend_nicknames")
public class FriendNickname {
    @Id
    private String id;
    private String userId; // The person who set the nickname
    private String friendId; // The friend who received the nickname
    private String nickname;
}
