package com.securechat.payload;

import lombok.Data;

@Data
public class LoginRequest {
    private String token; // Google OAuth2 idToken
    private String publicKey; // User's generated public key
}
