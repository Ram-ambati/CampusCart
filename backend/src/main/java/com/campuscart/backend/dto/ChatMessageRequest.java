package com.campuscart.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChatMessageRequest {

    @NotNull(message = "Session ID is required")
    @Positive(message = "Session ID must be positive")
    private Long sessionId;

    @NotBlank(message = "Message content cannot be blank")
    @Size(min = 1, max = 1000, message = "Message must be between 1 and 1000 characters")
    private String content;
}
