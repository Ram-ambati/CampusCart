CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    real_name VARCHAR(255) NOT NULL,
    preferred_name VARCHAR(255),
    avatar_url VARCHAR(255),
    about VARCHAR(500),
    role VARCHAR(50) NOT NULL,
    phone_number VARCHAR(50),
    branch VARCHAR(100),
    academic_year VARCHAR(50),
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP
);

CREATE TABLE listings (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    price NUMERIC(19, 2) NOT NULL,
    item_condition VARCHAR(255),
    category VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP,
    seller_id BIGINT NOT NULL,
    CONSTRAINT fk_listing_seller FOREIGN KEY (seller_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE listing_images (
    id BIGSERIAL PRIMARY KEY,
    image_url VARCHAR(255) NOT NULL,
    cloudinary_public_id VARCHAR(255) NOT NULL,
    listing_id BIGINT NOT NULL,
    CONSTRAINT fk_image_listing FOREIGN KEY (listing_id) REFERENCES listings (id) ON DELETE CASCADE
);
