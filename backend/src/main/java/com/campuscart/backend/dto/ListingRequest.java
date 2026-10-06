package com.campuscart.backend.dto;

import com.campuscart.backend.model.Category;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ListingRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 100, message = "Title must be between 3 and 100 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters")
    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "1.0", message = "Price must be at least ₹1")
    @DecimalMax(value = "1000000.0", message = "Price cannot exceed ₹10,00,000")
    private BigDecimal price;

    @NotBlank(message = "Condition is required")
    @Pattern(regexp = "^(NEW|LIKE_NEW|GOOD|FAIR|POOR)$", message = "Condition must be NEW, LIKE_NEW, GOOD, FAIR, or POOR")
    private String itemCondition;

    @NotNull(message = "Category is required")
    private Category category;
}
