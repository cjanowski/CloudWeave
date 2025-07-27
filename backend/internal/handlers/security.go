package handlers

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"cloudweave/internal/models"
	"cloudweave/internal/services"

	"github.com/gin-gonic/gin"
)

var securityService *services.SecurityService

// InitializeSecurityService initializes the security service
func InitializeSecurityService(service *services.SecurityService) {
	securityService = service
}

// CreateSecurityScan creates a new security scan
func CreateSecurityScan(c *gin.Context) {
	userID := c.GetString("userID")
	organizationID := c.GetString("organizationID")

	var req models.CreateScanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Security scan creation validation error: %v", err)
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "VALIDATION_ERROR",
				Message:   err.Error(),
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	log.Printf("Creating security scan: %s for user: %s", req.Name, userID)

	scan, err := securityService.CreateScan(c.Request.Context(), userID, organizationID, req)
	if err != nil {
		log.Printf("Failed to create security scan: %v", err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "SCAN_CREATION_FAILED",
				Message:   "Failed to create security scan",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	log.Printf("Security scan created successfully: %s", scan.ID)

	c.JSON(http.StatusCreated, models.ApiResponse{
		Success:   true,
		Data:      scan,
		RequestID: c.GetString("requestID"),
	})
}

// GetSecurityScan retrieves a security scan by ID
func GetSecurityScan(c *gin.Context) {
	organizationID := c.GetString("organizationID")
	scanID := c.Param("id")

	log.Printf("Getting security scan: %s for organization: %s", scanID, organizationID)

	scan, err := securityService.GetScan(c.Request.Context(), organizationID, scanID)
	if err != nil {
		log.Printf("Failed to get security scan: %v", err)
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "SCAN_NOT_FOUND",
				Message:   "Security scan not found",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success:   true,
		Data:      scan,
		RequestID: c.GetString("requestID"),
	})
}

// ListSecurityScans retrieves security scans for an organization
func ListSecurityScans(c *gin.Context) {
	organizationID := c.GetString("organizationID")

	// Parse pagination parameters
	limit := 50
	offset := 0

	if limitStr := c.Query("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 1000 {
			limit = parsedLimit
		}
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	log.Printf("Listing security scans for organization: %s (limit: %d, offset: %d)", organizationID, limit, offset)

	scans, total, err := securityService.ListScans(c.Request.Context(), organizationID, limit, offset)
	if err != nil {
		log.Printf("Failed to list security scans: %v", err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "SCAN_LIST_FAILED",
				Message:   "Failed to retrieve security scans",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"scans":  scans,
			"total":  total,
			"limit":  limit,
			"offset": offset,
		},
		RequestID: c.GetString("requestID"),
	})
}

// GetVulnerabilities retrieves vulnerabilities based on query parameters
func GetVulnerabilities(c *gin.Context) {
	organizationID := c.GetString("organizationID")

	// Parse query parameters
	query := models.VulnerabilityQuery{
		Limit:  50,
		Offset: 0,
	}

	if limitStr := c.Query("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 1000 {
			query.Limit = parsedLimit
		}
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		if parsedOffset, err := strconv.Atoi(offsetStr); err == nil && parsedOffset >= 0 {
			query.Offset = parsedOffset
		}
	}

	if scanID := c.Query("scanId"); scanID != "" {
		query.ScanID = &scanID
	}

	if severity := c.Query("severity"); severity != "" {
		severityEnum := models.VulnerabilitySeverity(severity)
		query.Severity = &severityEnum
	}

	if status := c.Query("status"); status != "" {
		statusEnum := models.VulnerabilityStatus(status)
		query.Status = &statusEnum
	}

	if resourceType := c.Query("resourceType"); resourceType != "" {
		query.ResourceType = &resourceType
	}

	if resourceID := c.Query("resourceId"); resourceID != "" {
		query.ResourceID = &resourceID
	}

	if cveID := c.Query("cveId"); cveID != "" {
		query.CVEID = &cveID
	}

	if startDate := c.Query("startDate"); startDate != "" {
		if parsedDate, err := time.Parse(time.RFC3339, startDate); err == nil {
			query.StartDate = &parsedDate
		}
	}

	if endDate := c.Query("endDate"); endDate != "" {
		if parsedDate, err := time.Parse(time.RFC3339, endDate); err == nil {
			query.EndDate = &parsedDate
		}
	}

	log.Printf("Querying vulnerabilities for organization: %s", organizationID)

	vulnerabilities, total, err := securityService.GetVulnerabilities(c.Request.Context(), organizationID, query)
	if err != nil {
		log.Printf("Failed to query vulnerabilities: %v", err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "VULNERABILITY_QUERY_FAILED",
				Message:   "Failed to retrieve vulnerabilities",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]interface{}{
			"vulnerabilities": vulnerabilities,
			"total":           total,
			"limit":           query.Limit,
			"offset":          query.Offset,
		},
		RequestID: c.GetString("requestID"),
	})
}

// GetVulnerability retrieves a specific vulnerability
func GetVulnerability(c *gin.Context) {
	organizationID := c.GetString("organizationID")
	vulnerabilityID := c.Param("id")

	log.Printf("Getting vulnerability: %s for organization: %s", vulnerabilityID, organizationID)

	vulnerability, err := securityService.GetVulnerability(c.Request.Context(), organizationID, vulnerabilityID)
	if err != nil {
		log.Printf("Failed to get vulnerability: %v", err)
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "VULNERABILITY_NOT_FOUND",
				Message:   "Vulnerability not found",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success:   true,
		Data:      vulnerability,
		RequestID: c.GetString("requestID"),
	})
}

// UpdateVulnerability updates a vulnerability
func UpdateVulnerability(c *gin.Context) {
	userID := c.GetString("userID")
	organizationID := c.GetString("organizationID")
	vulnerabilityID := c.Param("id")

	var req models.UpdateVulnerabilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Vulnerability update validation error: %v", err)
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "VALIDATION_ERROR",
				Message:   err.Error(),
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	log.Printf("Updating vulnerability: %s for user: %s", vulnerabilityID, userID)

	vulnerability, err := securityService.UpdateVulnerability(c.Request.Context(), userID, organizationID, vulnerabilityID, req)
	if err != nil {
		log.Printf("Failed to update vulnerability: %v", err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "VULNERABILITY_UPDATE_FAILED",
				Message:   "Failed to update vulnerability",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	log.Printf("Vulnerability updated successfully: %s", vulnerability.ID)

	c.JSON(http.StatusOK, models.ApiResponse{
		Success:   true,
		Data:      vulnerability,
		RequestID: c.GetString("requestID"),
	})
}

// GetSecurityMetrics retrieves security metrics for an organization
func GetSecurityMetrics(c *gin.Context) {
	organizationID := c.GetString("organizationID")

	log.Printf("Getting security metrics for organization: %s", organizationID)

	metrics, err := securityService.GetSecurityMetrics(c.Request.Context(), organizationID)
	if err != nil {
		log.Printf("Failed to get security metrics: %v", err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error: &models.ApiError{
				Code:      "SECURITY_METRICS_FAILED",
				Message:   "Failed to retrieve security metrics",
				Timestamp: time.Now(),
			},
			RequestID: c.GetString("requestID"),
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success:   true,
		Data:      metrics,
		RequestID: c.GetString("requestID"),
	})
}
