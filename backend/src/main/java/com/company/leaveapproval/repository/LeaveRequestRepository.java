package com.company.leaveapproval.repository;

import com.company.leaveapproval.entity.LeaveRequest;
import com.company.leaveapproval.entity.LeaveStatus;
import com.company.leaveapproval.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByEmployee(User employee);
    List<LeaveRequest> findByStatus(LeaveStatus status);
    List<LeaveRequest> findByEmployeeOrderByCreatedAtDesc(User employee);
    List<LeaveRequest> findAllByOrderByCreatedAtDesc();
    List<LeaveRequest> findByEmployeeId(Long employeeId);
    void deleteByEmployeeId(Long employeeId);
    List<LeaveRequest> findByApprovedBy(User approvedBy);
    void deleteByApprovedBy(User approvedBy);
}