package com.company.leaveapproval.controller;

import com.company.leaveapproval.dto.LeaveApprovalDto;
import com.company.leaveapproval.dto.LeaveRequestDto;
import com.company.leaveapproval.entity.LeaveRequest;
import com.company.leaveapproval.entity.LeaveStatus;
import com.company.leaveapproval.entity.User;
import com.company.leaveapproval.repository.LeaveRequestRepository;
import com.company.leaveapproval.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/leaves")
public class LeaveRequestController {

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/apply")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMIN')")
    public ResponseEntity<?> applyLeave(@Valid @RequestBody LeaveRequestDto leaveRequestDto, 
                                       Authentication authentication) {
        User employee = (User) authentication.getPrincipal();

        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setEmployee(employee);
        leaveRequest.setStartDate(leaveRequestDto.getStartDate());
        leaveRequest.setEndDate(leaveRequestDto.getEndDate());
        leaveRequest.setLeaveType(leaveRequestDto.getLeaveType());
        leaveRequest.setReason(leaveRequestDto.getReason());

        LeaveRequest savedRequest = leaveRequestRepository.save(leaveRequest);

        return ResponseEntity.ok(convertToDto(savedRequest));
    }

    @GetMapping("/my-requests")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMIN')")
    public ResponseEntity<List<LeaveRequestDto>> getMyLeaveRequests(Authentication authentication) {
        User employee = (User) authentication.getPrincipal();
        List<LeaveRequest> requests = leaveRequestRepository.findByEmployeeOrderByCreatedAtDesc(employee);

        List<LeaveRequestDto> dtos = requests.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<LeaveRequestDto>> getAllLeaveRequests() {
        List<LeaveRequest> requests = leaveRequestRepository.findAllByOrderByCreatedAtDesc();

        List<LeaveRequestDto> dtos = requests.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<LeaveRequestDto>> getPendingLeaveRequests() {
        List<LeaveRequest> requests = leaveRequestRepository.findByStatus(LeaveStatus.PENDING);

        List<LeaveRequestDto> dtos = requests.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveLeaveRequest(@PathVariable Long id, 
                                               @Valid @RequestBody LeaveApprovalDto approvalDto,
                                               Authentication authentication) {
        User admin = (User) authentication.getPrincipal();

        LeaveRequest leaveRequest = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));

        leaveRequest.setStatus(LeaveStatus.valueOf(approvalDto.getStatus()));
        leaveRequest.setAdminComment(approvalDto.getAdminComment());
        leaveRequest.setApprovedBy(admin);
        leaveRequest.setApprovedAt(LocalDateTime.now());

        LeaveRequest updatedRequest = leaveRequestRepository.save(leaveRequest);

        return ResponseEntity.ok(convertToDto(updatedRequest));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYEE') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteLeaveRequest(@PathVariable Long id, Authentication authentication) {
        User currentUser = (User) authentication.getPrincipal();
        
        LeaveRequest leaveRequest = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));

        // Only allow deletion by the employee who created it or admin
        if (!leaveRequest.getEmployee().getId().equals(currentUser.getId()) && 
            !currentUser.getRole().name().equals("ADMIN")) {
            return ResponseEntity.status(403).body("Not authorized to delete this request");
        }

        // Only allow deletion if status is PENDING
        if (leaveRequest.getStatus() != LeaveStatus.PENDING) {
            return ResponseEntity.badRequest().body("Cannot delete processed leave request");
        }

        leaveRequestRepository.delete(leaveRequest);
        return ResponseEntity.ok().build();
    }

    private LeaveRequestDto convertToDto(LeaveRequest request) {
        LeaveRequestDto dto = new LeaveRequestDto();
        dto.setId(request.getId());
        dto.setStartDate(request.getStartDate());
        dto.setEndDate(request.getEndDate());
        dto.setLeaveType(request.getLeaveType());
        dto.setReason(request.getReason());
        dto.setStatus(request.getStatus().name());
        dto.setAdminComment(request.getAdminComment());
        
        // Handle employee information safely
        if (request.getEmployee() != null) {
            dto.setEmployeeName(request.getEmployee().getFirstName() + " " + request.getEmployee().getLastName());
            dto.setEmployeeEmail(request.getEmployee().getEmail());
        }
        
        // Handle approved by information safely
        if (request.getApprovedBy() != null) {
            dto.setApprovedByName(request.getApprovedBy().getFirstName() + " " + request.getApprovedBy().getLastName());
        }
        return dto;
    }
}