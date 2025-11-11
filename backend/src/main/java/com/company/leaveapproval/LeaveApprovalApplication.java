package com.company.leaveapproval;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = "com.company.leaveapproval.entity")
@EnableJpaRepositories(basePackages = "com.company.leaveapproval.repository")
public class LeaveApprovalApplication {

    public static void main(String[] args) {
        SpringApplication.run(LeaveApprovalApplication.class, args);
    }

}