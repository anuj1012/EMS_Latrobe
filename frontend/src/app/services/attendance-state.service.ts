import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AttendanceRecord } from '../models/attendance.model';

interface UserAttendanceState {
  isCheckedIn: boolean;
  currentRecord: AttendanceRecord | null;
  lastRefreshTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceStateService {
  private attendanceStateSubject = new BehaviorSubject<UserAttendanceState>({
    isCheckedIn: false,
    currentRecord: null,
    lastRefreshTime: 0
  });

  private refreshTriggerSubject = new BehaviorSubject<boolean>(false);
  private userStates = new Map<number, UserAttendanceState>();
  private currentUserId: number | null = null;
  private currentState: UserAttendanceState = {
    isCheckedIn: false,
    currentRecord: null,
    lastRefreshTime: 0
  };

  constructor() {}

  getAttendanceState(): Observable<UserAttendanceState> {
    return this.attendanceStateSubject.asObservable();
  }

  getRefreshTrigger(): Observable<boolean> {
    return this.refreshTriggerSubject.asObservable();
  }

  setCurrentUser(userId: number) {
    console.log('👤 SETTING CURRENT USER:', userId);
    this.currentUserId = userId;
    
    // Load user-specific state
    const userState = this.userStates.get(userId) || {
      isCheckedIn: false,
      currentRecord: null,
      lastRefreshTime: 0
    };
    
    this.currentState = userState;
    this.attendanceStateSubject.next(this.currentState);
    console.log('🔄 USER STATE LOADED:', userState);
  }

  updateAttendanceState(isCheckedIn: boolean, currentRecord: AttendanceRecord | null) {
    if (!this.currentUserId) {
      console.warn('⚠️ No current user set, cannot update state');
      return;
    }

    this.currentState = {
      isCheckedIn,
      currentRecord,
      lastRefreshTime: Date.now()
    };

    // Store user-specific state
    this.userStates.set(this.currentUserId, this.currentState);
    
    this.attendanceStateSubject.next(this.currentState);
    console.log('🔄 STATE UPDATED FOR USER', this.currentUserId, ':', this.currentState);
  }

  getCurrentState() {
    return this.currentState;
  }

  getUserState(userId: number): UserAttendanceState {
    return this.userStates.get(userId) || {
      isCheckedIn: false,
      currentRecord: null,
      lastRefreshTime: 0
    };
  }

  triggerRefresh() {
    console.log('🚀 TRIGGERING REFRESH');
    this.refreshTriggerSubject.next(true);
  }

  resetState() {
    if (!this.currentUserId) {
      console.warn('⚠️ No current user set, cannot reset state');
      return;
    }

    this.currentState = {
      isCheckedIn: false,
      currentRecord: null,
      lastRefreshTime: 0
    };

    // Update user-specific state
    this.userStates.set(this.currentUserId, this.currentState);
    this.attendanceStateSubject.next(this.currentState);
    console.log('🔄 STATE RESET FOR USER', this.currentUserId);
  }

  clearUserState(userId: number) {
    this.userStates.delete(userId);
    console.log('🗑️ STATE CLEARED FOR USER', userId);
  }

  logout() {
    console.log('🚪 LOGOUT - CLEARING CURRENT USER STATE');
    this.currentUserId = null;
    this.currentState = {
      isCheckedIn: false,
      currentRecord: null,
      lastRefreshTime: 0
    };
    this.attendanceStateSubject.next(this.currentState);
  }

  // Method to check if we need to refresh state from database
  shouldRefreshState(): boolean {
    if (!this.currentUserId) return false;
    
    const userState = this.userStates.get(this.currentUserId);
    if (!userState) return true;
    
    // Refresh if state is older than 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return userState.lastRefreshTime < fiveMinutesAgo;
  }

  // Method to mark state as refreshed
  markStateRefreshed() {
    if (this.currentUserId) {
      this.currentState.lastRefreshTime = Date.now();
      this.userStates.set(this.currentUserId, this.currentState);
    }
  }
}
