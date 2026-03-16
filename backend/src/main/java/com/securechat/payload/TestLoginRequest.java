package com.securechat.payload;

import lombok.Data;

@Data
public class TestLoginRequest {
    private String email;
    private String password;
    private String publicKey;
}
