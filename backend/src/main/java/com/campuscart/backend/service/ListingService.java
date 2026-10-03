package com.campuscart.backend.service;

import com.campuscart.backend.dto.ListingRequest;
import com.campuscart.backend.model.Category;
import com.campuscart.backend.model.Listing;
import com.campuscart.backend.model.ListingImage;
import com.campuscart.backend.model.ListingStatus;
import com.campuscart.backend.model.User;
import com.campuscart.backend.repository.ListingRepository;
import com.campuscart.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
public class ListingService {

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Transactional
    public Listing createListing(ListingRequest request, List<MultipartFile> files, String userEmail) throws IOException {
        User seller = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Listing listing = Listing.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .price(request.getPrice())
                .itemCondition(request.getItemCondition())
                .category(request.getCategory())
                .seller(seller)
                .status(ListingStatus.ACTIVE)
                .build();

        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    Map<String, Object> uploadResult = cloudinaryService.upload(file);
                    ListingImage listingImage = ListingImage.builder()
                            .imageUrl(uploadResult.get("secure_url").toString())
                            .cloudinaryPublicId(uploadResult.get("public_id").toString())
                            .listing(listing)
                            .build();
                    listing.getImages().add(listingImage);
                }
            }
        }

        return listingRepository.save(listing);
    }

    public List<Listing> getAllActiveListings() {
        return listingRepository.findByStatusOrderByCreatedAtDesc(ListingStatus.ACTIVE);
    }

    public List<Listing> getActiveListingsByCategory(Category category) {
        return listingRepository.findByCategoryAndStatusOrderByCreatedAtDesc(category, ListingStatus.ACTIVE);
    }

    public Listing getListingById(Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
    }

    public List<Listing> getListingsBySellerId(Long sellerId) {
        return listingRepository.findBySellerIdOrderByCreatedAtDesc(sellerId);
    }

    @Transactional
    public void markAsSold(Long id, String userEmail) {
        Listing listing = getListingById(id);
        if (!listing.getSeller().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized");
        }
        listing.setStatus(ListingStatus.SOLD);
        listingRepository.save(listing);
    }

    @Transactional
    public void deleteListing(Long id, String userEmail) {
        Listing listing = getListingById(id);
        if (!listing.getSeller().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized");
        }
        listing.setStatus(ListingStatus.DELETED);
        listingRepository.save(listing);
    }
}
