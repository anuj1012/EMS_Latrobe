package com.company.leaveapproval.controller;

import com.company.leaveapproval.dto.UserDto;
import com.company.leaveapproval.entity.Attendance;
import com.company.leaveapproval.entity.LeaveRequest;
import com.company.leaveapproval.entity.LeaveStatus;
import com.company.leaveapproval.entity.User;
import com.company.leaveapproval.repository.AttendanceRepository;
import com.company.leaveapproval.repository.LeaveRequestRepository;
import com.company.leaveapproval.repository.UserRepository;
import com.company.leaveapproval.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody UserDto userDto) {
        // Check if email already exists
        if (userService.existsByEmail(userDto.getEmail())) {
            throw new RuntimeException("Email is already in use!");
        }
        
        // Password is already encoded in the service, no need to encode it here
        return ResponseEntity.ok(userService.createUser(userDto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            System.out.println("=== ATTEMPTING USER DELETION ===");
            System.out.println("User ID: " + id);
            System.out.println("Thread: " + Thread.currentThread().getName());
            
            // Log the request details
            System.out.println("DELETE request received for user ID: " + id);
            
            // Check if user exists
            User userToDelete = userRepository.findById(id).orElse(null);
            if (userToDelete == null) {
                System.out.println("User not found with ID: " + id);
                return ResponseEntity.notFound().build();
            }
            
            System.out.println("Found user: " + userToDelete.getFirstName() + " " + userToDelete.getLastName() + " (" + userToDelete.getEmail() + ")");
            
            // Prevent deletion of the last admin user
            if (userToDelete.getRole() == com.company.leaveapproval.entity.Role.ADMIN) {
                long adminCount = userRepository.findAll().stream()
                    .filter(user -> user.getRole() == com.company.leaveapproval.entity.Role.ADMIN)
                    .count();
                
                if (adminCount <= 1) {
                    System.out.println("Cannot delete last admin user");
                    return ResponseEntity.badRequest().body("Cannot delete the last admin user");
                }
            }
            
            // STEP 1: Clear all references to this user in leave requests
            System.out.println("Clearing approval references...");
            List<LeaveRequest> approvedRequests = leaveRequestRepository.findByApprovedBy(userToDelete);
            System.out.println("Found " + approvedRequests.size() + " leave requests approved by this user");
            for (LeaveRequest request : approvedRequests) {
                request.setApprovedBy(null);
                request.setApprovedAt(null);
            }
            if (!approvedRequests.isEmpty()) {
                leaveRequestRepository.saveAll(approvedRequests);
                System.out.println("Cleared " + approvedRequests.size() + " approval references");
            }
            
            // STEP 2: Delete all leave requests by this user
            System.out.println("Deleting leave requests...");
            leaveRequestRepository.deleteByEmployeeId(id);
            System.out.println("Leave requests deleted");
            
            // STEP 3: Delete all attendance records for this user
            System.out.println("Deleting attendance records...");
            attendanceRepository.deleteByUserId(id);
            System.out.println("Attendance records deleted");
            
            // STEP 4: Delete the user
            System.out.println("Deleting user...");
            userRepository.delete(userToDelete);
            System.out.println("User deleted successfully");
            
            return ResponseEntity.ok().build();
            
        } catch (Exception e) {
            System.err.println("=== DELETION ERROR ===");
            System.err.println("Error deleting user: " + e.getMessage());
            System.err.println("Stack trace:");
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to delete employee: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/leave-stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getUserLeaveStats(
            @PathVariable Long id,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        
        Map<String, Object> stats = new HashMap<>();
        
        // Get all leave requests for this user
        List<LeaveRequest> allLeaves = leaveRequestRepository.findByEmployeeId(id);
        
        // Calculate total leave requests
        stats.put("totalLeaves", allLeaves.size());
        
        // Calculate total approved leave days
        long totalLeaveDays = allLeaves.stream()
            .filter(leave -> leave.getStatus() == LeaveStatus.APPROVED)
            .mapToLong(this::calculateLeaveDays)
            .sum();
        stats.put("totalLeaveDays", totalLeaveDays);
        
        // Filter by month/year if provided
        if (year != null && month != null) {
            YearMonth yearMonth = YearMonth.of(year, month);
            LocalDate start = yearMonth.atDay(1);
            LocalDate end = yearMonth.atEndOfMonth();
            
            List<LeaveRequest> monthlyLeaves = allLeaves.stream()
                .filter(leave -> leave.getStatus() == LeaveStatus.APPROVED)
                .filter(leave -> !leave.getStartDate().isBefore(start) && !leave.getStartDate().isAfter(end))
                .collect(Collectors.toList());
            
            // Calculate leave days for the specific month
            long monthlyLeaveDays = monthlyLeaves.stream()
                .mapToLong(this::calculateLeaveDays)
                .sum();
            
            stats.put("monthlyLeaves", monthlyLeaves.size());
            stats.put("monthlyLeaveDays", monthlyLeaveDays);
            stats.put("leaveDetails", monthlyLeaves);
        } else {
            stats.put("monthlyLeaves", allLeaves.size());
            stats.put("monthlyLeaveDays", totalLeaveDays);
            stats.put("leaveDetails", allLeaves);
        }
        
        return ResponseEntity.ok(stats);
    }

    private long calculateLeaveDays(LeaveRequest leave) {
        // Calculate the number of days between start and end date (inclusive)
        return ChronoUnit.DAYS.between(leave.getStartDate(), leave.getEndDate()) + 1;
    }

    // Utility endpoint to encode all plain-text passwords (for migration only)
    @PostMapping("/encode-passwords")
    public ResponseEntity<?> encodeAllPasswords() {
        int updated = 0;
        for (com.company.leaveapproval.entity.User user : userRepository.findAll()) {
            String pwd = user.getPassword();
            if (pwd != null && !pwd.startsWith("$2a$") && !pwd.startsWith("$2b$") && !pwd.startsWith("$2y$")) {
                user.setPassword(passwordEncoder.encode(pwd));
                userRepository.save(user);
                updated++;
            }
        }
        return ResponseEntity.ok("Updated passwords for " + updated + " users.");
    }

    // DEBUG ONLY: Test endpoint to manually delete a user (remove after debugging!)
    @DeleteMapping("/debug-delete/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> debugDeleteUser(@PathVariable Long id) {
        try {
            System.out.println("DEBUG: Attempting to delete user with ID: " + id);
            
            // Check if user exists
            boolean exists = userRepository.existsById(id);
            System.out.println("DEBUG: User exists: " + exists);
            
            if (!exists) {
                return ResponseEntity.notFound().build();
            }
            
            // Get user details
            User user = userRepository.findById(id).orElse(null);
            if (user != null) {
                System.out.println("DEBUG: User details - Name: " + user.getFirstName() + " " + user.getLastName() + ", Email: " + user.getEmail());
            }
            
            // Count related records
            long leaveRequests = leaveRequestRepository.findByEmployeeId(id).size();
            long attendanceRecords = attendanceRepository.findByUserId(id).size();
            System.out.println("DEBUG: Related records - Leave requests: " + leaveRequests + ", Attendance: " + attendanceRecords);
            
            // Try different deletion approaches
            System.out.println("DEBUG: Attempting direct deletion");
            userRepository.deleteById(id);
            
            System.out.println("DEBUG: User deleted successfully");
            return ResponseEntity.ok("User deleted successfully");
        } catch (Exception e) {
            System.err.println("DEBUG: Error deleting user: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    // EMERGENCY ONLY: Force delete user and all related records
    @DeleteMapping("/force-delete/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> forceDeleteUser(@PathVariable Long id) {
        try {
            System.out.println("=== FORCE DELETING USER ===");
            System.out.println("User ID: " + id);
            System.out.println("Thread: " + Thread.currentThread().getName());
            
            // Log the request details
            System.out.println("FORCE DELETE request received for user ID: " + id);
            
            // Check if user exists
            if (!userRepository.existsById(id)) {
                System.out.println("User not found with ID: " + id);
                return ResponseEntity.notFound().build();
            }
            
            // Get user details for logging
            User user = userRepository.findById(id).orElse(null);
            if (user != null) {
                System.out.println("Found user for force delete: " + user.getFirstName() + " " + user.getLastName() + " (" + user.getEmail() + ")");
            }
            
            // EMERGENCY DELETE APPROACH - Delete in specific order
            // 1. Clear all foreign key references first
            System.out.println("Step 1: Clearing foreign key references...");
            
            // Clear approved_by references
            List<LeaveRequest> approvedRequests = leaveRequestRepository.findAll().stream()
                .filter(lr -> lr.getApprovedBy() != null && lr.getApprovedBy().getId().equals(id))
                .collect(Collectors.toList());
                
            System.out.println("Found " + approvedRequests.size() + " leave requests approved by this user");
            for (LeaveRequest request : approvedRequests) {
                request.setApprovedBy(null);
                request.setApprovedAt(null);
            }
            if (!approvedRequests.isEmpty()) {
                leaveRequestRepository.saveAll(approvedRequests);
                System.out.println("Cleared " + approvedRequests.size() + " approval references");
            }
            
            // 2. Delete related records in correct order
            System.out.println("Step 2: Deleting related records...");
            System.out.println("Deleting leave requests for employee ID: " + id);
            leaveRequestRepository.deleteByEmployeeId(id);
            System.out.println("Leave requests deleted");
            
            System.out.println("Deleting attendance records for user ID: " + id);
            attendanceRepository.deleteByUserId(id);
            System.out.println("Attendance records deleted");
            
            // 3. Delete the user
            System.out.println("Step 3: Deleting user...");
            userRepository.deleteById(id);
            
            System.out.println("FORCE DELETE COMPLETED SUCCESSFULLY");
            return ResponseEntity.ok().body("User deleted successfully");
            
        } catch (Exception e) {
            System.err.println("=== FORCE DELETE FAILED ===");
            System.err.println("Error: " + e.getMessage());
            System.err.println("Stack trace:");
            e.printStackTrace();
            return ResponseEntity.status(500).body("Force delete failed: " + e.getMessage());
        }
    }

    // DEBUG ONLY: List all users' emails and password hashes (remove after debugging!)
    @GetMapping("/debug-list-users")
    public ResponseEntity<?> listAllUsers() {
        List<?> users = userRepository.findAll().stream()
                .map(u -> java.util.Map.of("email", u.getEmail(), "password", u.getPassword()))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(users);
    }

    // DEBUG ONLY: Check user dependencies before deletion
    @GetMapping("/debug-check/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> debugCheckUser(@PathVariable Long id) {
        try {
            System.out.println("=== DEBUG CHECK USER ===");
            System.out.println("Checking dependencies for user with ID: " + id);
            
            // Check if user exists
            User user = userRepository.findById(id).orElse(null);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            
            System.out.println("User: " + user.getFirstName() + " " + user.getLastName() + " (" + user.getEmail() + ")");
            
            // Check for related records
            List<LeaveRequest> leaveRequests = leaveRequestRepository.findByEmployeeId(id);
            List<Attendance> attendanceRecords = attendanceRepository.findByUserId(id);
            List<LeaveRequest> approvedRequests = leaveRequestRepository.findByApprovedBy(user);
            
            System.out.println("Leave requests submitted by user: " + leaveRequests.size());
            System.out.println("Attendance records for user: " + attendanceRecords.size());
            System.out.println("Leave requests approved by user: " + approvedRequests.size());
            
            // Check for any leave requests where this user is referenced as approved_by
            for (LeaveRequest request : approvedRequests) {
                System.out.println("Approved request ID " + request.getId() + " - Status: " + request.getStatus());
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("userId", id);
            result.put("name", user.getFirstName() + " " + user.getLastName());
            result.put("email", user.getEmail());
            result.put("leaveRequestsCount", leaveRequests.size());
            result.put("attendanceRecordsCount", attendanceRecords.size());
            result.put("approvedRequestsCount", approvedRequests.size());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("Error checking user: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
}