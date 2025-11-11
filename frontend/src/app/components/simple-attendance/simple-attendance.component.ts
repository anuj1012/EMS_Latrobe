import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, DoCheck } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AttendanceService } from '../../services/attendance.service';
import { ToastService } from '../../services/toast.service';
import { AttendanceStateService } from '../../services/attendance-state.service';
import { User } from '../../models/user.model';
import { AttendanceRecord } from '../../models/attendance.model';

@Component({
  selector: 'app-simple-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="attendance-header">
        <h4 class="attendance-title">
          <i class="material-icons md-32">schedule</i>
          Attendance
        </h4>
        <p class="attendance-subtitle">Mark your attendance with photo and location verification</p>
                <div *ngIf="currentAttendanceRecord" class="attendance-status-badge">
                  <span class="badge rounded-pill" [ngClass]="getAttendanceStatusClass(currentAttendanceRecord.status)">
                    <i class="material-icons md-16 me-1" *ngIf="currentAttendanceRecord.status === 'In Progress'">schedule</i>
                    <i class="material-icons md-16 me-1" *ngIf="currentAttendanceRecord.status === 'Completed'">check_circle</i>
                    {{ currentAttendanceRecord.status === 'In Progress' ? 'Pending Check-out' : 'Completed' }}
                  </span>
                </div>
      </div>

      <div *ngIf="!isCheckedIn" class="check-in-section">
        <div class="row">
          <div class="col-md-6 mb-4">
            <div class="card camera-card">
              <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="material-icons md-20">camera_alt</i>Check-in Camera</h5>
              </div>
              <div class="card-body d-flex flex-column align-items-center justify-content-center">
                <div class="camera-container">
                  <video #checkInVideo autoplay playsinline class="camera-feed"></video>
                  <div class="camera-overlay" *ngIf="!cameraActive">
                    <i class="material-icons">videocam_off</i>
                    <p>Camera not active</p>
                    <button class="btn btn-sm btn-primary" (click)="startCamera()">
                      <i class="material-icons md-16">videocam</i>
                      Start Camera
                    </button>
                  </div>
                </div>
                <button class="btn btn-success mt-3 glass-button" (click)="capturePhoto('checkIn')" [disabled]="!cameraActive">
                  <i class="material-icons md-24">camera_alt</i>
                  Capture Check-in Photo
                </button>
                <div class="mt-2">
                  <input type="file" #checkInFileInput accept="image/*" (change)="onFileSelected($event, 'checkIn')" class="form-control" style="display: none;">
                  <button class="btn btn-outline-primary btn-sm glass-button-outline" (click)="checkInFileInput.click()">
                    <i class="material-icons md-18">upload_file</i>
                    Upload Photo
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-6 mb-4">
            <div class="card photo-preview-card">
              <div class="card-header bg-success text-white">
                <h5 class="mb-0"><i class="material-icons md-20">image</i>Check-in Photo Preview</h5>
              </div>
              <div class="card-body d-flex flex-column align-items-center justify-content-center">
                <div class="photo-preview-container">
                  <img *ngIf="checkInPhoto" [src]="getPhotoDisplayUrl(checkInPhoto)" alt="Check-in Photo" class="img-fluid captured-photo" (error)="onPhotoError($event)">
                  <div *ngIf="!checkInPhoto" class="photo-placeholder">
                    <i class="material-icons">photo_camera</i>
                    <p>No photo captured</p>
                  </div>
                </div>
                <button *ngIf="checkInPhoto" class="btn btn-danger mt-3 glass-button" (click)="checkInPhoto = null">
                  <i class="material-icons md-20">refresh</i>
                  Retake Photo
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="card location-card mb-4">
          <div class="card-header bg-info text-white">
                <h5 class="mb-0"><i class="material-icons md-20">location_on</i>Location Services</h5>
          </div>
          <div class="card-body d-flex flex-column align-items-center justify-content-center">
            <button class="btn btn-info" (click)="enableLocation()" [disabled]="locationEnabled || locationLoading">
              <i class="material-icons md-18" *ngIf="!locationLoading">location_on</i>
              <div class="spinner-border spinner-border-sm me-2" role="status" *ngIf="locationLoading">
                <span class="visually-hidden">Loading...</span>
              </div>
              {{ locationLoading ? 'Getting Location...' : (locationEnabled ? 'Location Enabled' : 'Enable Location') }}
            </button>
            <div *ngIf="locationEnabled && locationCoordinates" class="location-info mt-3">
              <i class="material-icons">check_circle</i>
              <span>Location: {{ locationCoordinates.latitude | number:'1.6-6' }}, {{ locationCoordinates.longitude | number:'1.6-6' }}</span>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-center gap-2 mb-4">
          <button class="btn btn-primary btn-lg check-in-btn glass-button" (click)="checkIn()" [disabled]="!checkInPhoto && !checkInPhotoFile || !locationEnabled">
            <i class="material-icons md-24">login</i>
            Check In
          </button>
          <div *ngIf="(!checkInPhoto && !checkInPhotoFile) || !locationEnabled" class="mt-2">
            <small class="text-danger">
              <i class="material-icons me-1" style="font-size: 16px;">info</i>
              Please complete all requirements:
              <br>• {{ (!checkInPhoto && !checkInPhotoFile) ? 'Capture or upload photo' : '✓ Photo ready' }}
              <br>• {{ !locationEnabled ? 'Enable location' : '✓ Location enabled' }}
            </small>
          </div>
        </div>
      </div>

      <div *ngIf="isCheckedIn" class="check-out-section">
        <div class="row">
          <div class="col-md-6 mb-4">
            <div class="card camera-card">
              <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="material-icons me-2">camera_alt</i>Check-out Camera</h5>
              </div>
              <div class="card-body d-flex flex-column align-items-center justify-content-center">
                <div class="camera-container">
                  <video #checkOutVideo autoplay playsinline class="camera-feed"></video>
                  <div class="camera-overlay" *ngIf="!cameraActive">
                    <i class="material-icons">videocam_off</i>
                    <p>Camera not active</p>
                    <button class="btn btn-sm btn-primary" (click)="startCamera()">
                      <i class="material-icons md-16">videocam</i>
                      Start Camera
                    </button>
                  </div>
                  <div class="camera-overlay" *ngIf="cameraActive && checkOutVideo && !checkOutVideo.srcObject">
                    <i class="material-icons">refresh</i>
                    <p>Camera not showing</p>
                    <button class="btn btn-sm btn-warning" (click)="refreshCameraForCheckout()">
                      <i class="material-icons me-1">refresh</i>
                      Refresh Camera
                    </button>
                  </div>
                </div>
                <button class="btn btn-success mt-3 glass-button" (click)="capturePhoto('checkOut')" [disabled]="!cameraActive">
                  <i class="material-icons md-24">camera_alt</i>
                  Capture Check-out Photo
                </button>
                <div class="mt-2">
                  <input type="file" #checkOutFileInput accept="image/*" (change)="onFileSelected($event, 'checkOut')" class="form-control" style="display: none;">
                  <button class="btn btn-outline-primary btn-sm glass-button-outline" (click)="checkOutFileInput.click()">
                    <i class="material-icons md-18">upload_file</i>
                    Upload Photo
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-6 mb-4">
            <div class="card photo-preview-card">
              <div class="card-header bg-success text-white">
                <h5 class="mb-0"><i class="material-icons me-2">image</i>Check-out Photo Preview</h5>
              </div>
              <div class="card-body d-flex flex-column align-items-center justify-content-center">
                <div class="photo-preview-container">
                  <img *ngIf="checkOutPhoto" [src]="getPhotoDisplayUrl(checkOutPhoto)" alt="Check-out Photo" class="img-fluid captured-photo" (error)="onPhotoError($event)">
                  <div *ngIf="!checkOutPhoto" class="photo-placeholder">
                    <i class="material-icons">photo_camera</i>
                    <p>No photo captured</p>
                  </div>
                </div>
                <button *ngIf="checkOutPhoto" class="btn btn-danger mt-3 glass-button" (click)="checkOutPhoto = null">
                  <i class="material-icons md-20">refresh</i>
                  Retake Photo
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-center gap-2 mb-4">
          <button class="btn btn-warning btn-lg check-out-btn glass-button" (click)="checkOut()" [disabled]="!checkOutPhoto && !checkOutPhotoFile">
            <i class="material-icons md-24">logout</i>
            Check Out
          </button>
          <div *ngIf="!checkOutPhoto && !checkOutPhotoFile" class="mt-2">
            <small class="text-danger">
              <i class="material-icons me-1" style="font-size: 16px;">info</i>
              Please complete all requirements:
              <br>• {{ (!checkOutPhoto && !checkOutPhotoFile) ? 'Capture or upload photo' : '✓ Photo ready' }}
            </small>
          </div>
        </div>
      </div>

      <div class="card attendance-history-card">
        <div class="card-header bg-secondary text-white">
                <h5 class="mb-0"><i class="material-icons md-20">history</i>Attendance History</h5>
        </div>
        <div class="card-body">
          <div *ngIf="loadingAttendanceHistory" class="text-center py-3">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading attendance history...</p>
          </div>
          <div *ngIf="!loadingAttendanceHistory && attendanceHistory.length === 0" class="text-center py-3">
            <p class="text-muted">No attendance records found.</p>
          </div>
          <div *ngIf="!loadingAttendanceHistory && attendanceHistory.length > 0" class="table-responsive">
            <table class="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check-in Time</th>
                  <th>Check-out Time</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Photos</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let record of attendanceHistory">
                  <td>{{ record.date | date:'mediumDate' }}</td>
                  <td>{{ record.checkInTime | date:'shortTime' }}</td>
                  <td>{{ record.checkOutTime ? (record.checkOutTime | date:'shortTime') : 'N/A' }}</td>
                          <td>
                            <span class="badge rounded-pill" [ngClass]="getAttendanceStatusClass(record.status)">
                              {{ record.status }}
                            </span>
                          </td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary glass-button-outline" 
                            *ngIf="record.latitude && record.longitude"
                            (click)="showLocation(record.latitude!, record.longitude!)">
                      <i class="material-icons md-18">location_on</i> View
                    </button>
                    <span *ngIf="!record.latitude || !record.longitude">N/A</span>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-outline-info me-2 glass-button-outline" 
                            *ngIf="record.checkInPhoto"
                            (click)="showPhoto(record.checkInPhoto!)">
                      <i class="material-icons md-18">photo_camera</i> Check-in
                    </button>
                    <button class="btn btn-sm btn-outline-info glass-button-outline" 
                            *ngIf="record.checkOutPhoto"
                            (click)="showPhoto(record.checkOutPhoto!)">
                      <i class="material-icons md-18">photo_camera</i> Check-out
                    </button>
                    <span *ngIf="!record.checkInPhoto && !record.checkOutPhoto">N/A</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .attendance-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border: 1px solid #cbd5e1;
      border-radius: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .attendance-title {
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.25rem;
    }

    .attendance-subtitle {
      color: #64748b;
      margin: 0;
      font-size: 1.1rem;
      font-weight: 500;
    }

    .attendance-status-badge {
      margin-top: 1rem;
    }

    .attendance-status-badge .badge {
      font-size: 1rem;
      padding: 0.75rem 1.5rem;
      border-radius: 2rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .card {
      border-radius: 0.75rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .card-header {
      padding: 1rem 1.5rem;
      font-size: 1.1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
    }

    .card-header.bg-primary { 
      background: #f1f5f9 !important; 
      color: #1e293b !important;
      border-bottom: 2px solid #e2e8f0 !important;
    }
    .card-header.bg-success { 
      background: #f0fdf4 !important; 
      color: #166534 !important;
      border-bottom: 2px solid #bbf7d0 !important;
    }
    .card-header.bg-info { 
      background: #f0f9ff !important; 
      color: #1e40af !important;
      border-bottom: 2px solid #bfdbfe !important;
    }
    .card-header.bg-secondary { 
      background: #f8fafc !important; 
      color: #475569 !important;
      border-bottom: 2px solid #e2e8f0 !important;
    }

    .card-body {
      padding: 1.5rem;
    }

    .camera-container {
      position: relative;
      width: 100%;
      max-width: 400px;
      height: 300px;
      background-color: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 0.5rem;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .camera-feed {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .camera-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .camera-overlay i {
      font-size: 4rem;
      margin-bottom: 0.5rem;
      color: white;
    }

    .photo-preview-container {
      width: 100%;
      max-width: 400px;
      height: 300px;
      background-color: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 0.5rem;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .captured-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-placeholder {
      color: #ccc;
      text-align: center;
    }

    .photo-placeholder i {
      font-size: 4rem;
      margin-bottom: 0.5rem;
      color: #ccc;
    }

    .location-info {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
      padding: 0.75rem 1.25rem;
      border-radius: 0.5rem;
      margin-top: 1rem;
      display: flex;
      align-items: center;
      font-weight: 500;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .location-info i {
      margin-right: 0.5rem;
      font-size: 1.2rem;
    }

    .btn {
      font-weight: 600;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .btn:hover {
      transform: translateY(-1px);
    }

    .btn-primary { background-color: #3b82f6; border-color: #3b82f6; color: white; }
    .btn-success { background-color: #10b981; border-color: #10b981; color: white; }
    .btn-info { background-color: #06b6d4; border-color: #06b6d4; color: white; }
    .btn-warning { background-color: #f59e0b; border-color: #f59e0b; color: white; }
    .btn-danger { background-color: #ef4444; border-color: #ef4444; color: white; }

    .btn-primary:hover { background-color: #2563eb; border-color: #2563eb; }
    .btn-success:hover { background-color: #059669; border-color: #059669; }
    .btn-info:hover { background-color: #0891b2; border-color: #0891b2; }
    .btn-warning:hover { background-color: #d97706; border-color: #d97706; }
    .btn-danger:hover { background-color: #dc2626; border-color: #dc2626; }

    .check-in-btn,
    .check-out-btn {
      width: auto;
      min-width: 200px;
      max-width: 300px;
    }

    .btn-outline-primary:hover {
      background-color: #007bff;
      border-color: #007bff;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
    }

    .btn-outline-info:hover {
      background-color: #17a2b8;
      border-color: #17a2b8;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(23, 162, 184, 0.3);
    }

    .badge {
      font-size: 0.75rem;
      padding: 0.35em 0.65em;
      border-radius: 0.3rem;
      font-weight: 600;
      transition: all 0.3s ease;
      border: 1px solid transparent;
    }

    .badge:hover {
      transform: scale(1.05);
    }

    .badge.rounded-pill {
      border-radius: 50rem !important;
      padding: 0.35em 0.65em;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge.bg-success { 
      background-color: #d1fae5 !important; 
      color: #065f46 !important;
      border: 1px solid #10b981 !important;
    }
    .badge.bg-warning { 
      background-color: #fef3c7 !important; 
      color: #92400e !important;
      border: 1px solid #f59e0b !important;
    }
    .badge.bg-secondary { 
      background-color: #f1f5f9 !important; 
      color: #475569 !important;
      border: 1px solid #cbd5e1 !important;
    }

    .table-responsive {
      margin-top: 1.5rem;
    }

    .table thead th {
      background-color: #f8f9fa;
      border-bottom: 2px solid #dee2e6;
      font-weight: 600;
    }

    .table tbody tr {
      transition: all 0.3s ease;
    }

    .table tbody tr:hover {
      background-color: rgba(0, 0, 0, 0.02);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .text-danger {
      color: #dc3545 !important;
    }

    @media (max-width: 1200px) {
      .attendance-header {
        padding: 1.25rem;
        margin-bottom: 1.5rem;
      }
      
      .attendance-title {
        font-size: 2rem;
      }
      
      .attendance-subtitle {
        font-size: 1rem;
      }
      
      .camera-container, .photo-preview-container {
        height: 280px;
        max-width: 350px;
      }
    }

    @media (max-width: 992px) {
      .attendance-header {
        padding: 1rem;
        margin-bottom: 1.25rem;
      }
      
      .attendance-title {
        font-size: 1.75rem;
      }
      
      .attendance-subtitle {
        font-size: 0.95rem;
      }
      
      .camera-container, .photo-preview-container {
        height: 260px;
        max-width: 320px;
      }
      
      .card-header {
        padding: 0.75rem 1rem;
        font-size: 1rem;
      }
      
      .card-body {
        padding: 1.25rem;
      }
    }

    @media (max-width: 768px) {
      .attendance-header {
        padding: 0.875rem;
        margin-bottom: 1rem;
      }
      
      .attendance-title {
        font-size: 1.5rem;
      }
      
      .attendance-subtitle {
        font-size: 0.9rem;
      }
      
      .card-header {
        font-size: 0.95rem;
        padding: 0.75rem;
      }
      
      .card-body {
        padding: 1rem;
      }
      
      .camera-container, .photo-preview-container {
        height: 220px;
        max-width: 100%;
        margin-bottom: 0.75rem;
      }
      
      .check-in-btn,
      .check-out-btn {
        min-width: 180px;
        max-width: 250px;
        font-size: 0.9rem;
        padding: 0.75rem 1.5rem;
      }
    }

    @media (max-width: 576px) {
      .attendance-header {
        padding: 0.75rem;
        margin-bottom: 0.875rem;
        border-radius: 0.75rem;
      }
      
      .attendance-title {
        font-size: 1.25rem;
        margin-bottom: 0.375rem;
      }
      
      .attendance-subtitle {
        font-size: 0.8rem;
      }
      
      .attendance-status-badge .badge {
        font-size: 0.8rem;
        padding: 0.5rem 1rem;
      }
      
      .card {
        margin-bottom: 1rem;
        border-radius: 0.5rem;
      }
      
      .card-header {
        font-size: 0.875rem;
        padding: 0.625rem;
      }
      
      .card-body {
        padding: 0.875rem;
      }
      
      .camera-container, .photo-preview-container {
        height: 180px;
        max-width: 100%;
        margin-bottom: 0.625rem;
      }
      
      .camera-overlay i {
        font-size: 2rem;
      }
      
      .photo-placeholder i {
        font-size: 2rem;
      }
      
      .check-in-btn,
      .check-out-btn {
        min-width: 160px;
        max-width: 220px;
        font-size: 0.8rem;
        padding: 0.625rem 1.25rem;
      }
      
      .btn {
        font-size: 0.8rem;
        padding: 0.5rem 1rem;
      }
      
      .btn-sm {
        font-size: 0.75rem;
        padding: 0.375rem 0.75rem;
      }
      
      .location-info {
        padding: 0.5rem 0.875rem;
        font-size: 0.8rem;
      }
      
      .table-responsive {
        font-size: 0.75rem;
      }
      
      .table thead th,
      .table tbody td {
        padding: 0.5rem 0.375rem;
      }
    }

    @media (max-width: 480px) {
      .attendance-header {
        padding: 0.625rem;
        margin-bottom: 0.75rem;
      }
      
      .attendance-title {
        font-size: 1.125rem;
      }
      
      .attendance-subtitle {
        font-size: 0.75rem;
      }
      
      .camera-container, .photo-preview-container {
        height: 160px;
      }
      
      .check-in-btn,
      .check-out-btn {
        min-width: 140px;
        max-width: 200px;
        font-size: 0.75rem;
        padding: 0.5rem 1rem;
      }
      
      .btn {
        font-size: 0.75rem;
        padding: 0.5rem 0.875rem;
      }
      
      .card-header {
        font-size: 0.8rem;
        padding: 0.5rem;
      }
      
      .card-body {
        padding: 0.75rem;
      }
    }
  `]
})
export class SimpleAttendanceComponent implements OnInit, OnDestroy, AfterViewInit, DoCheck {
  @ViewChild('checkInVideo') checkInVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('checkOutVideo') checkOutVideo!: ElementRef<HTMLVideoElement>;

  currentUser: User | null = null;
  isCheckedIn = false;
  cameraActive = false;
  checkInPhoto: string | null = null;
  checkOutPhoto: string | null = null;
  checkInPhotoFile: File | null = null;
  checkOutPhotoFile: File | null = null;
  locationEnabled = false;
  locationLoading = false;
  locationCoordinates: { latitude: number; longitude: number } | null = null;
  attendanceHistory: AttendanceRecord[] = [];
  currentAttendanceRecord: AttendanceRecord | null = null;
  loadingAttendanceHistory = false;
  stream: MediaStream | null = null;
  private lastRefreshTime = 0;

  constructor(
    private authService: AuthService,
    private attendanceService: AttendanceService,
    private toastService: ToastService,
    private attendanceStateService: AttendanceStateService
  ) {}

  // Helper method to create local time string
  private getLocalTimeString(date: Date): string {
    return date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0') + 'T' + 
      String(date.getHours()).padStart(2, '0') + ':' + 
      String(date.getMinutes()).padStart(2, '0') + ':' + 
      String(date.getSeconds()).padStart(2, '0');
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    
    console.log('🚀 ATTENDANCE COMPONENT INITIALIZED');
    console.log('User:', this.currentUser?.id);
    
    // Set current user in the service
    if (this.currentUser?.id) {
      this.attendanceStateService.setCurrentUser(this.currentUser.id);
    }
    
    // Check if we have cached state first
    const cachedState = this.attendanceStateService.getCurrentState();
    console.log('📦 CACHED STATE:', cachedState);
    
    if (cachedState.isCheckedIn && cachedState.currentRecord) {
      console.log('✅ USING CACHED STATE - SHOWING CHECKOUT');
      this.isCheckedIn = cachedState.isCheckedIn;
      this.currentAttendanceRecord = cachedState.currentRecord;
      this.checkInPhoto = cachedState.currentRecord.checkInPhoto || null;
      this.checkOutPhoto = null;
    } else if (this.attendanceStateService.shouldRefreshState()) {
      console.log('🔄 CACHED STATE EXPIRED - CHECKING DATABASE');
      this.checkAttendanceStatus();
    } else {
      console.log('🔄 NO CACHED STATE - CHECKING DATABASE');
      this.checkAttendanceStatus();
    }
    
    // Subscribe to service state changes
    this.attendanceStateService.getAttendanceState().subscribe(state => {
      console.log('🔄 SERVICE STATE CHANGED:', state);
      if (state.isCheckedIn && state.currentRecord) {
        this.isCheckedIn = state.isCheckedIn;
        this.currentAttendanceRecord = state.currentRecord;
        this.checkInPhoto = state.currentRecord.checkInPhoto || null;
        this.checkOutPhoto = null;
      } else {
        this.isCheckedIn = false;
        this.currentAttendanceRecord = null;
        this.checkInPhoto = null;
        this.checkOutPhoto = null;
      }
    });
    
    this.loadAttendanceHistory();
    
    setTimeout(() => {
      this.startCamera();
    }, 1000);
  }

  ngAfterViewInit() {
    console.log('👁️ ATTENDANCE COMPONENT VIEW INITIALIZED');
    
    // Don't force refresh - let the service state handle it
    // The service state should already be set from ngOnInit
    console.log('📦 USING EXISTING SERVICE STATE ON VIEW INIT');
    
    // Just ensure the camera is ready if needed
    setTimeout(() => {
      if (!this.cameraActive) {
        this.startCamera();
      }
    }, 300);
  }

  // This method will be called every time the component becomes visible
  ngDoCheck() {
    // This runs on every change detection cycle
    // We can use this to ensure the component always shows the correct state
  }


  ngOnDestroy() {
    this.stopCamera();
  }

  startCamera() {
    if (this.stream) {
      this.stopCamera();
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(stream => {
        this.stream = stream;
        this.setStreamToVideo(stream);
        this.cameraActive = true;
        this.toastService.success('Camera', 'Camera started successfully.');
      })
      .catch(err => {
        console.error('Error accessing camera:', err);
        this.cameraActive = false;
        this.toastService.error('Camera Error', 'Could not access camera. Please ensure it is enabled and not in use by another application.');
      });
  }

  setStreamToVideo(stream: MediaStream) {
    // Set stream to check-in video
    if (this.checkInVideo && this.checkInVideo.nativeElement) {
      this.checkInVideo.nativeElement.srcObject = stream;
      this.checkInVideo.nativeElement.onloadedmetadata = () => {
        this.checkInVideo.nativeElement.play();
      };
    }
    
    // Set stream to check-out video
    if (this.checkOutVideo && this.checkOutVideo.nativeElement) {
      this.checkOutVideo.nativeElement.srcObject = stream;
      this.checkOutVideo.nativeElement.onloadedmetadata = () => {
        this.checkOutVideo.nativeElement.play();
      };
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.cameraActive = false;
  }

  capturePhoto(mode: 'checkIn' | 'checkOut') {
    if (!this.cameraActive || !this.stream) {
      this.toastService.error('Camera Error', 'Camera is not active.');
      return;
    }

    const videoElement = mode === 'checkIn' ? this.checkInVideo.nativeElement : this.checkOutVideo.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const photoData = canvas.toDataURL('image/png');
      if (mode === 'checkIn') {
        this.checkInPhoto = photoData;
        this.checkInPhotoFile = null; // Clear file when using camera
        this.toastService.success('Photo Captured', 'Check-in photo captured successfully!');
      } else {
        this.checkOutPhoto = photoData;
        this.checkOutPhotoFile = null; // Clear file when using camera
        this.toastService.success('Photo Captured', 'Check-out photo captured successfully!');
      }
    }
  }

  onFileSelected(event: any, mode: 'checkIn' | 'checkOut') {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const photoData = e.target.result;
          if (mode === 'checkIn') {
            this.checkInPhoto = photoData;
            this.checkInPhotoFile = file;
            this.toastService.success('Photo Uploaded', 'Check-in photo uploaded successfully!');
          } else {
            this.checkOutPhoto = photoData;
            this.checkOutPhotoFile = file;
            this.toastService.success('Photo Uploaded', 'Check-out photo uploaded successfully!');
          }
        };
        reader.readAsDataURL(file);
      } else {
        this.toastService.error('Invalid File', 'Please select an image file.');
      }
    }
  }

  enableLocation() {
    this.locationLoading = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.locationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          this.locationEnabled = true;
          this.locationLoading = false;
          this.toastService.success('Location', 'Location enabled successfully.');
        },
        (error) => {
          console.error('Error getting location:', error);
          this.locationEnabled = false;
          this.locationLoading = false;
          let errorMessage = 'Failed to get location.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable it in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'The request to get user location timed out.';
              break;
          }
          this.toastService.error('Location Error', errorMessage);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      this.locationEnabled = false;
      this.locationLoading = false;
      this.toastService.error('Location Error', 'Geolocation is not supported by this browser.');
    }
  }

  checkIn() {
    if (!this.currentUser || !this.currentUser.id) {
      this.toastService.error('Error', 'User not logged in.');
      return;
    }
    
    // Check if user already has a pending check-out for today
    if (this.currentAttendanceRecord && this.currentAttendanceRecord.status === 'In Progress') {
      this.toastService.error('Check-in Error', 'You already have a pending check-out for today. Please complete your checkout first.');
      return;
    }
    
    if (!this.checkInPhoto && !this.checkInPhotoFile) {
      this.toastService.error('Validation Error', 'Please capture or upload a photo.');
      return;
    }
    if (!this.locationEnabled || !this.locationCoordinates) {
      this.toastService.error('Validation Error', 'Please enable location services.');
      return;
    }

    // Use file upload if available, otherwise use base64
    if (this.checkInPhotoFile) {
      this.checkInWithFile();
    } else {
      this.checkInWithBase64();
    }
  }

  checkInWithBase64() {
    const now = new Date();
    const checkInData: Omit<AttendanceRecord, 'id'> = {
      userId: this.currentUser!.id,
      date: now.toISOString().split('T')[0],
      checkInTime: this.getLocalTimeString(now),
      status: 'In Progress',
      latitude: this.locationCoordinates!.latitude,
      longitude: this.locationCoordinates!.longitude,
      checkInPhoto: this.checkInPhoto!
    };

    this.attendanceService.checkIn(checkInData).subscribe({
      next: (record) => {
        console.log('✅ CHECK-IN SUCCESSFUL:', record);
        this.toastService.success('Check-in Successful', 'You have successfully checked in!');
        this.currentAttendanceRecord = record;
        this.isCheckedIn = true;
        this.checkOutPhoto = null;
        this.checkOutPhotoFile = null;
        
        // Update the service state
        this.attendanceStateService.updateAttendanceState(true, record);
        
        this.loadAttendanceHistory();
        // Ensure checkout camera gets the stream
        setTimeout(() => {
          this.ensureCheckoutCamera();
        }, 100);
      },
      error: (error) => {
        console.error('❌ Check-in error:', error);
        this.toastService.error('Check-in Failed', error.error?.message || 'An error occurred during check-in.');
      }
    });
  }

  checkInWithFile() {
    const now = new Date();
    const formData = new FormData();
    formData.append('userId', this.currentUser!.id.toString());
    formData.append('date', now.toISOString().split('T')[0]);
    formData.append('checkInTime', this.getLocalTimeString(now));
    formData.append('status', 'In Progress');
    formData.append('latitude', this.locationCoordinates!.latitude.toString());
    formData.append('longitude', this.locationCoordinates!.longitude.toString());
    formData.append('checkInPhoto', this.checkInPhotoFile!);

    this.attendanceService.checkInWithFile(formData).subscribe({
      next: (record) => {
        console.log('✅ CHECK-IN WITH FILE SUCCESSFUL:', record);
        this.toastService.success('Check-in Successful', 'You have successfully checked in!');
        this.currentAttendanceRecord = record;
        this.isCheckedIn = true;
        this.checkOutPhoto = null;
        this.checkOutPhotoFile = null;
        
        // Update the service state
        this.attendanceStateService.updateAttendanceState(true, record);
        
        this.loadAttendanceHistory();
        // Ensure checkout camera gets the stream
        setTimeout(() => {
          this.ensureCheckoutCamera();
        }, 100);
      },
      error: (error) => {
        console.error('❌ Check-in with file error:', error);
        this.toastService.error('Check-in Failed', error.error?.message || 'An error occurred during check-in.');
      }
    });
  }

  ensureCheckoutCamera() {
    if (this.stream && this.checkOutVideo && this.checkOutVideo.nativeElement) {
      this.checkOutVideo.nativeElement.srcObject = this.stream;
      this.checkOutVideo.nativeElement.onloadedmetadata = () => {
        this.checkOutVideo.nativeElement.play();
      };
    }
  }

  checkOut() {
    if (!this.currentUser || !this.currentUser.id) {
      this.toastService.error('Error', 'User not logged in.');
      return;
    }
    if (!this.currentAttendanceRecord || this.currentAttendanceRecord.status !== 'In Progress') {
      this.toastService.error('Error', 'No active check-in record found.');
      return;
    }
    if (!this.checkOutPhoto && !this.checkOutPhotoFile) {
      this.toastService.error('Validation Error', 'Please capture or upload a check-out photo.');
      return;
    }

    // Use file upload if available, otherwise use base64
    if (this.checkOutPhotoFile) {
      this.checkOutWithFile();
    } else {
      this.checkOutWithBase64();
    }
  }

  checkOutWithBase64() {
    const now = new Date();
    const checkOutData: Partial<AttendanceRecord> = {
      id: this.currentAttendanceRecord!.id,
      checkOutTime: this.getLocalTimeString(now),
      status: 'Completed',
      checkOutPhoto: this.checkOutPhoto!
    };

    this.attendanceService.checkOut(this.currentAttendanceRecord!.id!, checkOutData).subscribe({
      next: (record) => {
        console.log('✅ CHECK-OUT SUCCESSFUL:', record);
        this.toastService.success('Check-out Successful', 'You have successfully checked out!');
        this.currentAttendanceRecord = null;
        this.isCheckedIn = false;
        this.checkInPhoto = null;
        this.checkOutPhoto = null;
        this.checkInPhotoFile = null;
        this.checkOutPhotoFile = null;
        
        // Update the service state
        this.attendanceStateService.updateAttendanceState(false, null);
        
        this.loadAttendanceHistory();
      },
      error: (error) => {
        console.error('❌ Check-out error:', error);
        this.toastService.error('Check-out Failed', error.error?.message || 'An error occurred during check-out.');
      }
    });
  }

  checkOutWithFile() {
    const now = new Date();
    const formData = new FormData();
    formData.append('checkOutTime', this.getLocalTimeString(now));
    formData.append('status', 'Completed');
    formData.append('checkOutPhoto', this.checkOutPhotoFile!);

    this.attendanceService.checkOutWithFile(this.currentAttendanceRecord!.id!, formData).subscribe({
      next: (record) => {
        console.log('✅ CHECK-OUT WITH FILE SUCCESSFUL:', record);
        this.toastService.success('Check-out Successful', 'You have successfully checked out!');
        this.currentAttendanceRecord = null;
        this.isCheckedIn = false;
        this.checkInPhoto = null;
        this.checkOutPhoto = null;
        this.checkInPhotoFile = null;
        this.checkOutPhotoFile = null;
        
        // Update the service state
        this.attendanceStateService.updateAttendanceState(false, null);
        
        this.loadAttendanceHistory();
      },
      error: (error) => {
        console.error('❌ Check-out with file error:', error);
        this.toastService.error('Check-out Failed', error.error?.message || 'An error occurred during check-out.');
      }
    });
  }

  checkAttendanceStatus() {
    if (!this.currentUser || !this.currentUser.id) {
      console.log('❌ No current user found');
      return;
    }

    console.log('🔍 CHECKING ATTENDANCE STATUS FOR USER:', this.currentUser.id);
    
    // Reset state first
    this.isCheckedIn = false;
    this.currentAttendanceRecord = null;
    this.checkInPhoto = null;
    this.checkOutPhoto = null;
    
    this.attendanceService.getAttendanceByUserId(this.currentUser.id).subscribe({
      next: (records) => {
        const today = new Date().toISOString().split('T')[0];
        console.log('📅 Today\'s date:', today);
        console.log('📊 Total records found:', records.length);
        
        const todayRecord = records.find(record => record.date === today);
        console.log('📋 Today\'s record:', todayRecord);
        
        if (todayRecord) {
          console.log('📝 Record status:', todayRecord.status);
          console.log('⏰ Check-in time:', todayRecord.checkInTime);
          console.log('⏰ Check-out time:', todayRecord.checkOutTime);
          
          if (todayRecord.status === 'In Progress') {
            // User has checked in but not checked out - show checkout section
            console.log('✅ PENDING CHECK-OUT FOUND - SHOWING CHECKOUT SECTION');
            this.currentAttendanceRecord = todayRecord;
            this.isCheckedIn = true;
            this.checkInPhoto = todayRecord.checkInPhoto || null;
            this.checkOutPhoto = null;
            
            // Update the service state
            this.attendanceStateService.updateAttendanceState(true, todayRecord);
            
            this.toastService.info('Attendance Status', 'You have a pending check-out. Please complete your checkout.');
            
            // Ensure checkout camera is ready
            setTimeout(() => {
              this.ensureCheckoutCamera();
            }, 500);
          } else if (todayRecord.status === 'Completed') {
            // User has completed attendance for today - show check-in for next day
            console.log('✅ ATTENDANCE COMPLETED - SHOWING CHECK-IN');
            this.isCheckedIn = false;
            this.currentAttendanceRecord = null;
            this.checkInPhoto = null;
            this.checkOutPhoto = null;
            
            // Update the service state
            this.attendanceStateService.updateAttendanceState(false, null);
          }
        } else {
          // No attendance record for today - show check-in
          console.log('✅ NO RECORD FOR TODAY - SHOWING CHECK-IN');
          this.isCheckedIn = false;
          this.currentAttendanceRecord = null;
          this.checkInPhoto = null;
          this.checkOutPhoto = null;
          
          // Update the service state
          this.attendanceStateService.updateAttendanceState(false, null);
        }
        
        console.log('🎯 FINAL STATE - isCheckedIn:', this.isCheckedIn);
        console.log('🎯 FINAL STATE - currentRecord:', this.currentAttendanceRecord);
        console.log('=====================================');
        
        // Mark state as refreshed
        this.attendanceStateService.markStateRefreshed();
      },
      error: (error) => {
        console.error('❌ ERROR checking attendance status:', error);
        this.toastService.error('Error', 'Failed to check attendance status');
      }
    });
  }

  refreshCameraForCheckout() {
    if (this.stream) {
      this.setStreamToVideo(this.stream);
      this.toastService.success('Camera', 'Camera refreshed for checkout.');
    } else {
      this.startCamera();
    }
  }

  refreshAttendanceStatus() {
    console.log('🔄 REFRESHING ATTENDANCE STATUS...');
    // Reset current state first
    this.isCheckedIn = false;
    this.currentAttendanceRecord = null;
    this.checkInPhoto = null;
    this.checkOutPhoto = null;
    
    // Then check the actual status from the database
    this.checkAttendanceStatus();
    this.loadAttendanceHistory();
    
    // Restart camera if needed
    if (!this.cameraActive) {
      setTimeout(() => {
        this.startCamera();
      }, 500);
    }
  }

  // Public method that can be called from parent component
  forceRefresh() {
    console.log('🚀 FORCE REFRESH CALLED FROM PARENT - USING SERVICE STATE');
    
    // Just use the service state - don't reset it
    const serviceState = this.attendanceStateService.getCurrentState();
    console.log('📦 SERVICE STATE ON FORCE REFRESH:', serviceState);
    
    if (serviceState.isCheckedIn && serviceState.currentRecord) {
      console.log('✅ USING SERVICE STATE - SHOWING CHECKOUT');
      this.isCheckedIn = serviceState.isCheckedIn;
      this.currentAttendanceRecord = serviceState.currentRecord;
      this.checkInPhoto = serviceState.currentRecord.checkInPhoto || null;
      this.checkOutPhoto = null;
    } else {
      console.log('🔄 NO SERVICE STATE - SHOWING CHECKIN');
      this.isCheckedIn = false;
      this.currentAttendanceRecord = null;
      this.checkInPhoto = null;
      this.checkOutPhoto = null;
    }
  }

  loadAttendanceHistory() {
    if (this.currentUser) {
      this.loadingAttendanceHistory = true;
      this.attendanceService.getAttendanceByUserId(this.currentUser.id!).subscribe({
        next: (records) => {
          // Backend already returns records sorted by date DESC, checkInTime DESC
          this.attendanceHistory = records;
          this.loadingAttendanceHistory = false;
        },
        error: (error) => {
          console.error('Error loading attendance history:', error);
          this.loadingAttendanceHistory = false;
          this.toastService.error('Error', 'Failed to load attendance history');
        }
      });
    }
  }

  showLocation(latitude: number, longitude: number) {
    this.toastService.info('Location', `Latitude: ${latitude}, Longitude: ${longitude}`);
  }

  showPhoto(photoData: string) {
    // Check if photoData is already a URL (starts with http) or is a base64 data URL
    if (photoData.startsWith('http') || photoData.startsWith('data:')) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`<img src="${photoData}" style="max-width: 100%; height: auto;">`);
        newWindow.document.title = 'Attendance Photo';
      } else {
        this.toastService.error('Error', 'Could not open photo in a new window. Please allow pop-ups.');
      }
    } else {
      // photoData is a MinIO object key, get the presigned URL
      this.attendanceService.getPhotoUrl(photoData).subscribe({
        next: (photoUrl) => {
          const newWindow = window.open();
          if (newWindow) {
            newWindow.document.write(`
              <html>
                <head><title>Attendance Photo</title></head>
                <body style="margin:0; padding:20px; text-align:center; background:#f5f5f5;">
                  <img src="${photoUrl}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" 
                       onerror="this.style.display='none'; document.getElementById('error').style.display='block';">
                  <div id="error" style="display:none; color:#666; font-family:Arial,sans-serif;">
                    <h3>Photo Not Available</h3>
                    <p>The photo could not be loaded. It may have been deleted or moved.</p>
                    <p><small>Object Key: ${photoData}</small></p>
                  </div>
                </body>
              </html>
            `);
            newWindow.document.title = 'Attendance Photo';
          } else {
            this.toastService.error('Error', 'Could not open photo in a new window. Please allow pop-ups.');
          }
        },
        error: (error) => {
          console.error('Error getting photo URL:', error);
          this.toastService.error('Error', 'Photo not available. The photo may have been deleted or moved.');
        }
      });
    }
  }

  getPhotoDisplayUrl(photoData: string): string {
    // Check if photoData is already a URL (starts with http) or is a base64 data URL
    if (photoData.startsWith('http') || photoData.startsWith('data:')) {
      return photoData;
    } else {
      // For MinIO object keys, get presigned URL from backend
      this.attendanceService.getPhotoUrl(photoData).subscribe({
        next: (url) => {
          // Update the image source with the presigned URL
          const imgElement = document.querySelector(`img[alt*="Photo"][src*="${photoData}"]`) as HTMLImageElement;
          if (imgElement) {
            imgElement.src = url;
          }
        },
        error: (error) => {
          console.error('Error getting photo URL:', error);
        }
      });
      
      // Return a placeholder while loading
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+';
    }
  }

  onPhotoError(event: any) {
    console.error('Photo load error:', event);
    // Hide the broken image and show placeholder
    event.target.style.display = 'none';
  }

  getAttendanceStatusClass(status: string): string {
    switch (status) {
      case 'In Progress': return 'bg-warning';
      case 'Completed': return 'bg-success';
      default: return 'bg-secondary';
    }
  }
}
