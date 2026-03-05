package com.securechat.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expirationMs}")
    private int jwtExpirationMs;

    private Key getSigningKey() {
        if (jwtSecret.length() < 32) {
            jwtSecret = "8a4c3f7b2e1d0f5c9e6a3b2d1f0c9a8b7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b"; // fallback to 256-bit key
        }
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateToken(String userId, String email) {
        return Jwts.builder()
                .setSubject(userId)
                .claim("email", email)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUserIdFromToken(String token) {
        return Jwts.parserBuilder().setSigningKey(getSigningKey()).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (Exception e) {
            System.err.println("Invalid JWT token: " + e.getMessage());
        }
        return false;
    }
}
