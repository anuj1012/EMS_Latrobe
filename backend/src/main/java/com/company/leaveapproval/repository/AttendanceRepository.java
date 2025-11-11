package com.company.leaveapproval.repository;

import com.company.leaveapproval.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    
    // Get attendance records for a user, sorted by date descending (latest first)
    @Query("SELECT a FROM Attendance a WHERE a.user.id = :userId ORDER BY a.date DESC, a.checkInTime DESC, a.id DESC")
    List<Attendance> findByUserIdOrderByDateDesc(Long userId);
    
    // Get all attendance records, sorted by date descending (latest first)
    @Query("SELECT a FROM Attendance a ORDER BY a.date DESC, a.checkInTime DESC, a.id DESC")
    List<Attendance> findAllOrderByDateDesc();
    
    // Legacy method for backward compatibility
    List<Attendance> findByUserId(Long userId);
    
    void deleteByUserId(Long userId);
}