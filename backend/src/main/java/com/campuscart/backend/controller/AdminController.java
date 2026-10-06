package com.campuscart.backend.controller;

import com.campuscart.backend.model.Listing;
import com.campuscart.backend.model.ListingStatus;
import com.campuscart.backend.model.Report;
import com.campuscart.backend.model.Role;
import com.campuscart.backend.model.User;
import com.campuscart.backend.repository.ListingRepository;
import com.campuscart.backend.repository.ReportRepository;
import com.campuscart.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final ReportRepository reportRepository;
    private final ListingRepository listingRepository;

    private void requireAdmin(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (user.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access Denied: Admins Only");
        }
    }

    // --- Reports ---

    @GetMapping("/reports")
    public ResponseEntity<List<Report>> getAllReports(@AuthenticationPrincipal String email) {
        requireAdmin(email);
        return ResponseEntity.ok(reportRepository.findAll());
    }

    @PutMapping("/reports/{id}")
    public ResponseEntity<Report> updateReportStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal String email) {
        requireAdmin(email);

        String newStatus = status != null ? status.trim().toUpperCase() : "";
        if (!"RESOLVED".equals(newStatus) && !"DISMISSED".equals(newStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be either RESOLVED or DISMISSED");
        }

        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));
        
        report.setStatus(newStatus);
        
        if ("RESOLVED".equals(newStatus) && "LISTING".equals(report.getTargetType())) {
            listingRepository.findById(report.getTargetId()).ifPresent(listing -> {
                listing.setStatus(ListingStatus.DELETED);
                listingRepository.save(listing);
            });
        }
        
        return ResponseEntity.ok(reportRepository.save(report));
    }

    // --- Users ---

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers(@AuthenticationPrincipal String email) {
        requireAdmin(email);
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PutMapping("/users/{id}/ban")
    public ResponseEntity<User> toggleBan(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        requireAdmin(email);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setBanned(!user.isBanned());
        return ResponseEntity.ok(userRepository.save(user));
    }

    // --- Listings Approvals ---

    @GetMapping("/listings/pending")
    public ResponseEntity<List<Listing>> getPendingListings(@AuthenticationPrincipal String email) {
        requireAdmin(email);
        return ResponseEntity.ok(listingRepository.findByStatusOrderByCreatedAtDesc(ListingStatus.PENDING));
    }

    @PutMapping("/listings/{id}/approve")
    public ResponseEntity<Listing> approveListing(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        requireAdmin(email);
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        listing.setStatus(ListingStatus.ACTIVE);
        return ResponseEntity.ok(listingRepository.save(listing));
    }

    @PutMapping("/listings/{id}/reject")
    public ResponseEntity<Listing> rejectListing(
            @PathVariable Long id,
            @AuthenticationPrincipal String email) {
        requireAdmin(email);
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        listing.setStatus(ListingStatus.DELETED);
        return ResponseEntity.ok(listingRepository.save(listing));
    }
}
