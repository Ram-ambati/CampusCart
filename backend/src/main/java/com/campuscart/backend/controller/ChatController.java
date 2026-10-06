package com.campuscart.backend.controller;

import com.campuscart.backend.dto.ChatMessageRequest;
import com.campuscart.backend.model.ChatMessage;
import com.campuscart.backend.model.ChatSession;
import com.campuscart.backend.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // 1. Initialize or get a chat session for a listing
    @PostMapping("/session")
    public ResponseEntity<ChatSession> getOrCreateSession(
            @RequestBody Map<String, Long> payload,
            Principal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        if (payload == null || !payload.containsKey("listingId") || payload.get("listingId") == null || payload.get("listingId") <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid listing ID is required");
        }
        String email = principal.getName();
        Long listingId = payload.get("listingId");
        return ResponseEntity.ok(chatService.getOrCreateSession(listingId, email));
    }

    // 2. Get all chat sessions for the logged-in user (Inbox view)
    @GetMapping("/sessions")
    public ResponseEntity<List<ChatSession>> getUserSessions(Principal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        String email = principal.getName();
        return ResponseEntity.ok(chatService.getUserSessions(email));
    }

    // 3. Get message history for a specific session
    @GetMapping("/session/{sessionId}/messages")
    public ResponseEntity<List<ChatMessage>> getSessionMessages(
            @PathVariable Long sessionId,
            Principal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        String email = principal.getName();
        return ResponseEntity.ok(chatService.getSessionMessages(sessionId, email));
    }

    // 4. WebSocket Endpoint: Receive message, save it, and push to recipient
    @MessageMapping("/chat")
    public void processMessage(@Payload @Valid ChatMessageRequest request, java.security.Principal principal) {
        if (principal == null) {
            return;
        }
        String senderEmail = principal.getName();
        
        // Save to DB
        ChatMessage savedMsg = chatService.saveMessage(request, senderEmail);
        
        // The destination topic for this specific session
        // Only users subscribed to /topic/session/{sessionId} will receive it
        messagingTemplate.convertAndSend("/topic/session/" + request.getSessionId(), savedMsg);
    }
}
