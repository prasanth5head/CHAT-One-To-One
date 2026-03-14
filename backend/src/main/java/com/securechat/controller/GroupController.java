package com.securechat.controller;

import com.securechat.model.Group;
import com.securechat.service.GroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    @Autowired
    private GroupService groupService;

    @PostMapping("/create")
    public ResponseEntity<Group> createGroup(@RequestBody Group group) {
        return ResponseEntity.ok(groupService.createGroup(group));
    }

    @GetMapping("/list/{userId}")
    public ResponseEntity<List<String>> listGroups(@PathVariable String userId) {
        return ResponseEntity.ok(groupService.getUserGroups(userId));
    }

    @PostMapping("/{groupId}/add/{userId}")
    public ResponseEntity<Group> addMember(@PathVariable String groupId, @PathVariable String userId) {
        return ResponseEntity.ok(groupService.addMember(groupId, userId));
    }
}
