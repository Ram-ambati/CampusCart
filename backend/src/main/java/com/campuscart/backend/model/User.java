package com.campuscart.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String realName; // From Google Profile

    private String preferredName; // Custom for the marketplace

    private String avatarUrl;

    @Column(length = 500)
    private String about; // Bio for the user's profile

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private String phoneNumber;

    private String branch;

    private String academicYear;

    @Column(nullable = false)
    @Builder.Default
    private boolean onboardingCompleted = false;

    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
