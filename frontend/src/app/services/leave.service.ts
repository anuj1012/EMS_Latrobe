import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LeaveRequest, LeaveApproval } from '../models/leave-request.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  applyLeave(leaveRequest: LeaveRequest): Observable<LeaveRequest> {
    return this.http.post<LeaveRequest>(`${this.apiUrl}/leaves/apply`, leaveRequest);
  }

  getMyLeaveRequests(): Observable<LeaveRequest[]> {
    return this.http.get<LeaveRequest[]>(`${this.apiUrl}/leaves/my-requests`);
  }

  getAllLeaveRequests(): Observable<LeaveRequest[]> {
    return this.http.get<LeaveRequest[]>(`${this.apiUrl}/leaves/all`);
  }

  getPendingLeaveRequests(): Observable<LeaveRequest[]> {
    return this.http.get<LeaveRequest[]>(`${this.apiUrl}/leaves/pending`);
  }

  approveLeaveRequest(id: number, approval: LeaveApproval): Observable<LeaveRequest> {
    return this.http.put<LeaveRequest>(`${this.apiUrl}/leaves/${id}/approve`, approval);
  }

  deleteLeaveRequest(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/leaves/${id}`);
  }
}