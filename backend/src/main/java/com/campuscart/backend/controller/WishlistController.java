package com.campuscart.backend.controller;

import com.campuscart.backend.model.Listing;
import com.campuscart.backend.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    @Autowired
    private WishlistService wishlistService;

    @PostMapping("/{listingId}")
    public ResponseEntity<Void> addToWishlist(@PathVariable Long listingId, @AuthenticationPrincipal String email) {
        wishlistService.addToWishlist(listingId, email);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{listingId}")
    public ResponseEntity<Void> removeFromWishlist(@PathVariable Long listingId, @AuthenticationPrincipal String email) {
        wishlistService.removeFromWishlist(listingId, email);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<Listing>> getUserWishlist(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(wishlistService.getUserWishlist(email));
    }

    @GetMapping("/ids")
    public ResponseEntity<List<Long>> getUserWishlistIds(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(wishlistService.getUserWishlistIds(email));
    }
}
