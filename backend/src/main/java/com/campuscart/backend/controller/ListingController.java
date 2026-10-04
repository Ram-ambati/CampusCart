package com.campuscart.backend.controller;

import com.campuscart.backend.dto.ListingRequest;
import com.campuscart.backend.model.Category;
import com.campuscart.backend.model.Listing;
import com.campuscart.backend.service.ListingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import java.util.List;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    @Autowired
    private ListingService listingService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Listing> createListing(
            @Valid @RequestPart("listing") ListingRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @AuthenticationPrincipal String email) {
        
        try {
            Listing createdListing = listingService.createListing(request, images, email);
            return ResponseEntity.ok(createdListing);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping
    public ResponseEntity<Page<Listing>> getAllActiveListings(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) java.math.BigDecimal minPrice,
            @RequestParam(required = false) java.math.BigDecimal maxPrice,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) Integer days,
            @RequestParam(required = false, defaultValue = "newest") String sort,
            @PageableDefault(size = 12) Pageable pageable) {
        return ResponseEntity.ok(listingService.searchListings(null, q, minPrice, maxPrice, condition, days, sort, pageable));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<Page<Listing>> getListingsByCategory(
            @PathVariable Category category,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) java.math.BigDecimal minPrice,
            @RequestParam(required = false) java.math.BigDecimal maxPrice,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) Integer days,
            @RequestParam(required = false, defaultValue = "newest") String sort,
            @PageableDefault(size = 12) Pageable pageable) {
        return ResponseEntity.ok(listingService.searchListings(category, q, minPrice, maxPrice, condition, days, sort, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Listing> getListingById(@PathVariable Long id) {
        return ResponseEntity.ok(listingService.getListingById(id));
    }

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<Listing>> getListingsBySeller(@PathVariable Long sellerId) {
        return ResponseEntity.ok(listingService.getListingsBySellerId(sellerId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable Long id, @RequestParam com.campuscart.backend.model.ListingStatus status, @AuthenticationPrincipal String email) {
        listingService.updateStatus(id, email, status);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteListing(@PathVariable Long id, @AuthenticationPrincipal String email) {
        listingService.deleteListing(id, email);
        return ResponseEntity.ok().build();
    }
}
