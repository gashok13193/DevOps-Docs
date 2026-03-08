package com.devops.training;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Main Application Class
 * Entry point for the Spring Boot application
 * 
 * Interview Questions:
 * 1. What does @SpringBootApplication annotation do?
 *    - It combines @Configuration, @EnableAutoConfiguration, and @ComponentScan
 * 
 * 2. How does Spring Boot auto-configuration work?
 *    - It automatically configures beans based on classpath dependencies
 */
@SpringBootApplication
public class DevOpsApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(DevOpsApplication.class, args);
    }
}
