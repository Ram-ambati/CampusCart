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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ChatService {

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public ChatSession getOrCreateSession(Long listingId, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new RuntimeException("Buyer not found"));
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        
        User seller = listing.getSeller();
        
        // Prevent users from messaging themselves
        if (buyer.getId().equals(seller.getId())) {
            throw new RuntimeException("Cannot chat with yourself");
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
                .orElseThrow(() -> new RuntimeException("User not found"));
        return chatSessionRepository.findByBuyerIdOrSellerIdOrderByUpdatedAtDesc(user.getId(), user.getId());
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> getSessionMessages(Long sessionId, String userEmail) {
        validateUserInSession(sessionId, userEmail);
        return chatMessageRepository.findBySessionIdOrderByTimestampAsc(sessionId);
    }

    @Transactional
    public ChatMessage saveMessage(ChatMessageRequest request, String senderEmail) {
        ChatSession session = chatSessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found"));
        
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        // Ensure the sender is actually part of this session
        if (!session.getBuyer().getId().equals(sender.getId()) && !session.getSeller().getId().equals(sender.getId())) {
            throw new RuntimeException("Unauthorized to send messages in this session");
        }
        
        // Spam Prevention & Negotiation limits
        List<ChatMessage> history = chatMessageRepository.findBySessionIdOrderByTimestampAsc(session.getId());
        
        if (history.size() >= 100) {
            throw new RuntimeException("Negotiation limit reached: A maximum of 100 messages are allowed per product.");
        }
        
        int consecutiveCount = 0;
        for (int i = history.size() - 1; i >= 0; i--) {
            if (history.get(i).getSender().getId().equals(sender.getId())) {
                consecutiveCount++;
                if (consecutiveCount >= 4) {
                    throw new RuntimeException("Spam prevention: You can only send 4 consecutive messages. Please wait for a reply.");
                }
            } else {
                break;
            }
        }

        ChatMessage message = ChatMessage.builder()
                .session(session)
                .sender(sender)
                .content(request.getContent())
                .build();
                
        // Trigger the @PreUpdate on ChatSession to update the updatedAt timestamp
        session.setUpdatedAt(java.time.LocalDateTime.now());
        chatSessionRepository.save(session);

        return chatMessageRepository.save(message);
    }
    
    private void validateUserInSession(Long sessionId, String userEmail) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!session.getBuyer().getId().equals(user.getId()) && !session.getSeller().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to session");
        }
    }
}
