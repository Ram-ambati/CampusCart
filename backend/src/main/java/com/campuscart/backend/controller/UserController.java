package com.campuscart.backend.controller;

import com.campuscart.backend.model.User;
import com.campuscart.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/me/about")
    public ResponseEntity<User> updateAbout(Authentication authentication, @RequestBody(required = false) Map<String, String> payload) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        String email = (String) authentication.getPrincipal();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        String about = payload != null ? payload.get("about") : null;
        if (about != null) {
            about = about.trim();
            if (about.length() > 500) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "About section cannot exceed 500 characters");
            }
        }

        user.setAbout(about);
        return ResponseEntity.ok(userRepository.save(user));
    }
}
