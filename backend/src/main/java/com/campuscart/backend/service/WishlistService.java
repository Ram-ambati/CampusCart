package com.campuscart.backend.service;

import com.campuscart.backend.model.Listing;
import com.campuscart.backend.model.User;
import com.campuscart.backend.repository.ListingRepository;
import com.campuscart.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
        if (listingId == null || listingId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid listing ID is required");
        }
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        
        user.getSavedListings().add(listing);
        userRepository.save(user);
    }

    @Transactional
    public void removeFromWishlist(Long listingId, String userEmail) {
        if (listingId == null || listingId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid listing ID is required");
        }
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        
        user.getSavedListings().remove(listing);
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<Listing> getUserWishlist(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        return List.copyOf(user.getSavedListings());
    }
    
    @Transactional(readOnly = true)
    public List<Long> getUserWishlistIds(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        return user.getSavedListings().stream()
                .map(Listing::getId)
                .collect(Collectors.toList());
    }
}
