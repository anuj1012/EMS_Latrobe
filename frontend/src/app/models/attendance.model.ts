export interface AttendanceRecord {
  id?: number;
  userId: number;
  date: string; // YYYY-MM-DD
  checkInTime: string; // ISO format
  checkOutTime?: string; // ISO format
  status: 'In Progress' | 'Completed';
  latitude?: number;
  longitude?: number;
  photo?: string; // Base64 encoded image (check-in photo) - for backward compatibility
  checkInPhoto?: string; // Base64 encoded image (check-in photo)
  checkOutPhoto?: string; // Base64 encoded image (check-out photo)
}