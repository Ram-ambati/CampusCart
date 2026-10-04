CREATE TABLE saved_listings (
    user_id BIGINT NOT NULL,
    listing_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, listing_id),
    CONSTRAINT fk_saved_listings_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_saved_listings_listing FOREIGN KEY (listing_id) REFERENCES listings (id) ON DELETE CASCADE
);
