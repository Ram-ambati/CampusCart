package com.campuscart.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "heartbeat")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Heartbeat {

    @Id
    private Integer id;

    @Column(name = "last_ping_at", nullable = false)
    private LocalDateTime lastPingAt;

    @Column(name = "ping_count", nullable = false)
    private Long pingCount;
}
