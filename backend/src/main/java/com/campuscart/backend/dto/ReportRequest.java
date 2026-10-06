package com.campuscart.backend.dto;

import lombok.Data;

@Data
public class ReportRequest {
    private String targetType; // 'LISTING' or 'USER'
    private Long targetId;
    private String reason;
}
