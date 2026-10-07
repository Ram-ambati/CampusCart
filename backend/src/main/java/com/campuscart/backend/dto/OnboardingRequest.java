package com.campuscart.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OnboardingRequest {

    @NotBlank(message = "Preferred name is required")
    @Size(min = 2, max = 50, message = "Preferred name must be between 2 and 50 characters")
    private String preferredName;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^(\\+91)?[6-9]\\d{9}$", message = "Phone number must be a valid 10-digit number starting with 6, 7, 8, or 9")
    private String phoneNumber;

    @NotBlank(message = "Branch is required")
    @Size(min = 2, max = 100, message = "Branch must be between 2 and 100 characters")
    private String branch;

    @NotBlank(message = "Academic year is required")
    @Size(min = 1, max = 20, message = "Academic year must be between 1 and 20 characters")
    private String academicYear;
}
