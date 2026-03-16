package com.securechat.controller;

import com.securechat.payload.AuthResponse;
import com.securechat.payload.LoginRequest;
import com.securechat.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/google")
    public ResponseEntity<?> authenticateWithGoogle(@RequestBody LoginRequest loginRequest) {
        try {
            AuthResponse response = authService.authenticate(loginRequest);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Authentication Failed: " + e.getMessage());
        }
    }

    @PostMapping("/test")
    public ResponseEntity<?> authenticateTest(@RequestBody com.securechat.payload.TestLoginRequest request) {
        try {
            AuthResponse response = authService.authenticateTest(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Test Login Failed: " + e.getMessage());
        }
    }
}
