package com.campuscart.backend.service;

import com.campuscart.backend.model.Heartbeat;
import com.campuscart.backend.repository.HeartbeatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.connection.RedisConnectionFactory;

@Service
@RequiredArgsConstructor
@Slf4j
public class HealthService {

    private final HeartbeatRepository heartbeatRepository;

    @Autowired(required = false)
    private RedisConnectionFactory redisConnectionFactory;

    @Transactional
    public Map<String, Object> pingDatabase() {
        LocalDateTime now = LocalDateTime.now();
        int updated = heartbeatRepository.recordPing(now);

        Heartbeat heartbeat;
        if (updated == 0) {
            heartbeat = heartbeatRepository.save(
                    Heartbeat.builder()
                            .id(1)
                            .lastPingAt(now)
                            .pingCount(1L)
                            .build()
            );
        } else {
            heartbeat = heartbeatRepository.findById(1).orElse(null);
        }

        String redisStatus = "NOT_CONFIGURED";
        if (redisConnectionFactory != null) {
            try {
                redisConnectionFactory.getConnection().ping();
                redisStatus = "CONNECTED";
            } catch (Exception e) {
                redisStatus = "UNAVAILABLE";
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("status", "UP");
        result.put("database", "CONNECTED");
        result.put("redis", redisStatus);
        result.put("lastPingAt", heartbeat != null ? heartbeat.getLastPingAt() : now);
        result.put("pingCount", heartbeat != null ? heartbeat.getPingCount() : 1L);
        result.put("serverTime", now);
        return result;
    }

    // Keep database connection pool warm and prevent Supabase from pausing (every 10 minutes)
    @Scheduled(fixedRate = 10 * 60 * 1000)
    public void scheduledKeepAlive() {
        try {
            Map<String, Object> status = pingDatabase();
            log.info("Database keep-alive ping successful. Ping count: {}", status.get("pingCount"));
        } catch (Exception e) {
            log.warn("Database keep-alive ping failed: {}", e.getMessage());
        }
    }
}
