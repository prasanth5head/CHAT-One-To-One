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
        
        String contentType = file.getContentType();
        if (contentType == null) return ResponseEntity.badRequest().body("Unknown file type");
        
        // Allowed Types: Image, Audio, PDF, and standard Office docs
        boolean allowed = contentType.startsWith("image/") || 
                          contentType.startsWith("audio/") || 
                          contentType.contains("webm") ||
                          contentType.equals("application/pdf") ||
                          contentType.equals("application/msword") ||
                          contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        if (!allowed && !type.equals("auto")) {
            return ResponseEntity.badRequest().body("File type not supported for secure transport");
        }

        // 20MB limit for general files
        if (file.getSize() > 20 * 1024 * 1024) {
            return ResponseEntity.badRequest().body("File too large. Max 20MB allowed.");
        }

        try {
            String url = mediaService.uploadMedia(file);
            return ResponseEntity.ok(url);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Upload failed: " + e.getMessage());
        }
    }
}
