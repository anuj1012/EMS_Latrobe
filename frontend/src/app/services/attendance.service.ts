import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AttendanceRecord } from '../models/attendance.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = environment.apiUrl + '/attendance';

  constructor(private http: HttpClient) { }

  checkIn(record: Omit<AttendanceRecord, 'id'>): Observable<AttendanceRecord> {
    console.log('Sending check-in request:', record);
    return this.http.post<AttendanceRecord>(`${this.apiUrl}/check-in`, record).pipe(
      tap(response => console.log('Check-in response:', response)),
      catchError(this.handleError)
    );
  }

  checkOut(id: number, record: Partial<AttendanceRecord>): Observable<AttendanceRecord> {
    console.log('Sending check-out request for ID', id, 'with data:', record);
    return this.http.put<AttendanceRecord>(`${this.apiUrl}/check-out/${id}`, record).pipe(
      tap(response => console.log('Check-out response:', response)),
      catchError(this.handleError)
    );
  }

  getAllAttendanceRecords(): Observable<AttendanceRecord[]> {
    console.log('Fetching all attendance records');
    return this.http.get<AttendanceRecord[]>(this.apiUrl).pipe(
      tap(response => {
        console.log('All attendance records response:', response);
        // Sort by date descending (latest first) as additional safety
        response.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }),
      catchError(this.handleError)
    );
  }

  getAttendanceByUserId(userId: number): Observable<AttendanceRecord[]> {
    console.log('Fetching attendance records for user ID:', userId);
    return this.http.get<AttendanceRecord[]>(`${this.apiUrl}/user/${userId}`).pipe(
      tap(response => {
        console.log('User attendance records response:', response);
        // Sort by date descending (latest first) as additional safety
        response.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }),
      catchError(this.handleError)
    );
  }

  getAttendanceById(id: number): Observable<AttendanceRecord> {
    console.log('Fetching attendance record by ID:', id);
    return this.http.get<AttendanceRecord>(`${this.apiUrl}/${id}`).pipe(
      tap(response => console.log('Attendance record by ID response:', response)),
      catchError(this.handleError)
    );
  }

  checkInWithFile(formData: FormData): Observable<AttendanceRecord> {
    console.log('Sending check-in with file request');
    return this.http.post<AttendanceRecord>(`${this.apiUrl}/check-in/file`, formData).pipe(
      tap(response => console.log('Check-in with file response:', response)),
      catchError(this.handleError)
    );
  }

  checkOutWithFile(id: number, formData: FormData): Observable<AttendanceRecord> {
    console.log('Sending check-out with file request for ID', id);
    return this.http.put<AttendanceRecord>(`${this.apiUrl}/check-out/${id}/file`, formData).pipe(
      tap(response => console.log('Check-out with file response:', response)),
      catchError(this.handleError)
    );
  }

  getPhotoUrl(objectKey: string): Observable<string> {
    console.log('Getting photo URL for object key:', objectKey);
    return this.http.get<string>(`${this.apiUrl}/photo/${encodeURIComponent(objectKey)}`).pipe(
      tap(response => console.log('Photo URL response:', response)),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => errorMessage);
  }
}