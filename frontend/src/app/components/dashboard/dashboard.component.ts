import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LeaveService } from '../../services/leave.service';
import { AttendanceStateService } from '../../services/attendance-state.service';
import { User } from '../../models/user.model';
import { ToastService } from '../../services/toast.service';
import { ModalService } from '../../services/modal.service';
import { CommonModule } from '@angular/common';
import { LeaveFormComponent } from '../leave-form/leave-form.component';
import { AdminPanelComponent } from '../admin-panel/admin-panel.component';
import { SimpleAttendanceComponent } from '../simple-attendance/simple-attendance.component';
import { ModalComponent } from '../modal/modal.component';
import { LeaveRequest } from '../../models/leave-request.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LeaveFormComponent, AdminPanelComponent, SimpleAttendanceComponent, ModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild(SimpleAttendanceComponent) attendanceComponent!: SimpleAttendanceComponent;
  
  currentUser: User | null = null;
  isScrolled = false;
  showMobileMenu = false;
  activeTab: 'my-leaves' | 'apply-leave' | 'admin-panel' | 'simple-attendance' = 'my-leaves';
  isLoading = false;
  myLeaveRequests: LeaveRequest[] = [];
  

  constructor(
    private authService: AuthService,
    private leaveService: LeaveService,
    private router: Router,
    private toastService: ToastService,
    private modalService: ModalService,
    private attendanceStateService: AttendanceStateService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadLeaveRequests();
    this.setupScrollListener();
  }

  ngOnDestroy(): void {
    // Clean up scroll listener
    window.removeEventListener('scroll', this.onScroll.bind(this));
  }

  setupScrollListener(): void {
    window.addEventListener('scroll', this.onScroll.bind(this));
  }

  onScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  onTabChange(tab: 'my-leaves' | 'apply-leave' | 'admin-panel' | 'simple-attendance'): void {
    console.log('🔄 TAB CHANGED TO:', tab);
    this.activeTab = tab;
    this.showMobileMenu = false;
    
    if (tab === 'my-leaves') {
      this.loadLeaveRequests();
    } else if (tab === 'simple-attendance') {
      // Force refresh attendance component when switching to attendance tab
      console.log('🎯 SWITCHING TO ATTENDANCE TAB - FORCING REFRESH');
      
      // Trigger service refresh first
      this.attendanceStateService.triggerRefresh();
      
      setTimeout(() => {
        if (this.attendanceComponent) {
          console.log('📞 CALLING FORCE REFRESH ON ATTENDANCE COMPONENT');
          this.attendanceComponent.forceRefresh();
        } else {
          console.log('❌ ATTENDANCE COMPONENT NOT FOUND');
        }
      }, 200);
    }
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  logout(): void {
    this.authService.logout();
    this.modalService.showSuccess('Logout Successful', 'You have been successfully logged out.');
    this.router.navigate(['/login']);
  }

  loadLeaveRequests(): void {
    this.isLoading = true;
    this.leaveService.getMyLeaveRequests().subscribe({
      next: (requests) => {
        this.myLeaveRequests = requests;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading leave requests', error);
        this.isLoading = false;
        this.modalService.showInfo('Error', 'Failed to load leave requests');
      }
    });
  }

  onLeaveRequestSubmitted(): void {
    // Switch to my-leaves tab to show pending requests
    this.activeTab = 'my-leaves';
    this.loadLeaveRequests();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-warning';
      case 'APPROVED':
        return 'bg-success';
      case 'REJECTED':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  }

  deleteLeaveRequest(id: number): void {
    this.leaveService.deleteLeaveRequest(id).subscribe({
      next: () => {
        this.myLeaveRequests = this.myLeaveRequests.filter(request => request.id !== id);
        this.modalService.showSuccess('Leave Request Deleted', 'Your leave request has been deleted successfully.');
      },
      error: (error) => {
        console.error('Error deleting leave request', error);
        this.modalService.showInfo('Error', 'Failed to delete leave request');
      }
    });
  }

}