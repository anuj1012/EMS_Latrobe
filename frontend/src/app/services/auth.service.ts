import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError } from 'rxjs';
import { LoginRequest, LoginResponse, User } from '../models/user.model';
import { environment } from '../../environments/environment';
import { throwError } from 'rxjs';
import { AttendanceStateService } from './attendance-state.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private attendanceStateService: AttendanceStateService
  ) {
    this.loadCurrentUser();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    // Normalize email to lowercase to match backend behavior
    const normalizedCredentials = {
      ...credentials,
      email: credentials.email?.trim().toLowerCase() || ''
    };
    console.log('Attempting login with credentials:', normalizedCredentials);
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/signin`, normalizedCredentials)
      .pipe(
        tap(response => {
          console.log('Login successful, response:', response);
          localStorage.setItem('token', response.accessToken);
          const user: User = {
            id: response.id,
            firstName: response.firstName,
            lastName: response.lastName,
            email: response.email,
            department: '',
            designation: '',
            role: response.role
          };
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
          
          // Set current user in attendance state service
          this.attendanceStateService.setCurrentUser(user.id);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    // Clear attendance state when logging out
    this.attendanceStateService.logout();
    
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'ADMIN';
  }

  private loadCurrentUser(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.currentUserSubject.next(user);
      
      // Set current user in attendance state service if user exists
      if (user && user.id) {
        this.attendanceStateService.setCurrentUser(user.id);
      }
    }
  }
}