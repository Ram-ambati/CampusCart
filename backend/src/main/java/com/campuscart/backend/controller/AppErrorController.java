package com.campuscart.backend.controller;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Controller
public class AppErrorController {

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @RequestMapping("/error")
    public Object handleError(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Object statusObj = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        Object messageObj = request.getAttribute(RequestDispatcher.ERROR_MESSAGE);
        Object exceptionObj = request.getAttribute(RequestDispatcher.ERROR_EXCEPTION);

        int statusCode = HttpStatus.INTERNAL_SERVER_ERROR.value();
        if (statusObj != null) {
            try {
                statusCode = Integer.parseInt(statusObj.toString());
            } catch (NumberFormatException ignored) {}
        }

        String message = messageObj != null ? messageObj.toString() : "An unexpected error occurred";
        if (exceptionObj instanceof Throwable) {
            log.error("Unhandled error [status {}]: {}", statusCode, ((Throwable) exceptionObj).getMessage(), (Throwable) exceptionObj);
        } else {
            log.warn("Handled error route [status {}]: {}", statusCode, message);
        }

        String acceptHeader = request.getHeader("Accept");
        String uri = (String) request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
        if (uri == null) {
            uri = request.getRequestURI();
        }

        // Return JSON for API calls or when JSON is requested
        if ((uri != null && uri.startsWith("/api")) || (acceptHeader != null && acceptHeader.contains("application/json"))) {
            Map<String, Object> body = new HashMap<>();
            body.put("status", statusCode);
            body.put("error", message);
            return ResponseEntity.status(statusCode).body(body);
        }

        // For browser navigation (e.g. Mobile Chrome OAuth callback issues), redirect gracefully to login
        String baseUrl = frontendUrl != null ? frontendUrl.trim() : "http://localhost:5173";
        if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
            baseUrl = "https://" + baseUrl;
        }
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }

        String redirectUrl = UriComponentsBuilder.fromUriString(baseUrl + "/login")
                .queryParam("error", "auth_failed")
                .build().toUriString();

        response.sendRedirect(redirectUrl);
        return null;
    }
}
