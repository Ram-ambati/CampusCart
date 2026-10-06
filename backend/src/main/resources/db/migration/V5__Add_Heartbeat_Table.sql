-- V5: Add Heartbeat table for database keep-alive and health checks
CREATE TABLE IF NOT EXISTS heartbeat (
    id INT PRIMARY KEY,
    last_ping_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ping_count BIGINT NOT NULL DEFAULT 1
);

INSERT INTO heartbeat (id, last_ping_at, ping_count)
VALUES (1, CURRENT_TIMESTAMP, 1)
ON CONFLICT (id) DO NOTHING;
