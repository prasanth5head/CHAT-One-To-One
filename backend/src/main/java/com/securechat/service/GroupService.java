package com.securechat.service;

import com.securechat.model.Group;
import com.securechat.model.Chat;
import com.securechat.repository.GroupRepository;
import com.securechat.repository.ChatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class GroupService {

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private ChatRepository chatRepository;

    public Group createGroup(Group group) {
        group.setCreatedAt(new Date());
        Group savedGroup = groupRepository.save(group);

        // Create a corresponding Chat entry so it shows in the user's chat list
        Chat chat = new Chat();
        chat.setId(savedGroup.getId());
        chat.setParticipants(group.getMembers());
        chat.setGroup(true);
        chat.setGroupName(group.getGroupName());
        chat.setUpdatedAt(new Date());
        chatRepository.save(chat);

        return savedGroup;
    }

    public List<String> getUserGroups(String userId) {
        return groupRepository.findByMembersContaining(userId);
    }

    public Group addMember(String groupId, String userId) {
        Group group = groupRepository.findById(groupId).orElseThrow();
        if (!group.getMembers().contains(userId)) {
            group.getMembers().add(userId);
            groupRepository.save(group);

            chatRepository.findById(groupId).ifPresent(chat -> {
                chat.getParticipants().add(userId);
                chat.setUpdatedAt(new Date());
                chatRepository.save(chat);
            });
        }
        return group;
    }
}
