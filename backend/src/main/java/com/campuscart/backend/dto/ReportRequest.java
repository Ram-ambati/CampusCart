package com.campuscart.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReportRequest {

    @NotBlank(message = "Target type is required")
    @Pattern(regexp = "^(LISTING|USER)$", message = "Target type must be either LISTING or USER")
    private String targetType;

    @NotNull(message = "Target ID is required")
    @Positive(message = "Target ID must be a positive number")
    private Long targetId;

    @NotBlank(message = "Report reason is required")
    @Size(min = 3, max = 500, message = "Report reason must be between 3 and 500 characters")
    private String reason;
}
