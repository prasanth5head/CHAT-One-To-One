package com.securechat.repository;

import com.securechat.model.Group;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface GroupRepository extends MongoRepository<Group, String> {
    List<String> findByMembersContaining(String userId);
}
