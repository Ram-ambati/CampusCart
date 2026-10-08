package com.campuscart.backend.service;

import com.campuscart.backend.dto.ChatMessageRequest;
import com.campuscart.backend.model.ChatMessage;
import com.campuscart.backend.model.ChatSession;
import com.campuscart.backend.model.Listing;
import com.campuscart.backend.model.User;
import com.campuscart.backend.repository.ChatMessageRepository;
import com.campuscart.backend.repository.ChatSessionRepository;
import com.campuscart.backend.repository.ListingRepository;
import com.campuscart.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;

    @Transactional
    public ChatSession getOrCreateSession(Long listingId, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Buyer not found"));
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        
        User seller = listing.getSeller();
        
        // Prevent users from messaging themselves
        if (buyer.getId().equals(seller.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot chat with yourself");
        }

        Optional<ChatSession> existingSession = chatSessionRepository.findByListingAndBuyerAndSeller(listing, buyer, seller);
        
        return existingSession.orElseGet(() -> {
            ChatSession newSession = ChatSession.builder()
                    .listing(listing)
                    .buyer(buyer)
                    .seller(seller)
                    .build();
            return chatSessionRepository.save(newSession);
        });
    }

    @Transactional(readOnly = true)
    public List<ChatSession> getUserSessions(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        return chatSessionRepository.findByBuyerIdOrSellerIdOrderByUpdatedAtDesc(user.getId(), user.getId());
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> getSessionMessages(Long sessionId, String userEmail) {
        validateUserInSession(sessionId, userEmail);
        return chatMessageRepository.findBySessionIdOrderByTimestampAsc(sessionId);
    }

    @Transactional
    public ChatMessage saveMessage(ChatMessageRequest request, String senderEmail) {
        if (request == null || request.getSessionId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Session ID is required");
        }
        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message content cannot be blank");
        }
        if (request.getContent().length() > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message cannot exceed 1000 characters");
        }

        ChatSession session = chatSessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
        
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
                
        // Ensure the sender is actually part of this session
        if (!session.getBuyer().getId().equals(sender.getId()) && !session.getSeller().getId().equals(sender.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized to send messages in this session");
        }
        
        // Spam Prevention & Negotiation limits
        List<ChatMessage> history = chatMessageRepository.findBySessionIdOrderByTimestampAsc(session.getId());
        
        if (history.size() >= 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Negotiation limit reached: A maximum of 100 messages are allowed per product.");
        }
        
        int consecutiveCount = 0;
        for (int i = history.size() - 1; i >= 0; i--) {
            if (history.get(i).getSender().getId().equals(sender.getId())) {
                consecutiveCount++;
                if (consecutiveCount >= 4) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Spam prevention: You can only send 4 consecutive messages. Please wait for a reply.");
                }
            } else {
                break;
            }
        }

        ChatMessage message = ChatMessage.builder()
                .session(session)
                .sender(sender)
                .content(request.getContent().trim())
                .build();
                
        // Trigger the @PreUpdate on ChatSession to update the updatedAt timestamp
        session.setUpdatedAt(java.time.LocalDateTime.now());
        chatSessionRepository.save(session);

        return chatMessageRepository.save(message);
    }
    
    private void validateUserInSession(Long sessionId, String userEmail) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        
        if (!session.getBuyer().getId().equals(user.getId()) && !session.getSeller().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized access to session");
        }
    }
}
