import { Component, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { LeaveService } from '../../services/leave.service';
import { ToastService } from '../../services/toast.service';
import { ModalService } from '../../services/modal.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LeaveRequest } from '../../models/leave-request.model';
import { LEAVE_TYPES } from '../../models/leave-request.model';

@Component({
  selector: 'app-leave-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './leave-form.component.html',
  styleUrls: ['./leave-form.component.scss']
})
export class LeaveFormComponent {
  @Output() leaveSubmitted = new EventEmitter<void>();

  leaveRequest: LeaveRequest = {
    startDate: '',
    endDate: '',
    leaveType: '',
    reason: ''
  };

  leaveTypes = LEAVE_TYPES;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private leaveService: LeaveService,
    private toastService: ToastService,
    private modalService: ModalService
  ) {}

  onSubmit(): void {
    if (!this.leaveRequest.leaveType || !this.leaveRequest.startDate || 
        !this.leaveRequest.endDate || !this.leaveRequest.reason) {
      this.errorMessage = 'Please fill in all required fields';
      this.modalService.showInfo('Form Error', 'Please fill in all required fields');
      return;
    }

    if (!this.isEndDateValid()) {
      this.errorMessage = 'End date must be after or equal to start date';
      this.modalService.showInfo('Date Error', 'End date must be after or equal to start date');
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.leaveService.applyLeave(this.leaveRequest).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = 'Leave request submitted successfully!';
        
        // Show success modal with redirect to pending requests
        this.modalService.showSuccess(
          'Leave Request Submitted!',
          'Your leave request has been sent to the admin. Please wait for approval.',
          () => {
            // Redirect to pending requests section
            this.leaveSubmitted.emit();
          }
        );
        
        this.resetForm();
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error submitting leave request', error);
        this.errorMessage = 'Failed to submit leave request';
        this.modalService.showInfo('Error', 'Failed to submit leave request');
      }
    });
  }

  resetForm(): void {
    this.leaveRequest = {
      startDate: '',
      endDate: '',
      leaveType: '',
      reason: ''
    };
    this.successMessage = '';
    this.errorMessage = '';
  }

  isEndDateValid(): boolean {
    if (!this.leaveRequest.startDate || !this.leaveRequest.endDate) {
      return true;
    }
    return new Date(this.leaveRequest.endDate) >= new Date(this.leaveRequest.startDate);
  }

  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}