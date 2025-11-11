import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts: Toast[] = [];
  private counter = 0;
  private toastsSubject = new BehaviorSubject<Toast[]>([]);

  getToasts(): Observable<Toast[]> {
    return this.toastsSubject.asObservable();
  }

  show(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, duration: number = 5000): void {
    const toast: Toast = {
      id: this.counter++,
      type,
      title,
      message,
      duration
    };

    this.toasts.push(toast);
    this.toastsSubject.next([...this.toasts]);

    // Auto remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast.id);
      }, duration);
    }
  }

  success(title: string, message: string, duration?: number): void {
    this.show('success', title, message, duration);
  }

  error(title: string, message: string, duration?: number): void {
    this.show('error', title, message, duration);
  }

  warning(title: string, message: string, duration?: number): void {
    this.show('warning', title, message, duration);
  }

  info(title: string, message: string, duration?: number): void {
    this.show('info', title, message, duration);
  }

  remove(id: number): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.toastsSubject.next([...this.toasts]);
  }
}