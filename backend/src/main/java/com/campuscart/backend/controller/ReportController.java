package com.campuscart.backend.controller;

import com.campuscart.backend.dto.ReportRequest;
import com.campuscart.backend.model.Report;
import com.campuscart.backend.model.User;
import com.campuscart.backend.repository.ReportRepository;
import com.campuscart.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<Report> submitReport(
            @RequestBody ReportRequest request,
            @AuthenticationPrincipal String email) {
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        
        Report report = Report.builder()
                .reporter(user)
                .targetType(request.getTargetType())
                .targetId(request.getTargetId())
                .reason(request.getReason())
                .build();
                
        return ResponseEntity.ok(reportRepository.save(report));
    }
}
