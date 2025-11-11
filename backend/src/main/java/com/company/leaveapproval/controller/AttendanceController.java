package com.company.leaveapproval.controller;

import com.company.leaveapproval.dto.AttendanceDTO;
import com.company.leaveapproval.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @PostMapping("/check-in")
    public ResponseEntity<AttendanceDTO> checkIn(@RequestBody AttendanceDTO attendanceDTO) {
        try {
            AttendanceDTO result = attendanceService.checkIn(attendanceDTO);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(attendanceDTO);
        }
    }

    @PutMapping("/check-out/{id}")
    public ResponseEntity<AttendanceDTO> checkOut(@PathVariable Long id, @RequestBody AttendanceDTO attendanceDTO) {
        try {
            AttendanceDTO result = attendanceService.checkOut(id, attendanceDTO);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping
    public ResponseEntity<List<AttendanceDTO>> getAllAttendanceRecords() {
        try {
            List<AttendanceDTO> records = attendanceService.getAllAttendanceRecords();
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AttendanceDTO>> getAttendanceByUserId(@PathVariable Long userId) {
        try {
            List<AttendanceDTO> records = attendanceService.getAttendanceByUserId(userId);
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<AttendanceDTO> getAttendanceById(@PathVariable Long id) {
        try {
            AttendanceDTO record = attendanceService.getAttendanceById(id);
            return ResponseEntity.ok(record);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping(value = "/check-in/file", consumes = "multipart/form-data")
    public ResponseEntity<AttendanceDTO> checkInWithFile(
            @RequestParam("userId") Long userId,
            @RequestParam("date") String date,
            @RequestParam("checkInTime") String checkInTime,
            @RequestParam("status") String status,
            @RequestParam(value = "latitude", required = false) Double latitude,
            @RequestParam(value = "longitude", required = false) Double longitude,
            @RequestParam(value = "checkInPhoto", required = false) MultipartFile checkInPhoto) {
        try {
            AttendanceDTO attendanceDTO = new AttendanceDTO();
            attendanceDTO.setUserId(userId);
            attendanceDTO.setDate(date);
            attendanceDTO.setCheckInTime(parseDateTime(checkInTime));
            attendanceDTO.setStatus(status);
            attendanceDTO.setLatitude(latitude);
            attendanceDTO.setLongitude(longitude);
            
            AttendanceDTO result = attendanceService.checkInWithFile(attendanceDTO, checkInPhoto);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("Error in check-in with file: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping(value = "/check-out/{id}/file", consumes = "multipart/form-data")
    public ResponseEntity<AttendanceDTO> checkOutWithFile(
            @PathVariable Long id,
            @RequestParam("checkOutTime") String checkOutTime,
            @RequestParam("status") String status,
            @RequestParam(value = "latitude", required = false) Double latitude,
            @RequestParam(value = "longitude", required = false) Double longitude,
            @RequestParam(value = "checkOutPhoto", required = false) MultipartFile checkOutPhoto) {
        try {
            AttendanceDTO attendanceDTO = new AttendanceDTO();
            attendanceDTO.setCheckOutTime(parseDateTime(checkOutTime));
            attendanceDTO.setStatus(status);
            attendanceDTO.setLatitude(latitude);
            attendanceDTO.setLongitude(longitude);
            
            AttendanceDTO result = attendanceService.checkOutWithFile(id, attendanceDTO, checkOutPhoto);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/photo/{objectKey}")
    public ResponseEntity<String> getPhotoUrl(@PathVariable String objectKey) {
        try {
            // Check if it's an error case
            if ("error-uploading-photo".equals(objectKey)) {
                return ResponseEntity.badRequest().body("Photo upload failed - no photo available");
            }
            
            // Check if it's already a base64 data URL
            if (objectKey.startsWith("data:")) {
                return ResponseEntity.ok(objectKey);
            }
            
            // Check if it's already a regular URL
            if (objectKey.startsWith("http")) {
                return ResponseEntity.ok(objectKey);
            }
            
            // For MinIO object keys, try to get presigned URL
            String photoUrl = attendanceService.getPhotoUrl(objectKey);
            return ResponseEntity.ok(photoUrl);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/test-minio")
    public ResponseEntity<String> testMinIO() {
        try {
            String result = attendanceService.testMinIO();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("MinIO Error: " + e.getMessage());
        }
    }

    @GetMapping("/public/test-minio")
    public ResponseEntity<String> testMinIOPublic() {
        try {
            String result = attendanceService.testMinIO();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("MinIO Error: " + e.getMessage());
        }
    }

    @PostMapping("/upload-test-photo")
    public ResponseEntity<String> uploadTestPhoto() {
        try {
            String result = attendanceService.uploadTestPhoto();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Upload Error: " + e.getMessage());
        }
    }

    @PostMapping("/public/upload-test-photo")
    public ResponseEntity<String> uploadTestPhotoPublic() {
        try {
            String result = attendanceService.uploadTestPhoto();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Upload Error: " + e.getMessage());
        }
    }

    private java.time.LocalDateTime parseDateTime(String dateTimeString) {
        try {
            // First try to parse as ISO 8601 with timezone (e.g., "2025-01-06T12:30:00.000Z")
            if (dateTimeString.contains("T") && (dateTimeString.endsWith("Z") || dateTimeString.contains("+"))) {
                java.time.Instant instant = java.time.Instant.parse(dateTimeString);
                // Convert to system local time since frontend sends local time
                return java.time.LocalDateTime.ofInstant(instant, java.time.ZoneId.systemDefault());
            }
            // Try to parse as LocalDateTime directly (this is what we expect from frontend now)
            return java.time.LocalDateTime.parse(dateTimeString);
        } catch (Exception e) {
            // Fallback: try to parse as Instant and convert to local time
            try {
                java.time.Instant instant = java.time.Instant.parse(dateTimeString);
                return java.time.LocalDateTime.ofInstant(instant, java.time.ZoneId.systemDefault());
            } catch (Exception e2) {
                // If all else fails, return current local time
                System.err.println("Failed to parse date time: " + dateTimeString + ", using current local time");
                return java.time.LocalDateTime.now();
            }
        }
    }
}