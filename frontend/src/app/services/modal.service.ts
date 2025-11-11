import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ModalConfig {
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  showCancelButton?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalSubject = new BehaviorSubject<ModalConfig | null>(null);
  private isVisibleSubject = new BehaviorSubject<boolean>(false);

  getModal(): Observable<ModalConfig | null> {
    return this.modalSubject.asObservable();
  }

  isVisible(): Observable<boolean> {
    return this.isVisibleSubject.asObservable();
  }

  showModal(config: ModalConfig): void {
    this.modalSubject.next(config);
    this.isVisibleSubject.next(true);
  }

  hideModal(): void {
    this.modalSubject.next(null);
    this.isVisibleSubject.next(false);
  }

  confirm(config: Omit<ModalConfig, 'showCancelButton'>): Promise<boolean> {
    return new Promise((resolve) => {
      const modalConfig: ModalConfig = {
        ...config,
        showCancelButton: true,
        confirmText: config.confirmText || 'Confirm',
        cancelText: config.cancelText || 'Cancel',
        onConfirm: () => {
          this.hideModal();
          resolve(true);
        },
        onCancel: () => {
          this.hideModal();
          resolve(false);
        }
      };
      this.showModal(modalConfig);
    });
  }

  showSuccess(title: string, message: string, onConfirm?: () => void): void {
    this.showModal({
      title,
      message,
      type: 'success',
      showCancelButton: false,
      confirmText: 'OK',
      onConfirm: () => {
        this.hideModal();
        if (onConfirm) onConfirm();
      }
    });
  }

  showInfo(title: string, message: string, onConfirm?: () => void): void {
    this.showModal({
      title,
      message,
      type: 'info',
      showCancelButton: false,
      confirmText: 'OK',
      onConfirm: () => {
        this.hideModal();
        if (onConfirm) onConfirm();
      }
    });
  }
}





