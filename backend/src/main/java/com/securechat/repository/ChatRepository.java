package com.securechat.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import com.securechat.model.Chat;
import java.util.List;

@Repository
public interface ChatRepository extends MongoRepository<Chat, String> {
    List<Chat> findByParticipantsContaining(String userId);
}
