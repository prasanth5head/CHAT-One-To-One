package com.securechat.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.securechat.model.User;
import com.securechat.payload.AuthResponse;
import com.securechat.payload.LoginRequest;
import com.securechat.repository.UserRepository;
import com.securechat.security.JwtProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtProvider jwtProvider;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AuthResponse authenticate(LoginRequest loginRequest) throws Exception {
        String token = loginRequest.getToken();

        String email;
        String name;
        String picture;

        // Strategy 1 — try Google id_token (tokeninfo endpoint)
        // Used when frontend sends an id_token (e.g. via OneTap or authorization code
        // flow)
        try {
            String tokenInfoUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + token;
            String response = restTemplate.getForObject(tokenInfoUrl, String.class);
            JsonNode payload = objectMapper.readTree(response);

            if (payload.has("error"))
                throw new RuntimeException("Not an id_token");

            email = payload.get("email").asText();
            name = payload.has("name") ? payload.get("name").asText() : email;
            picture = payload.has("picture") ? payload.get("picture").asText() : "";

        } catch (Exception idTokenException) {
            // Strategy 2 — treat token as an access_token and call Google userinfo
            // Used when frontend uses the implicit flow (useGoogleLogin default)
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setBearerAuth(token);
                HttpEntity<Void> entity = new HttpEntity<>(headers);

                ResponseEntity<String> response = restTemplate.exchange(
                        "https://www.googleapis.com/oauth2/v3/userinfo",
                        HttpMethod.GET,
                        entity,
                        String.class);

                JsonNode payload = objectMapper.readTree(response.getBody());

                email = payload.get("email").asText();
                name = payload.has("name") ? payload.get("name").asText() : email;
                picture = payload.has("picture") ? payload.get("picture").asText() : "";

            } catch (Exception accessTokenException) {
                throw new Exception("Invalid Google token: " + accessTokenException.getMessage());
            }
        }

        // Upsert user record
        Optional<User> userOpt = userRepository.findByEmail(email);
        User user;

        if (userOpt.isPresent()) {
            user = userOpt.get();
            user.setAvatar(picture);
            user.setName(name);
            // Update public key if a new one is provided (e.g. user lost their private key)
            if (loginRequest.getPublicKey() != null && !loginRequest.getPublicKey().isEmpty()) {
                user.setPublicKey(loginRequest.getPublicKey());
            }
        } else {
            user = new User();
            user.setEmail(email);
            user.setName(name);
            user.setAvatar(picture);
            user.setPublicKey(loginRequest.getPublicKey());
        }

        user = userRepository.save(user);
        String jwt = jwtProvider.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(jwt, user);
    }
}
