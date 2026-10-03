package com.campuscart.backend.controller;

import com.campuscart.backend.dto.OnboardingRequest;
import com.campuscart.backend.model.User;
import com.campuscart.backend.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String email = (String) authentication.getPrincipal();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(user);
    }

    @PostMapping("/onboard")
    public ResponseEntity<User> completeOnboarding(Authentication authentication, 
                                                   @Valid @RequestBody OnboardingRequest request) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String email = (String) authentication.getPrincipal();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isOnboardingCompleted()) {
            return ResponseEntity.badRequest().build(); // Already onboarded
        }

        user.setPreferredName(request.getPreferredName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setBranch(request.getBranch());
        user.setAcademicYear(request.getAcademicYear());
        user.setOnboardingCompleted(true);

        User updatedUser = userRepository.save(user);

        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/mobile-login")
    public void mobileLogin(@RequestParam("redirect_uri") String redirectUri, jakarta.servlet.http.HttpServletRequest request, jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        // Save the Expo deep link in a short-lived cookie
        jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("mobile_redirect_uri", java.net.URLEncoder.encode(redirectUri, java.nio.charset.StandardCharsets.UTF_8));
        cookie.setPath("/");
        cookie.setMaxAge(300); // 5 minutes
        response.addCookie(cookie);
        
        // Trigger standard Spring Security OAuth2 (force absolute URL without port to fix DevTunnel quirks)
        String host = request.getServerName();
        String scheme = request.getHeader("X-Forwarded-Proto") != null ? request.getHeader("X-Forwarded-Proto") : request.getScheme();
        
        // If it's localhost, we can append 8080, but if it's a devtunnel, we omit the port since it defaults to 443 (HTTPS)
        String port = host.equals("localhost") ? ":8080" : "";
        String redirectUrl = scheme + "://" + host + port + "/oauth2/authorization/google";
        
        response.sendRedirect(redirectUrl);
    }
}
