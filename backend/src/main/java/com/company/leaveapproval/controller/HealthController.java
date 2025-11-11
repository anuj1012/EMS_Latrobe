package com.company.leaveapproval.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @Autowired
    private DataSource dataSource;

    @GetMapping
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", System.currentTimeMillis());
        
        // Check database connectivity
        try (Connection connection = dataSource.getConnection()) {
            health.put("database", "UP");
        } catch (Exception e) {
            health.put("database", "DOWN");
            health.put("databaseError", e.getMessage());
        }
        
        return ResponseEntity.ok(health);
    }

    @GetMapping("/ready")
    public ResponseEntity<Map<String, Object>> readinessCheck() {
        Map<String, Object> readiness = new HashMap<>();
        
        try (Connection connection = dataSource.getConnection()) {
            readiness.put("status", "READY");
            readiness.put("database", "CONNECTED");
        } catch (Exception e) {
            readiness.put("status", "NOT_READY");
            readiness.put("database", "DISCONNECTED");
            readiness.put("error", e.getMessage());
        }
        
        return ResponseEntity.ok(readiness);
    }
}






