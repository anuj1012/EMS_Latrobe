package com.company.leaveapproval.service;

import com.company.leaveapproval.dto.AttendanceDTO;
import com.company.leaveapproval.entity.Attendance;
import com.company.leaveapproval.entity.User;
import com.company.leaveapproval.repository.AttendanceRepository;
import com.company.leaveapproval.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MinIOService minIOService;

    public AttendanceDTO checkIn(AttendanceDTO attendanceDTO) {
        try {
            Attendance attendance = new Attendance();
            attendance.setDate(attendanceDTO.getDate());
            attendance.setCheckInTime(attendanceDTO.getCheckInTime());
            attendance.setStatus(attendanceDTO.getStatus());
            
            // Set user
            User user = userRepository.findById(attendanceDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + attendanceDTO.getUserId()));
            attendance.setUser(user);
            
            // Set optional fields
            if (attendanceDTO.getLatitude() != null) {
                attendance.setLatitude(attendanceDTO.getLatitude());
            }
            if (attendanceDTO.getLongitude() != null) {
                attendance.setLongitude(attendanceDTO.getLongitude());
            }
            if (attendanceDTO.getCheckInPhoto() != null && !attendanceDTO.getCheckInPhoto().isEmpty()) {
                // Check if it's base64 data or already a MinIO URL
                if (attendanceDTO.getCheckInPhoto().startsWith("data:image/")) {
                    // Upload base64 image to MinIO
                    String photoUrl = minIOService.uploadBase64Image(attendanceDTO.getCheckInPhoto(), "check-in");
                    attendance.setCheckInPhotoUrl(photoUrl);
                } else {
                    // Already a MinIO URL
                    attendance.setCheckInPhotoUrl(attendanceDTO.getCheckInPhoto());
                }
            } else if (attendanceDTO.getPhoto() != null && !attendanceDTO.getPhoto().isEmpty()) {
                // Check if it's base64 data or already a MinIO URL
                if (attendanceDTO.getPhoto().startsWith("data:image/")) {
                    // Upload base64 image to MinIO
                    String photoUrl = minIOService.uploadBase64Image(attendanceDTO.getPhoto(), "check-in");
                    attendance.setCheckInPhotoUrl(photoUrl);
                } else {
                    // Already a MinIO URL
                    attendance.setCheckInPhotoUrl(attendanceDTO.getPhoto());
                }
            }
            
            Attendance savedAttendance = attendanceRepository.save(attendance);
            return convertToDTO(savedAttendance);
        } catch (Exception e) {
            throw new RuntimeException("Check-in failed: " + e.getMessage() + ". Please ensure the user exists and all required fields are provided.");
        }
    }

    public AttendanceDTO checkOut(Long id, AttendanceDTO attendanceDTO) {
        try {
            Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attendance record not found with ID: " + id));
            
            attendance.setCheckOutTime(attendanceDTO.getCheckOutTime());
            attendance.setStatus(attendanceDTO.getStatus());
            
            // Update optional fields if provided
            if (attendanceDTO.getLatitude() != null) {
                attendance.setLatitude(attendanceDTO.getLatitude());
            }
            if (attendanceDTO.getLongitude() != null) {
                attendance.setLongitude(attendanceDTO.getLongitude());
            }
            if (attendanceDTO.getCheckOutPhoto() != null && !attendanceDTO.getCheckOutPhoto().isEmpty()) {
                // Check if it's base64 data or already a MinIO URL
                if (attendanceDTO.getCheckOutPhoto().startsWith("data:image/")) {
                    // Upload base64 image to MinIO
                    String photoUrl = minIOService.uploadBase64Image(attendanceDTO.getCheckOutPhoto(), "check-out");
                    attendance.setCheckOutPhotoUrl(photoUrl);
                } else {
                    // Already a MinIO URL
                    attendance.setCheckOutPhotoUrl(attendanceDTO.getCheckOutPhoto());
                }
            }
            
            Attendance updatedAttendance = attendanceRepository.save(attendance);
            return convertToDTO(updatedAttendance);
        } catch (Exception e) {
            throw new RuntimeException("Check-out failed: " + e.getMessage());
        }
    }

    public List<AttendanceDTO> getAllAttendanceRecords() {
        List<Attendance> attendances = attendanceRepository.findAllOrderByDateDesc();
        return attendances.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getAttendanceByUserId(Long userId) {
        List<Attendance> attendances = attendanceRepository.findByUserIdOrderByDateDesc(userId);
        return attendances.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public AttendanceDTO getAttendanceById(Long id) {
        Attendance attendance = attendanceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Attendance record not found with ID: " + id));
        return convertToDTO(attendance);
    }

    public AttendanceDTO checkInWithFile(AttendanceDTO attendanceDTO, MultipartFile checkInPhoto) {
        try {
            Attendance attendance = new Attendance();
            attendance.setDate(attendanceDTO.getDate());
            attendance.setCheckInTime(attendanceDTO.getCheckInTime());
            attendance.setStatus(attendanceDTO.getStatus());
            
            // Set user
            User user = userRepository.findById(attendanceDTO.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + attendanceDTO.getUserId()));
            attendance.setUser(user);
            
            // Set optional fields
            if (attendanceDTO.getLatitude() != null) {
                attendance.setLatitude(attendanceDTO.getLatitude());
            }
            if (attendanceDTO.getLongitude() != null) {
                attendance.setLongitude(attendanceDTO.getLongitude());
            }
            
            // Upload file to MinIO
            if (checkInPhoto != null && !checkInPhoto.isEmpty()) {
                String photoUrl = minIOService.uploadFile(checkInPhoto, "check-in");
                attendance.setCheckInPhotoUrl(photoUrl);
            }
            
            Attendance savedAttendance = attendanceRepository.save(attendance);
            return convertToDTO(savedAttendance);
        } catch (Exception e) {
            throw new RuntimeException("Error saving attendance record: " + e.getMessage());
        }
    }

    public AttendanceDTO checkOutWithFile(Long id, AttendanceDTO attendanceDTO, MultipartFile checkOutPhoto) {
        try {
            Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attendance record not found with ID: " + id));
            
            attendance.setCheckOutTime(attendanceDTO.getCheckOutTime());
            attendance.setStatus(attendanceDTO.getStatus());
            
            // Update optional fields if provided
            if (attendanceDTO.getLatitude() != null) {
                attendance.setLatitude(attendanceDTO.getLatitude());
            }
            if (attendanceDTO.getLongitude() != null) {
                attendance.setLongitude(attendanceDTO.getLongitude());
            }
            
            // Upload file to MinIO
            if (checkOutPhoto != null && !checkOutPhoto.isEmpty()) {
                String photoUrl = minIOService.uploadFile(checkOutPhoto, "check-out");
                attendance.setCheckOutPhotoUrl(photoUrl);
            }
            
            Attendance updatedAttendance = attendanceRepository.save(attendance);
            return convertToDTO(updatedAttendance);
        } catch (Exception e) {
            throw new RuntimeException("Error updating attendance record: " + e.getMessage());
        }
    }

    public String getPhotoUrl(String objectKey) {
        return minIOService.getFileUrl(objectKey);
    }

    public String testMinIO() {
        return minIOService.testConnection();
    }

    public String uploadTestPhoto() {
        return minIOService.uploadTestFile();
    }

    private AttendanceDTO convertToDTO(Attendance attendance) {
        AttendanceDTO dto = new AttendanceDTO();
        dto.setId(attendance.getId());
        dto.setUserId(attendance.getUser().getId());
        dto.setDate(attendance.getDate());
        dto.setCheckInTime(attendance.getCheckInTime());
        dto.setCheckOutTime(attendance.getCheckOutTime());
        dto.setStatus(attendance.getStatus());
        dto.setLatitude(attendance.getLatitude());
        dto.setLongitude(attendance.getLongitude());
        dto.setCheckInPhoto(attendance.getCheckInPhotoUrl());
        dto.setCheckOutPhoto(attendance.getCheckOutPhotoUrl());
        return dto;
    }
}