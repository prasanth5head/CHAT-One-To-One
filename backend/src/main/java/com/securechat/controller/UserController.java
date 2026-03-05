package com.securechat.controller;

import com.securechat.model.User;
import com.securechat.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    /** Get current user's own profile */
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(Authentication authentication) {
        String currentUserId = (String) authentication.getPrincipal();
        return userRepository.findById(currentUserId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Fetch a specific user by ID (used to get public key for E2EE) */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id, Authentication authentication) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Search users by email — excludes the caller from results */
    @GetMapping("/search")
    public ResponseEntity<List<User>> searchUsers(@RequestParam("email") String email, Authentication authentication) {
        String currentUserId = (String) authentication.getPrincipal();
        List<User> results = userRepository.findByEmail(email)
                .map(List::of)
                .orElseGet(List::of)
                .stream()
                .filter(u -> !u.getId().equals(currentUserId))
                .collect(Collectors.toList());
        return ResponseEntity.ok(results);
    }
}
