package com.campuscart.backend.dto;

import lombok.Data;

@Data
public class ChatMessageRequest {
    private Long sessionId;
    private String content;
}
