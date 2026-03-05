package com.securechat.controller;

import com.securechat.model.User;
import com.securechat.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/search")
    public ResponseEntity<List<User>> searchUsers(@RequestParam("email") String email, Authentication authentication) {
        // Return exactly one or empty list for precise search
        return userRepository.findByEmail(email)
                .map(List::of)
                .orElseGet(List::of)
                .stream()
                .filter(u -> !u.getId().equals(authentication.getPrincipal()))
                .collect(java.util.stream.Collectors.collectingAndThen(java.util.stream.Collectors.toList(),
                        ResponseEntity::ok));
    }
}
