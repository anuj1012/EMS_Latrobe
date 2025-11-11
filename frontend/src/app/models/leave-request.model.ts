export interface LeaveRequest {
  id?: number;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  status?: string;
  adminComment?: string;
  employeeName?: string;
  employeeEmail?: string;
  approvedByName?: string;
}

export interface LeaveApproval {
  status: string;
  adminComment?: string;
}

export const LEAVE_TYPES = [
  'Annual Leave',
  'Sick Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Personal Leave',
  'Emergency Leave'
];

export const LEAVE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};