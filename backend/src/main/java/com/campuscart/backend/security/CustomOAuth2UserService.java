package com.campuscart.backend.security;

import com.campuscart.backend.model.Role;
import com.campuscart.backend.model.User;
import com.campuscart.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        String email = oAuth2User.getAttribute("email");
        
        // 1. Enforce domain restriction for peer-to-peer trust
        if (email == null || !email.endsWith("@anurag.edu.in")) {
            throw new OAuth2AuthenticationException(new OAuth2Error("invalid_domain"), "Only @anurag.edu.in emails are allowed to login.");
        }

        // 2. Sync to Database
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            User newUser = User.builder()
                    .email(email)
                    .realName(oAuth2User.getAttribute("name"))
                    .avatarUrl(oAuth2User.getAttribute("picture"))
                    .role(Role.STUDENT)
                    .onboardingCompleted(false)
                    .build();
            userRepository.save(newUser);
        }

        return oAuth2User;
    }
}
