package com.company.leaveapproval.dto;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;

public class AttendanceDTO {
    private Long id;
    private Long userId;
    private String date;
    
    private LocalDateTime checkInTime;
    
    private LocalDateTime checkOutTime;
    
    private String status;
    private Double latitude;
    private Double longitude;
    private String photo; // Check-in photo for backward compatibility
    private String checkInPhoto; // Check-in photo
    private String checkOutPhoto; // Check-out photo

    // Constructors
    public AttendanceDTO() {
    }

    public AttendanceDTO(Long id, Long userId, String date, LocalDateTime checkInTime, 
                        LocalDateTime checkOutTime, String status, Double latitude, 
                        Double longitude, String checkInPhoto, String checkOutPhoto) {
        this.id = id;
        this.userId = userId;
        this.date = date;
        this.checkInTime = checkInTime;
        this.checkOutTime = checkOutTime;
        this.status = status;
        this.latitude = latitude;
        this.longitude = longitude;
        this.checkInPhoto = checkInPhoto;
        this.checkOutPhoto = checkOutPhoto;
        // For backward compatibility
        this.photo = checkInPhoto;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public LocalDateTime getCheckInTime() {
        return checkInTime;
    }

    public void setCheckInTime(LocalDateTime checkInTime) {
        this.checkInTime = checkInTime;
    }

    public LocalDateTime getCheckOutTime() {
        return checkOutTime;
    }

    public void setCheckOutTime(LocalDateTime checkOutTime) {
        this.checkOutTime = checkOutTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    // Deprecated getter for backward compatibility
    public String getPhoto() {
        return checkInPhoto;
    }

    // Deprecated setter for backward compatibility
    public void setPhoto(String photo) {
        this.checkInPhoto = photo;
        // Also set the main photo field for backward compatibility
        this.photo = photo;
    }

    public String getCheckInPhoto() {
        return checkInPhoto;
    }

    public void setCheckInPhoto(String checkInPhoto) {
        this.checkInPhoto = checkInPhoto;
        // Also set the main photo field for backward compatibility
        this.photo = checkInPhoto;
    }

    public String getCheckOutPhoto() {
        return checkOutPhoto;
    }

    public void setCheckOutPhoto(String checkOutPhoto) {
        this.checkOutPhoto = checkOutPhoto;
    }
    
    @Override
    public String toString() {
        return "AttendanceDTO{" +
                "id=" + id +
                ", userId=" + userId +
                ", date='" + date + '\'' +
                ", checkInTime=" + checkInTime +
                ", checkOutTime=" + checkOutTime +
                ", status='" + status + '\'' +
                ", latitude=" + latitude +
                ", longitude=" + longitude +
                ", checkInPhoto='" + (checkInPhoto != null ? checkInPhoto.substring(0, Math.min(50, checkInPhoto.length())) : "null") + "...'" +
                ", checkOutPhoto='" + (checkOutPhoto != null ? checkOutPhoto.substring(0, Math.min(50, checkOutPhoto.length())) : "null") + "...'" +
                '}';
    }
}