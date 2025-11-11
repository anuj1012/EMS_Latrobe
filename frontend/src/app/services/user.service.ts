import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, CreateUserRequest } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  createUser(user: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, user);
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`);
  }

  // Force delete user - emergency method for problematic deletions
  forceDeleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/force-delete/${userId}`);
  }

  getUserLeaveStats(userId: number, year?: number, month?: number): Observable<any> {
    let url = `${this.apiUrl}/users/${userId}/leave-stats`;
    if (year !== undefined && month !== undefined) {
      url += `?year=${year}&month=${month}`;
    }
    return this.http.get(url);
  }
}