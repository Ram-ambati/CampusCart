package com.campuscart.backend.security;

import com.campuscart.backend.model.Role;
import com.campuscart.backend.model.User;
import com.campuscart.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        String rawEmail = oAuth2User.getAttribute("email");
        if (rawEmail == null || rawEmail.isBlank()) {
            throw new OAuth2AuthenticationException(new OAuth2Error("missing_email"), "Google profile does not contain an email address.");
        }
        
        String email = rawEmail.trim().toLowerCase();
        
        // 1. Enforce domain restriction for peer-to-peer trust
        if (!email.endsWith("@anurag.edu.in")) {
            throw new OAuth2AuthenticationException(new OAuth2Error("invalid_domain"), "Only @anurag.edu.in emails are allowed to login.");
        }

        // 2. Safe name extraction with fallback
        String realName = oAuth2User.getAttribute("name");
        if (realName == null || realName.isBlank()) {
            String givenName = oAuth2User.getAttribute("given_name");
            String familyName = oAuth2User.getAttribute("family_name");
            if (givenName != null && !givenName.isBlank()) {
                realName = (givenName + " " + (familyName != null ? familyName : "")).trim();
            } else {
                realName = email.split("@")[0];
            }
        }

        // 3. Sync to Database
        try {
            Optional<User> userOptional = userRepository.findByEmail(email);
            if (userOptional.isEmpty()) {
                User newUser = User.builder()
                        .email(email)
                        .realName(realName)
                        .avatarUrl(oAuth2User.getAttribute("picture"))
                        .role(Role.STUDENT)
                        .onboardingCompleted(false)
                        .build();
                userRepository.save(newUser);
                log.info("Successfully provisioned new student account for {}", email);
            }
        } catch (Exception e) {
            log.error("Database error while syncing user {}: {}", email, e.getMessage(), e);
            throw new OAuth2AuthenticationException(new OAuth2Error("database_error"), "Database sync failed: " + e.getMessage());
        }

        return oAuth2User;
    }
}
