package com.securechat.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.securechat.model.User;
import com.securechat.payload.AuthResponse;
import com.securechat.payload.LoginRequest;
import com.securechat.repository.UserRepository;
import com.securechat.security.JwtProvider;
import org.springframework.beans.factory.annotation.Autowired;
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
        String tokenInfoUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + loginRequest.getToken();

        try {
            String response = restTemplate.getForObject(tokenInfoUrl, String.class);
            JsonNode payload = objectMapper.readTree(response);

            String email = payload.get("email").asText();
            String name = payload.has("name") ? payload.get("name").asText() : email;
            String picture = payload.has("picture") ? payload.get("picture").asText() : "";

            Optional<User> userOpt = userRepository.findByEmail(email);
            User user;

            if (userOpt.isPresent()) {
                user = userOpt.get();
                // Update public key potentially if they login from a new device?
                // The prompt says private key stored locally. If they lose it, they generate
                // new pair.
                // We'll update the public key if provided, this revokes access to past messages
                // if they can't decrypt
                if (loginRequest.getPublicKey() != null && !loginRequest.getPublicKey().isEmpty()) {
                    user.setPublicKey(loginRequest.getPublicKey());
                }
                user.setAvatar(picture);
                user.setName(name);
                user = userRepository.save(user);
            } else {
                user = new User();
                user.setEmail(email);
                user.setName(name);
                user.setAvatar(picture);
                user.setPublicKey(loginRequest.getPublicKey());
                user = userRepository.save(user);
            }

            String jwt = jwtProvider.generateToken(user.getId(), user.getEmail());
            return new AuthResponse(jwt, user);

        } catch (Exception e) {
            throw new Exception("Invalid Google Token", e);
        }
    }
}
