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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

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

    @Transactional(readOnly = true)
    public Page<Listing> getAllActiveListings(Pageable pageable) {
        return searchListings(null, null, null, null, null, null, "newest", pageable);
    }

    @Transactional(readOnly = true)
    public Page<Listing> getActiveListingsByCategory(Category category, Pageable pageable) {
        return searchListings(category, null, null, null, null, null, "newest", pageable);
    }

    @Transactional(readOnly = true)
    public Page<Listing> searchListings(Category category, String q, java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice, String condition, Integer days, String sort, Pageable pageable) {
        Specification<Listing> spec = (root, query, cb) -> {
            if (Long.class != query.getResultType() && long.class != query.getResultType()) {
                root.fetch("seller", jakarta.persistence.criteria.JoinType.LEFT);
                root.fetch("images", jakarta.persistence.criteria.JoinType.LEFT);
                query.distinct(true);
            }
            
            List<Predicate> predicates = new ArrayList<>();
            
            // Only active listings
            predicates.add(cb.equal(root.get("status"), ListingStatus.ACTIVE));
            
            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            
            if (q != null && !q.trim().isEmpty()) {
                String pattern = "%" + q.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(titleMatch, descMatch));
            }
            
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }
            
            if (condition != null && !condition.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("itemCondition"), condition));
            }
            
            if (days != null) {
                LocalDateTime dateThreshold = LocalDateTime.now().minusDays(days);
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), dateThreshold));
            }
            
            // Handle Sorting
            if ("price_asc".equals(sort)) {
                query.orderBy(cb.asc(root.get("price")));
            } else if ("price_desc".equals(sort)) {
                query.orderBy(cb.desc(root.get("price")));
            } else if ("oldest".equals(sort)) {
                query.orderBy(cb.asc(root.get("createdAt")));
            } else {
                query.orderBy(cb.desc(root.get("createdAt"))); // default to newest
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        
        return listingRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public Listing getListingById(Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
    }

    @Transactional(readOnly = true)
    public List<Listing> getListingsBySellerId(Long sellerId) {
        return listingRepository.findBySellerIdOrderByCreatedAtDesc(sellerId);
    }

    @Transactional
    public void updateStatus(Long id, String userEmail, ListingStatus status) {
        Listing listing = getListingById(id);
        if (!listing.getSeller().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized");
        }
        listing.setStatus(status);
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
