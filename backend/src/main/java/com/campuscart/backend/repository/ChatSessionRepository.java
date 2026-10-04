package com.campuscart.backend.repository;

import com.campuscart.backend.model.ChatSession;
import com.campuscart.backend.model.Listing;
import com.campuscart.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    
    // Find all sessions where the user is either the buyer or the seller
    List<ChatSession> findByBuyerIdOrSellerIdOrderByUpdatedAtDesc(Long buyerId, Long sellerId);
    
    // Check if a session already exists between this buyer and seller for this exact listing
    Optional<ChatSession> findByListingAndBuyerAndSeller(Listing listing, User buyer, User seller);
}
