package com.securechat.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public Map<String, String> getHealth() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "UP");
        status.put("message", "Server Running");
        status.put("system", "Neural Link Active");
        return status;
    }
}
