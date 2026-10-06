package com.campuscart.backend.repository;

import com.campuscart.backend.model.Heartbeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Repository
public interface HeartbeatRepository extends JpaRepository<Heartbeat, Integer> {

    @Modifying
    @Transactional
    @Query("UPDATE Heartbeat h SET h.lastPingAt = :now, h.pingCount = COALESCE(h.pingCount, 0) + 1 WHERE h.id = 1")
    int recordPing(@Param("now") LocalDateTime now);
}
