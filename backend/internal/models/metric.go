package models

import "time"

type Metric struct {
	ID           string                 `json:"id" db:"id"`
	ResourceID   *string                `json:"resourceId" db:"resource_id"`
	ResourceType string                 `json:"resourceType" db:"resource_type"`
	MetricName   string                 `json:"metricName" db:"metric_name"`
	Value        float64                `json:"value" db:"value"`
	Unit         string                 `json:"unit" db:"unit"`
	Tags         map[string]interface{} `json:"tags" db:"tags"`
	Timestamp    time.Time              `json:"timestamp" db:"timestamp"`
	CreatedAt    time.Time              `json:"createdAt" db:"created_at"`
}

// Metric types
const (
	MetricTypeCPU         = "cpu_utilization"
	MetricTypeMemory      = "memory_utilization"
	MetricTypeDisk        = "disk_utilization"
	MetricTypeNetwork     = "network_throughput"
	MetricTypeLatency     = "response_latency"
	MetricTypeThroughput  = "request_throughput"
	MetricTypeErrorRate   = "error_rate"
	MetricTypeAvailability = "availability"
)

// Resource types for metrics
const (
	ResourceTypeServer     = "server"
	ResourceTypeDatabase   = "database"
	ResourceTypeApplication = "application"
	ResourceTypeService    = "service"
	ResourceTypeContainer  = "container"
)

// MetricQuery represents query parameters for metrics
type MetricQuery struct {
	ResourceID   *string    `json:"resourceId"`
	ResourceType *string    `json:"resourceType"`
	MetricName   *string    `json:"metricName"`
	StartTime    *time.Time `json:"startTime"`
	EndTime      *time.Time `json:"endTime"`
	Limit        int        `json:"limit"`
	Offset       int        `json:"offset"`
}