package com.campuscart.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OnboardingRequest {

    @NotBlank(message = "Preferred name is required")
    private String preferredName;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Branch is required")
    private String branch;

    @NotBlank(message = "Academic year is required")
    private String academicYear;
}
