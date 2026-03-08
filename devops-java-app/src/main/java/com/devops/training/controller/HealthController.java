package com.devops.training.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Health and Info Controller
 * Provides endpoints for health checks and application info
 * 
 * Interview Questions:
 * 1. Why is health check endpoint important in Kubernetes?
 * 2. What is the difference between liveness and readiness probes?
 * 3. How does Spring Boot Actuator help with monitoring?
 */
@RestController
@RequestMapping("/api")
@Tag(name = "Health & Info", description = "APIs for health checks and application info")
public class HealthController {
    
    @Value("${spring.application.name:devops-java-app}")
    private String appName;
    
    @Value("${app.version:1.0.0}")
    private String appVersion;
    
    @Value("${app.environment:development}")
    private String environment;
    
    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Basic health check endpoint")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(health);
    }
    
    @GetMapping("/info")
    @Operation(summary = "Application info", description = "Returns application information")
    public ResponseEntity<Map<String, Object>> info() {
        Map<String, Object> info = new HashMap<>();
        info.put("application", appName);
        info.put("version", appVersion);
        info.put("environment", environment);
        info.put("timestamp", LocalDateTime.now());
        info.put("javaVersion", System.getProperty("java.version"));
        return ResponseEntity.ok(info);
    }
    
    @GetMapping("/ready")
    @Operation(summary = "Readiness check", description = "Indicates if app is ready to receive traffic")
    public ResponseEntity<Map<String, Object>> readiness() {
        Map<String, Object> readiness = new HashMap<>();
        readiness.put("status", "READY");
        readiness.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(readiness);
    }
}
