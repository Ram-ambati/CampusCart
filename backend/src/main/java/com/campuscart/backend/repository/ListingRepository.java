package com.campuscart.backend.repository;

import com.campuscart.backend.model.Listing;
import com.campuscart.backend.model.ListingStatus;
import com.campuscart.backend.model.Category;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ListingRepository extends JpaRepository<Listing, Long>, JpaSpecificationExecutor<Listing> {
    
    @EntityGraph(attributePaths = {"seller", "images"})
    List<Listing> findByStatusOrderByCreatedAtDesc(ListingStatus status);
    
    @EntityGraph(attributePaths = {"seller", "images"})
    List<Listing> findByCategoryAndStatusOrderByCreatedAtDesc(Category category, ListingStatus status);
    
    @EntityGraph(attributePaths = {"seller", "images"})
    List<Listing> findBySellerIdOrderByCreatedAtDesc(Long sellerId);
    
    @EntityGraph(attributePaths = {"seller", "images"})
    java.util.Optional<Listing> findById(Long id);
}
