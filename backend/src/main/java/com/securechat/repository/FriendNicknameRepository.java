package com.securechat.repository;

import com.securechat.model.FriendNickname;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface FriendNicknameRepository extends MongoRepository<FriendNickname, String> {
    List<FriendNickname> findByUserId(String userId);
    Optional<FriendNickname> findByUserIdAndFriendId(String userId, String friendId);
}
