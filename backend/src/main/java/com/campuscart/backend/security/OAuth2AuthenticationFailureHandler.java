package com.campuscart.backend.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    private final HttpCookieOAuth2AuthorizationRequestRepository cookieAuthorizationRequestRepository;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
        cookieAuthorizationRequestRepository.removeAuthorizationRequestCookies(request, response);

        String errorMessage = "Authentication failed";
        if (exception != null) {
            if (exception.getMessage() != null && !exception.getMessage().isBlank()) {
                errorMessage = exception.getMessage();
            } else if (exception.getLocalizedMessage() != null && !exception.getLocalizedMessage().isBlank()) {
                errorMessage = exception.getLocalizedMessage();
            }
        }

        String baseUrl = frontendUrl != null ? frontendUrl.trim() : "http://localhost:5173";
        if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
            baseUrl = "https://" + baseUrl;
        }
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        String targetUrl = baseUrl + "/login";

        // Check if this was a mobile or admin app login request
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("mobile_redirect_uri".equals(cookie.getName())) {
                    targetUrl = java.net.URLDecoder.decode(cookie.getValue(), java.nio.charset.StandardCharsets.UTF_8).trim();
                    boolean isHttps = request.isSecure() || "https".equalsIgnoreCase(request.getHeader("X-Forwarded-Proto"));
                    org.springframework.http.ResponseCookie clearCookie = org.springframework.http.ResponseCookie
                            .from("mobile_redirect_uri", "")
                            .path("/")
                            .maxAge(0)
                            .sameSite("Lax")
                            .secure(isHttps)
                            .build();
                    response.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, clearCookie.toString());
                    cookie.setMaxAge(0);
                    cookie.setPath("/");
                    response.addCookie(cookie);
                    break;
                }
            }
        }

        String finalUrl = UriComponentsBuilder.fromUriString(targetUrl)
                .queryParam("error", errorMessage)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, finalUrl);
    }
}
