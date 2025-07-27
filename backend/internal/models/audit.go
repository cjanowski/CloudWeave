package models

import (
	"net"
	"time"
)

type AuditLog struct {
	ID             string                 `json:"id" db:"id"`
	OrganizationID string                 `json:"organizationId" db:"organization_id"`
	UserID         *string                `json:"userId" db:"user_id"`
	Action         string                 `json:"action" db:"action"`
	ResourceType   *string                `json:"resourceType" db:"resource_type"`
	ResourceID     *string                `json:"resourceId" db:"resource_id"`
	Details        map[string]interface{} `json:"details" db:"details"`
	IPAddress      *net.IP                `json:"ipAddress" db:"ip_address"`
	UserAgent      *string                `json:"userAgent" db:"user_agent"`
	CreatedAt      time.Time              `json:"createdAt" db:"created_at"`
}

type CreateAuditLogRequest struct {
	Action       string                 `json:"action" binding:"required,min=1,max=100"`
	ResourceType *string                `json:"resourceType,omitempty"`
	ResourceID   *string                `json:"resourceId,omitempty"`
	Details      map[string]interface{} `json:"details,omitempty"`
	IPAddress    *string                `json:"ipAddress,omitempty"`
	UserAgent    *string                `json:"userAgent,omitempty"`
}

type AuditLogQuery struct {
	UserID       *string   `json:"userId,omitempty"`
	Action       *string   `json:"action,omitempty"`
	ResourceType *string   `json:"resourceType,omitempty"`
	ResourceID   *string   `json:"resourceId,omitempty"`
	StartTime    time.Time `json:"startTime" binding:"required"`
	EndTime      time.Time `json:"endTime" binding:"required"`
	Limit        int       `json:"limit,omitempty"`
	Offset       int       `json:"offset,omitempty"`
}

// Common audit actions
const (
	ActionCreate = "create"
	ActionRead   = "read"
	ActionUpdate = "update"
	ActionDelete = "delete"
	ActionLogin  = "login"
	ActionLogout = "logout"
	ActionDeploy = "deploy"
	ActionScale  = "scale"
	ActionStop   = "stop"
	ActionStart  = "start"
)
