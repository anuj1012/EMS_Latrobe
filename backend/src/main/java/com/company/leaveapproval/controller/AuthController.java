package com.company.leaveapproval.controller;

import com.company.leaveapproval.dto.JwtResponse;
import com.company.leaveapproval.dto.LoginRequest;
import com.company.leaveapproval.entity.User;
import com.company.leaveapproval.repository.UserRepository;
import com.company.leaveapproval.security.JwtUtils;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    UserRepository userRepository;

    // Test endpoint to verify database connection
    @GetMapping("/test-db")
    public ResponseEntity<?> testDatabaseConnection() {
        try {
            long count = userRepository.count();
            return ResponseEntity.ok("Database connection successful. User count: " + count);
        } catch (Exception e) {
            logger.error("Database connection failed: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Database connection failed: " + e.getMessage());
        }
    }

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        logger.debug("Login attempt for email: {}", loginRequest.getEmail());
        try {
            // Log all users for debugging
            logger.debug("Current users in database:");
            userRepository.findAll().forEach(user -> {
                logger.debug("User: {} with email: {} and role: {}", 
                    user.getFirstName() + " " + user.getLastName(), 
                    user.getEmail(), 
                    user.getRole());
            });
            String normalizedEmail = loginRequest.getEmail() == null ? null : loginRequest.getEmail().trim().toLowerCase();
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, loginRequest.getPassword()));
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);
            User userDetails = (User) authentication.getPrincipal();
            logger.debug("Login successful for email: {}", normalizedEmail);
            return ResponseEntity.ok(new JwtResponse(jwt,
                    userDetails.getId(),
                    userDetails.getEmail(),
                    userDetails.getFirstName(),
                    userDetails.getLastName(),
                    userDetails.getRole().name()));
        } catch (Exception e) {
            logger.warn("Login failed for email: {}: {}", loginRequest.getEmail(), e.getMessage());
            logger.warn("Exception type: {}", e.getClass().getName());
            return ResponseEntity.status(401).body("Invalid email or password");
        }
    }
}