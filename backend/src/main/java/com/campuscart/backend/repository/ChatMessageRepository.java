package com.campuscart.backend.repository;

import com.campuscart.backend.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    // Fetch messages for a session ordered by timestamp ascending (oldest first)
    List<ChatMessage> findBySessionIdOrderByTimestampAsc(Long sessionId);
}
