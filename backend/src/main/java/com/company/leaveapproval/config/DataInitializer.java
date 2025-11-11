package com.company.leaveapproval.config;

import com.company.leaveapproval.entity.Role;
import com.company.leaveapproval.entity.User;
import com.company.leaveapproval.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Create Admin user if not exists
        if (!userRepository.existsByEmail("admin@example.com")) {
            User admin = new User(
                    "Admin",
                    "User",
                    "admin@example.com",
                    passwordEncoder.encode("Admin@123"), // Encoded password
                    "IT",
                    "Administrator",
                    Role.ADMIN
            );
            admin.setCreatedAt(LocalDateTime.now());
            admin.setUpdatedAt(LocalDateTime.now());
            userRepository.save(admin);
            System.out.println("Admin user created: admin@example.com / Admin@123");
        }

        // Create Employee user if not exists
        if (!userRepository.existsByEmail("employee@example.com")) {
            User employee = new User(
                    "Employee",
                    "User",
                    "employee@example.com",
                    passwordEncoder.encode("Employee@123"), // Encoded password
                    "HR",
                    "HR Assistant",
                    Role.EMPLOYEE
            );
            employee.setCreatedAt(LocalDateTime.now());
            employee.setUpdatedAt(LocalDateTime.now());
            userRepository.save(employee);
            System.out.println("Employee user created: employee@example.com / Employee@123");
        }
    }
}





