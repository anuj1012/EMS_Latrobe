package com.company.leaveapproval.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Attendance {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;
    
    @Column(name = "date", nullable = false)
    private String date; // YYYY-MM-DD format
    
    @Column(name = "check_in_time", nullable = false)
    private LocalDateTime checkInTime;
    
    @Column(name = "check_out_time")
    private LocalDateTime checkOutTime;
    
    @Column(name = "status", nullable = false)
    private String status; // "In Progress" or "Completed"
    
    @Column(name = "latitude")
    private Double latitude;
    
    @Column(name = "longitude")
    private Double longitude;
    
    @Column(name = "check_in_photo_url", length = 500)
    private String checkInPhotoUrl; // MinIO URL for check-in photo
    
    @Column(name = "check_out_photo_url", length = 500)
    private String checkOutPhotoUrl; // MinIO URL for check-out photo
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public Attendance() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public String getCheckInPhotoUrl() {
        return checkInPhotoUrl;
    }

    public void setCheckInPhotoUrl(String checkInPhotoUrl) {
        this.checkInPhotoUrl = checkInPhotoUrl;
    }

    public String getCheckOutPhotoUrl() {
        return checkOutPhotoUrl;
    }

    public void setCheckOutPhotoUrl(String checkOutPhotoUrl) {
        this.checkOutPhotoUrl = checkOutPhotoUrl;
    }

    // Deprecated getters for backward compatibility
    public String getCheckInPhoto() {
        return checkInPhotoUrl;
    }

    public void setCheckInPhoto(String checkInPhoto) {
        this.checkInPhotoUrl = checkInPhoto;
    }

    public String getCheckOutPhoto() {
        return checkOutPhotoUrl;
    }

    public void setCheckOutPhoto(String checkOutPhoto) {
        this.checkOutPhotoUrl = checkOutPhoto;
    }

    public String getPhoto() {
        return checkInPhotoUrl;
    }

    public void setPhoto(String photo) {
        this.checkInPhotoUrl = photo;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    @Override
    public String toString() {
        return "Attendance{" +
                "id=" + id +
                ", date='" + date + '\'' +
                ", checkInTime=" + checkInTime +
                ", checkOutTime=" + checkOutTime +
                ", status='" + status + '\'' +
                ", latitude=" + latitude +
                ", longitude=" + longitude +
                ", checkInPhotoUrl='" + checkInPhotoUrl + "'" +
                ", checkOutPhotoUrl='" + checkOutPhotoUrl + "'" +
                '}';
    }
}