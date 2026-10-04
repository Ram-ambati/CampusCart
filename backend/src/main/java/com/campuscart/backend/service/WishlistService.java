package com.campuscart.backend.service;

import com.campuscart.backend.model.Listing;
import com.campuscart.backend.model.User;
import com.campuscart.backend.repository.ListingRepository;
import com.campuscart.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WishlistService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ListingRepository listingRepository;

    @Transactional
    public void addToWishlist(Long listingId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        
        user.getSavedListings().add(listing);
        userRepository.save(user);
    }

    @Transactional
    public void removeFromWishlist(Long listingId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        
        user.getSavedListings().remove(listing);
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<Listing> getUserWishlist(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return List.copyOf(user.getSavedListings());
    }
    
    @Transactional(readOnly = true)
    public List<Long> getUserWishlistIds(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getSavedListings().stream()
                .map(Listing::getId)
                .collect(Collectors.toList());
    }
}
