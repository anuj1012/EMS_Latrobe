package com.company.leaveapproval.dto;

import jakarta.validation.constraints.NotBlank;

public class LeaveApprovalDto {
    @NotBlank
    private String status; // APPROVED or REJECTED

    private String adminComment;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAdminComment() {
        return adminComment;
    }

    public void setAdminComment(String adminComment) {
        this.adminComment = adminComment;
    }
}