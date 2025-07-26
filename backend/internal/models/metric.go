package models

import "time"

type Metric struct {
	ID           string                 `json:"id" db:"id"`
	ResourceID   *string                `json:"resourceId" db:"resource_id"`
	ResourceType string                 `json:"resourceType" db:"resource_type"`
	MetricName   string                 `json:"metricName" db:"metric_name"`
	Value        float64                `json:"value" db:"value"`
	Unit         *string                `json:"unit" db:"unit"`
	Tags         map[string]interface{} `json:"tags" db:"tags"`
	Timestamp    time.Time              `json:"timestamp" db:"timestamp"`
	CreatedAt    time.Time              `json:"createdAt" db:"created_at"`
}

type CreateMetricRequest struct {
	ResourceID   *string                `json:"resourceId,omitempty"`
	ResourceType string                 `json:"resourceType" binding:"required,min=1,max=50"`
	MetricName   string                 `json:"metricName" binding:"required,min=1,max=100"`
	Value        float64                `json:"value" binding:"required"`
	Unit         *string                `json:"unit,omitempty"`
	Tags         map[string]interface{} `json:"tags,omitempty"`
	Timestamp    *time.Time             `json:"timestamp,omitempty"`
}

type MetricQuery struct {
	ResourceID   *string   `json:"resourceId,omitempty"`
	ResourceType *string   `json:"resourceType,omitempty"`
	MetricName   *string   `json:"metricName,omitempty"`
	StartTime    time.Time `json:"startTime" binding:"required"`
	EndTime      time.Time `json:"endTime" binding:"required"`
	Limit        int       `json:"limit,omitempty"`
	Offset       int       `json:"offset,omitempty"`
}

// Common metric names
const (
	MetricCPUUsage    = "cpu_usage"
	MetricMemoryUsage = "memory_usage"
	MetricDiskUsage   = "disk_usage"
	MetricNetworkIn   = "network_in"
	MetricNetworkOut  = "network_out"
	MetricLatency     = "latency"
	MetricThroughput  = "throughput"
	MetricErrorRate   = "error_rate"
)

// Common resource types for metrics
const (
	ResourceTypeServer     = "server"
	ResourceTypeDatabase   = "database"
	ResourceTypeApplication = "application"
	ResourceTypeService    = "service"
	ResourceTypeContainer  = "container"
)