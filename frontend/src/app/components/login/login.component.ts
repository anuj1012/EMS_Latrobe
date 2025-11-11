import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ModalService } from '../../services/modal.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';

interface LoginData {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, ModalComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginData: LoginData = {
    email: '',
    password: ''
  };
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
    private modalService: ModalService
  ) {}

  onSubmit(): void {
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        console.log('Login successful', response);
        this.isLoading = false;
        this.modalService.showSuccess('Login Successful', 'Welcome to Latrobe Computing!');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Login error', error);
        this.isLoading = false;
        if (error.status === 401) {
          this.errorMessage = 'Invalid email or password';
          this.modalService.showInfo('Login Failed', 'Invalid email or password. Please try again.');
        } else {
          this.errorMessage = 'An error occurred. Please try again later.';
          this.modalService.showInfo('Login Failed', 'An error occurred. Please try again later.');
        }
      }
    });
  }
}