package com.securechat.controller;

import com.securechat.service.MediaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    @Autowired
    private MediaService mediaService;

    @PostMapping("/upload")
    public ResponseEntity<String> uploadMedia(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "auto") String type) {
        
        // 1. Basic Type Validation
        String contentType = file.getContentType();
        if (contentType == null) return ResponseEntity.badRequest().body("Unknown file type");
        
        if (type.equals("image") && !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body("Only images are allowed here");
        }
        if (type.equals("audio") && !contentType.startsWith("audio/") && !contentType.contains("webm")) {
            return ResponseEntity.badRequest().body("Only audio files are allowed here");
        }

        // 2. Size Validation (5MB limit)
        if (file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest().body("File too large. Max 5MB allowed.");
        }

        try {
            String url = mediaService.uploadMedia(file);
            return ResponseEntity.ok(url);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Upload failed: " + e.getMessage());
        }
    }
}
