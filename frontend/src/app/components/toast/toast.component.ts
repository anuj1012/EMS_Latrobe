import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div 
        *ngFor="let toast of toasts" 
        class="toast glass-card {{ getToastClass(toast.type) }} show"
        role="alert"
        aria-live="assertive"
        aria-atomic="true">
        <div class="toast-icon">
          <i class="material-icons">{{ getToastIcon(toast.type) }}</i>
        </div>
        <div class="toast-content">
          <h5 class="toast-title">{{ toast.title }}</h5>
          <p class="toast-message">{{ toast.message }}</p>
        </div>
        <button 
          type="button" 
          class="toast-close" 
          (click)="removeToast(toast.id)"
          aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./toast.component.scss']
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private toastSubscription: Subscription | undefined;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastSubscription = this.toastService.getToasts().subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  ngOnDestroy(): void {
    if (this.toastSubscription) {
      this.toastSubscription.unsubscribe();
    }
  }

  getToastClass(type: string): string {
    return `toast-${type}`;
  }

  getToastIcon(type: 'success' | 'error' | 'warning' | 'info'): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  }

  removeToast(id: number): void {
    this.toastService.remove(id);
  }
}