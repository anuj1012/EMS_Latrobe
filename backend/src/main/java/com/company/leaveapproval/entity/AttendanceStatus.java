package com.company.leaveapproval.entity;

public enum AttendanceStatus {
    IN_PROGRESS("In Progress"),
    COMPLETED("Completed");

    private final String value;

    AttendanceStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    @Override
    public String toString() {
        return value;
    }
}