package com.campuscart.backend.repository;

import com.campuscart.backend.model.Listing;
import com.campuscart.backend.model.ListingStatus;
import com.campuscart.backend.model.Category;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListingRepository extends JpaRepository<Listing, Long>, JpaSpecificationExecutor<Listing> {
    List<Listing> findByStatusOrderByCreatedAtDesc(ListingStatus status);
    List<Listing> findByCategoryAndStatusOrderByCreatedAtDesc(Category category, ListingStatus status);
    List<Listing> findBySellerIdOrderByCreatedAtDesc(Long sellerId);
}
