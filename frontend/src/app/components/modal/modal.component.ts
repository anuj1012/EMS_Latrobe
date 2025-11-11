import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService, ModalConfig } from '../../services/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isVisible" class="modal-overlay" (click)="onOverlayClick()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="material-icons me-2" [ngClass]="getIconClass()">{{ getIcon() }}</i>
            {{ modalConfig?.title }}
          </h5>
          <button type="button" class="btn-close" (click)="closeModal()" aria-label="Close">
            <i class="material-icons">close</i>
          </button>
        </div>
        <div class="modal-body">
          <p class="modal-message">{{ modalConfig?.message }}</p>
        </div>
        <div class="modal-footer">
          <button 
            *ngIf="modalConfig?.showCancelButton" 
            type="button" 
            class="btn btn-secondary" 
            (click)="onCancel()">
            {{ modalConfig?.cancelText || 'Cancel' }}
          </button>
          <button 
            type="button" 
            class="btn" 
            [ngClass]="getButtonClass()" 
            (click)="onConfirm()">
            {{ modalConfig?.confirmText || 'OK' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1050;
      backdrop-filter: blur(4px);
    }

    .modal-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow: hidden;
      animation: modalSlideIn 0.3s ease-out;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(-20px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .modal-header {
      padding: 1.5rem 1.5rem 0 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
      display: flex;
      align-items: center;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #6b7280;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .btn-close:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-message {
      margin: 0;
      color: #4b5563;
      line-height: 1.6;
      font-size: 1rem;
    }

    .modal-footer {
      padding: 0 1.5rem 1.5rem 1.5rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-success {
      background: #10b981;
      color: white;
    }

    .btn-success:hover {
      background: #059669;
    }

    .btn-info {
      background: #3b82f6;
      color: white;
    }

    .btn-info:hover {
      background: #2563eb;
    }

    .btn-warning {
      background: #f59e0b;
      color: white;
    }

    .btn-warning:hover {
      background: #d97706;
    }

    .btn-error {
      background: #ef4444;
      color: white;
    }

    .btn-error:hover {
      background: #dc2626;
    }

    .text-success {
      color: #10b981;
    }

    .text-info {
      color: #3b82f6;
    }

    .text-warning {
      color: #f59e0b;
    }

    .text-error {
      color: #ef4444;
    }
  `]
})
export class ModalComponent implements OnInit, OnDestroy {
  isVisible = false;
  modalConfig: ModalConfig | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private modalService: ModalService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.modalService.isVisible().subscribe(visible => {
        this.isVisible = visible;
      }),
      this.modalService.getModal().subscribe(config => {
        this.modalConfig = config;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onOverlayClick(): void {
    if (!this.modalConfig?.showCancelButton) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.modalService.hideModal();
  }

  onConfirm(): void {
    if (this.modalConfig?.onConfirm) {
      this.modalConfig.onConfirm();
    } else {
      this.closeModal();
    }
  }

  onCancel(): void {
    if (this.modalConfig?.onCancel) {
      this.modalConfig.onCancel();
    } else {
      this.closeModal();
    }
  }

  getIcon(): string {
    switch (this.modalConfig?.type) {
      case 'success':
        return 'check_circle';
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  }

  getIconClass(): string {
    return `text-${this.modalConfig?.type || 'info'}`;
  }

  getButtonClass(): string {
    return `btn-${this.modalConfig?.type || 'info'}`;
  }
}
