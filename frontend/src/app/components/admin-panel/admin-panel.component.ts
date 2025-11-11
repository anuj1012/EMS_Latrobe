import { Component, OnInit } from '@angular/core';
import { LeaveService } from '../../services/leave.service';
import { UserService } from '../../services/user.service';
import { AttendanceService } from '../../services/attendance.service';
import { ToastService } from '../../services/toast.service';
import { ModalService } from '../../services/modal.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';
import { LeaveRequest, LeaveApproval, LEAVE_TYPES } from '../../models/leave-request.model';
import { CreateUserRequest, User } from '../../models/user.model';
import { AttendanceRecord } from '../../models/attendance.model';
import { firstValueFrom } from 'rxjs';

interface Employee {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
  role: string;
  totalLeaves: number;
}

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss']
})
export class AdminPanelComponent implements OnInit {
  activeTab: 'pending' | 'all' | 'attendance' | 'employees' = 'pending';
  isLoading = false;
  
  pendingRequests: LeaveRequest[] = [];
  allLeaveRequests: LeaveRequest[] = [];
  attendanceRecords: AttendanceRecord[] = [];
  filteredAttendanceRecords: AttendanceRecord[] = [];
  employees: Employee[] = [];
  
  selectedRequest: LeaveRequest | null = null;
  selectedRequestForDetail: LeaveRequest | null = null;
  modalAction: 'approve' | 'reject' | null = null;
  adminComment = '';
  
  showAddEmployeeModal = false;
  newEmployee: CreateUserRequest = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: '',
    designation: '',
    role: 'EMPLOYEE'
  };
  
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();
  leaveTypes = LEAVE_TYPES;
  
  // Attendance filters
  attendanceDateFilter: string = '';
  attendanceStatusFilter: string = '';

  constructor(
    private leaveService: LeaveService,
    private userService: UserService,
    private attendanceService: AttendanceService,
    private toastService: ToastService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.loadPendingRequests();
    this.loadAllLeaveRequests();
    this.loadEmployees();
  }

  onTabChange(tab: 'pending' | 'all' | 'attendance' | 'employees'): void {
    this.activeTab = tab;
    switch (tab) {
      case 'pending':
        this.loadPendingRequests();
        break;
      case 'all':
        this.loadAllLeaveRequests();
        break;
      case 'attendance':
        this.loadAttendanceRecords();
        break;
      case 'employees':
        this.loadEmployees();
        break;
    }
  }

  loadPendingRequests(): void {
    this.isLoading = true;
    this.leaveService.getPendingLeaveRequests().subscribe({
      next: (requests) => {
        this.pendingRequests = requests;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading pending requests', error);
        this.isLoading = false;
        this.toastService.error('Error', 'Failed to load pending requests');
      }
    });
  }

  loadAllLeaveRequests(): void {
    this.isLoading = true;
    this.leaveService.getAllLeaveRequests().subscribe({
      next: (requests) => {
        this.allLeaveRequests = requests;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading all requests', error);
        this.isLoading = false;
        this.toastService.error('Error', 'Failed to load all requests');
      }
    });
  }

  loadAttendanceRecords(): void {
    this.isLoading = true;
    // Load employees first to ensure we have employee data for display
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        // Transform User[] to Employee[] with initial leave statistics
        this.employees = users.map(user => {
          return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            department: user.department,
            designation: user.designation,
            role: user.role,
            totalLeaves: 0 // Will be updated with actual data
          };
        });
        
        // Now load attendance records
        this.attendanceService.getAllAttendanceRecords().subscribe({
          next: (records) => {
            console.log('Loaded attendance records:', records);
            this.attendanceRecords = records;
            this.filteredAttendanceRecords = [...records];
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading attendance records', error);
            this.isLoading = false;
            this.toastService.error('Error', 'Failed to load attendance records');
          }
        });
      },
      error: (error) => {
        console.error('Error loading employees', error);
        this.isLoading = false;
        this.toastService.error('Error', 'Failed to load employees');
      }
    });
  }

  filterAttendanceRecords(): void {
    if (!this.attendanceDateFilter && !this.attendanceStatusFilter) {
      this.filteredAttendanceRecords = [...this.attendanceRecords];
      return;
    }

    this.filteredAttendanceRecords = this.attendanceRecords.filter(record => {
      // Date filter
      if (this.attendanceDateFilter && record.date !== this.attendanceDateFilter) {
        return false;
      }
      
      // Status filter
      if (this.attendanceStatusFilter && record.status !== this.attendanceStatusFilter) {
        return false;
      }
      
      return true;
    });
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        // Convert User[] to Employee[] and calculate leave stats
        this.employees = users.map(user => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          department: user.department,
          designation: user.designation,
          role: user.role,
          totalLeaves: 0 // Will be updated with actual stats
        }));
        
        // Load leave stats for each employee
        this.updateEmployeeStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading employees', error);
        this.toastService.error('Load Error', 'Failed to load employees');
        this.isLoading = false;
      }
    });
  }

  updateEmployeeStats(): void {
    // Update the totalLeaves count for each employee based on the selected month/year
    this.employees.forEach(employee => {
      if (employee.id) {
        this.userService.getUserLeaveStats(employee.id, this.selectedYear, this.selectedMonth).subscribe({
          next: (stats) => {
            // Update the employee with the actual leave statistics from the backend
            const index = this.employees.findIndex(e => e.id === employee.id);
            if (index !== -1) {
              this.employees[index] = {
                ...this.employees[index],
                totalLeaves: stats.monthlyLeaves || 0
              };
            }
          },
          error: (error) => {
            console.error(`Error loading leave stats for employee ${employee.id}`, error);
          }
        });
      }
    });
  }

  openApprovalModal(request: LeaveRequest, action: 'approve' | 'reject'): void {
    this.selectedRequest = request;
    this.modalAction = action;
    this.adminComment = '';
  }

  closeModal(): void {
    this.selectedRequest = null;
    this.modalAction = null;
    this.adminComment = '';
  }

  closeEmployeeDetail(): void {
    this.selectedRequestForDetail = null;
  }

  confirmAction(): void {
    if (!this.selectedRequest || !this.modalAction) return;

    const action = this.modalAction;
    const requestId = this.selectedRequest.id;

    const approval: LeaveApproval = {
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      adminComment: this.adminComment
    };

    this.leaveService.approveLeaveRequest(requestId!, approval).subscribe({
      next: (updatedRequest) => {
        if (action === 'approve') {
          this.pendingRequests = this.pendingRequests.filter(req => req.id !== requestId);
          this.allLeaveRequests = this.allLeaveRequests.map(req => 
            req.id === requestId ? updatedRequest : req
          );
          this.toastService.success('Leave Approved', `Leave request for ${this.selectedRequest?.employeeName} has been approved.`);
        } else {
          this.pendingRequests = this.pendingRequests.filter(req => req.id !== requestId);
          this.allLeaveRequests = this.allLeaveRequests.map(req => 
            req.id === requestId ? updatedRequest : req
          );
          this.toastService.success('Leave Rejected', `Leave request for ${this.selectedRequest?.employeeName} has been rejected.`);
        }
        // Refresh employee stats after approval/rejection
        if (this.activeTab === 'employees') {
          this.updateEmployeeStats();
        }
        this.closeModal();
      },
      error: (error) => {
        console.error('Error approving/rejecting leave request', error);
        this.toastService.error('Error', `Failed to ${action} leave request`);
      }
    });
  }

  openAddEmployeeModal(): void {
    this.showAddEmployeeModal = true;
    this.newEmployee = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      department: '',
      designation: '',
      role: 'EMPLOYEE'
    };
  }

  closeAddEmployeeModal(): void {
    this.showAddEmployeeModal = false;
  }

  isAddEmployeeFormValid(): boolean {
    return !!(
      this.newEmployee.firstName &&
      this.newEmployee.lastName &&
      this.newEmployee.email &&
      this.newEmployee.password &&
      this.newEmployee.department &&
      this.newEmployee.designation
    );
  }

  addEmployee(): void {
    if (!this.isAddEmployeeFormValid()) {
      this.toastService.error('Form Error', 'Please fill in all required fields');
      return;
    }

    // Normalize email to lowercase to match backend behavior
    const normalizedEmployee = {
      ...this.newEmployee,
      email: this.newEmployee.email.trim().toLowerCase()
    };

    this.userService.createUser(normalizedEmployee).subscribe({
      next: (user) => {
        const newEmployee: Employee = {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          department: user.department,
          designation: user.designation,
          role: user.role,
          totalLeaves: 0
        };

        this.employees.push(newEmployee);
        this.closeAddEmployeeModal();
        this.toastService.success('Employee Added', `${newEmployee.firstName} ${newEmployee.lastName} has been added successfully.`);
      },
      error: (error) => {
        console.error('Error adding employee', error);
        this.toastService.error('Error', 'Failed to add employee');
      }
    });
  }

  deleteEmployee(employeeId: number, employeeName: string): void {
    this.modalService.confirm({
      title: 'Delete Employee',
      message: `Are you sure you want to delete ${employeeName}? This action cannot be undone.`,
      type: 'success',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    }).then((confirmed) => {
      if (confirmed) {
        console.log('Attempting to delete employee with ID:', employeeId);
        // First try normal delete, if that fails try force delete
        this.userService.deleteUser(employeeId).subscribe({
          next: () => {
            console.log('Employee deleted successfully');
            // Remove the employee from the list
            this.employees = this.employees.filter(emp => emp.id !== employeeId);
            this.modalService.showSuccess('Employee Deleted', `${employeeName} has been deleted successfully.`);
          },
          error: (error) => {
            console.error('Error deleting employee with normal delete, trying force delete', error);
            // If normal delete fails, try force delete
            this.userService.forceDeleteUser(employeeId).subscribe({
              next: () => {
                console.log('Employee force deleted successfully');
                // Remove the employee from the list
                this.employees = this.employees.filter(emp => emp.id !== employeeId);
                this.modalService.showSuccess('Employee Deleted', `${employeeName} has been deleted successfully.`);
              },
              error: (forceError) => {
                console.error('Error force deleting employee', forceError);
                if (forceError.status === 400) {
                  this.modalService.showInfo('Delete Failed', forceError.error);
                } else {
                  this.modalService.showInfo('Delete Failed', 'Failed to delete employee. Please try again.');
                }
              }
            });
          }
        });
      }
    });
  }

  getDaysCount(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'bg-warning';
      case 'APPROVED': return 'bg-success';
      case 'REJECTED': return 'bg-danger';
      default: return '';
    }
  }

  getAttendanceStatusClass(status: string): string {
    switch (status) {
      case 'In Progress': return 'bg-warning';
      case 'Completed': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getEmployeeName(userId: number): string {
    const employee = this.employees.find(e => e.id === userId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';
  }

  getEmployeeEmail(userId: number): string {
    const employee = this.employees.find(e => e.id === userId);
    return employee ? employee.email : '';
  }

  showLocation(latitude: number, longitude: number): void {
    // Open Google Maps with the location
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
  }

  showPhoto(photo: string): void {
    // Create a modal to show the photo with improved styling
    const modal = document.createElement('div');
    modal.className = 'modal fade show';
    modal.style.display = 'block';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.zIndex = '10000';
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-lg" style="max-width: 90%; margin: 1.75rem auto;">
        <div class="modal-content" style="border-radius: 15px; overflow: hidden; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
          <div class="modal-header" style="background: linear-gradient(135deg, #6c757d 0%, #495057 100%); color: white; border-bottom: none; padding: 1rem 1.5rem;">
            <h5 class="modal-title">Attendance Photo</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" style="filter: invert(1);"></button>
          </div>
          <div class="modal-body text-center p-0" style="background: #f8f9fa;">
            <img src="${photo}" alt="Attendance Photo" class="img-fluid" style="max-height: 70vh; object-fit: contain; width: 100%;">
          </div>
          <div class="modal-footer" style="background: #f8f9fa; border-top: none; padding: 1rem 1.5rem;">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" style="border-radius: 8px; padding: 0.5rem 1.5rem;">Close</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listener to close the modal
    const closeButtons = modal.querySelectorAll('[data-bs-dismiss="modal"]');
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
    });
    
    // Close modal when clicking on backdrop
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        document.body.removeChild(modal);
      }
    });
    
    // Close modal with Escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        document.body.removeChild(modal);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  openEmployeeDetail(request: LeaveRequest): void {
    this.selectedRequestForDetail = request;
  }

  onMonthYearChange(): void {
    // Update employee statistics based on newly selected month/year
    this.updateEmployeeStats();
  }

  getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
  }

  getTotalEmployees(): number {
    return this.employees.length;
  }

  getTotalLeaves(): number {
    return this.employees.reduce((total, employee) => total + employee.totalLeaves, 0);
  }

  getLeaveBalance(totalLeaves: number): number {
    // Assuming a default leave balance of 20 days per year
    const annualLeaveBalance = 20;
    return Math.max(0, annualLeaveBalance - totalLeaves);
  }
}