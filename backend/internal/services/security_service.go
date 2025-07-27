package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"cloudweave/internal/models"
	"cloudweave/internal/repositories"

	"github.com/google/uuid"
)

// SecurityService provides security-related operations
type SecurityService struct {
	scanRepo            repositories.SecurityScanRepositoryInterface
	vulnerabilityRepo   repositories.VulnerabilityRepositoryInterface
	auditRepo           repositories.AuditLogRepositoryInterface
	vulnerabilityScanner *VulnerabilityScanner
}

// NewSecurityService creates a new security service
func NewSecurityService(
	scanRepo repositories.SecurityScanRepositoryInterface,
	vulnerabilityRepo repositories.VulnerabilityRepositoryInterface,
	auditRepo repositories.AuditLogRepositoryInterface,
) *SecurityService {
	return &SecurityService{
		scanRepo:            scanRepo,
		vulnerabilityRepo:   vulnerabilityRepo,
		auditRepo:           auditRepo,
		vulnerabilityScanner: NewVulnerabilityScanner(),
	}
}

// CreateScan creates a new security scan
func (s *SecurityService) CreateScan(ctx context.Context, userID, organizationID string, req models.CreateScanRequest) (*models.SecurityScan, error) {
	scan := &models.SecurityScan{
		ID:             uuid.New().String(),
		OrganizationID: organizationID,
		UserID:         userID,
		Name:           req.Name,
		Type:           req.Type,
		Status:         models.ScanStatusPending,
		TargetType:     req.TargetType,
		TargetID:       req.TargetID,
		TargetName:     req.TargetName,
		Configuration:  req.Configuration,
		Progress:       0,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := s.scanRepo.Create(ctx, scan); err != nil {
		return nil, fmt.Errorf("failed to create scan: %w", err)
	}

	// Log audit event
	s.logAuditEvent(ctx, userID, organizationID, "security_scan_created", "security_scan", scan.ID, map[string]interface{}{
		"scan_name": scan.Name,
		"scan_type": scan.Type,
		"target":    scan.TargetName,
	})

	// Start scan asynchronously
	go s.executeScan(context.Background(), scan)

	return scan, nil
}

// GetScan retrieves a security scan by ID
func (s *SecurityService) GetScan(ctx context.Context, organizationID, scanID string) (*models.SecurityScan, error) {
	scan, err := s.scanRepo.GetByID(ctx, organizationID, scanID)
	if err != nil {
		return nil, fmt.Errorf("failed to get scan: %w", err)
	}
	return scan, nil
}

// ListScans retrieves security scans for an organization
func (s *SecurityService) ListScans(ctx context.Context, organizationID string, limit, offset int) ([]*models.SecurityScan, int, error) {
	scans, total, err := s.scanRepo.List(ctx, organizationID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list scans: %w", err)
	}
	return scans, total, nil
}

// GetVulnerabilities retrieves vulnerabilities based on query parameters
func (s *SecurityService) GetVulnerabilities(ctx context.Context, organizationID string, query models.VulnerabilityQuery) ([]*models.Vulnerability, int, error) {
	vulnerabilities, total, err := s.vulnerabilityRepo.Query(ctx, organizationID, query)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query vulnerabilities: %w", err)
	}
	return vulnerabilities, total, nil
}

// GetVulnerability retrieves a specific vulnerability
func (s *SecurityService) GetVulnerability(ctx context.Context, organizationID, vulnerabilityID string) (*models.Vulnerability, error) {
	vulnerability, err := s.vulnerabilityRepo.GetByID(ctx, organizationID, vulnerabilityID)
	if err != nil {
		return nil, fmt.Errorf("failed to get vulnerability: %w", err)
	}
	return vulnerability, nil
}

// UpdateVulnerability updates a vulnerability
func (s *SecurityService) UpdateVulnerability(ctx context.Context, userID, organizationID, vulnerabilityID string, req models.UpdateVulnerabilityRequest) (*models.Vulnerability, error) {
	vulnerability, err := s.vulnerabilityRepo.GetByID(ctx, organizationID, vulnerabilityID)
	if err != nil {
		return nil, fmt.Errorf("failed to get vulnerability: %w", err)
	}

	// Update fields
	vulnerability.Status = req.Status
	if req.Recommendation != nil {
		vulnerability.Recommendation = *req.Recommendation
	}
	if req.Tags != nil {
		vulnerability.Tags = req.Tags
	}
	vulnerability.UpdatedAt = time.Now()

	// Mark as resolved if status is resolved
	if req.Status == models.VulnStatusResolved {
		now := time.Now()
		vulnerability.ResolvedAt = &now
	}

	if err := s.vulnerabilityRepo.Update(ctx, vulnerability); err != nil {
		return nil, fmt.Errorf("failed to update vulnerability: %w", err)
	}

	// Log audit event
	s.logAuditEvent(ctx, userID, organizationID, "vulnerability_updated", "vulnerability", vulnerabilityID, map[string]interface{}{
		"old_status": vulnerability.Status,
		"new_status": req.Status,
		"title":      vulnerability.Title,
	})

	return vulnerability, nil
}

// GetSecurityMetrics retrieves security metrics for an organization
func (s *SecurityService) GetSecurityMetrics(ctx context.Context, organizationID string) (*models.SecurityMetrics, error) {
	// Get vulnerability counts by severity
	severityCounts, err := s.vulnerabilityRepo.GetCountsBySeverity(ctx, organizationID)
	if err != nil {
		return nil, fmt.Errorf("failed to get severity counts: %w", err)
	}

	// Get vulnerability counts by status
	statusCounts, err := s.vulnerabilityRepo.GetCountsByStatus(ctx, organizationID)
	if err != nil {
		return nil, fmt.Errorf("failed to get status counts: %w", err)
	}

	// Get recent scans count (last 30 days)
	recentScans, err := s.scanRepo.GetRecentCount(ctx, organizationID, 30)
	if err != nil {
		return nil, fmt.Errorf("failed to get recent scans count: %w", err)
	}

	// Calculate total vulnerabilities
	totalVulnerabilities := 0
	for _, count := range severityCounts {
		totalVulnerabilities += count
	}

	// Calculate compliance score (simplified)
	complianceScore := s.calculateComplianceScore(severityCounts, totalVulnerabilities)

	// Get security trends (last 30 days)
	trends, err := s.getSecurityTrends(ctx, organizationID, 30)
	if err != nil {
		log.Printf("Failed to get security trends: %v", err)
		trends = []models.SecurityTrendPoint{}
	}

	return &models.SecurityMetrics{
		TotalVulnerabilities:      totalVulnerabilities,
		OpenVulnerabilities:       statusCounts[models.VulnStatusOpen],
		VulnerabilitiesBySeverity: severityCounts,
		VulnerabilitiesByStatus:   statusCounts,
		RecentScans:               recentScans,
		ComplianceScore:           complianceScore,
		SecurityTrends:            trends,
	}, nil
}

// executeScan executes a security scan
func (s *SecurityService) executeScan(ctx context.Context, scan *models.SecurityScan) {
	log.Printf("Starting execution of scan: %s", scan.ID)

	// Update scan status to running
	scan.Status = models.ScanStatusRunning
	scan.Progress = 10
	now := time.Now()
	scan.StartedAt = &now
	scan.UpdatedAt = time.Now()
	
	if err := s.scanRepo.Update(ctx, scan); err != nil {
		log.Printf("Failed to update scan status: %v", err)
		return
	}

	var vulnerabilities []*models.Vulnerability
	var err error

	// Execute scan based on type
	switch scan.Type {
	case models.ScanTypeInfrastructure:
		vulnerabilities, err = s.vulnerabilityScanner.ScanInfrastructure(ctx, scan)
	case models.ScanTypeApplication:
		vulnerabilities, err = s.vulnerabilityScanner.ScanApplication(ctx, scan)
	case models.ScanTypeContainer:
		vulnerabilities, err = s.vulnerabilityScanner.ScanContainer(ctx, scan)
	case models.ScanTypeNetwork:
		vulnerabilities, err = s.vulnerabilityScanner.ScanNetwork(ctx, scan)
	default:
		err = fmt.Errorf("unsupported scan type: %s", scan.Type)
	}

	if err != nil {
		log.Printf("Scan failed: %s, error: %v", scan.ID, err)
		scan.Status = models.ScanStatusFailed
		errMsg := err.Error()
		scan.ErrorMessage = &errMsg
		scan.Progress = 0
	} else {
		log.Printf("Scan completed successfully: %s", scan.ID)
		
		// Save vulnerabilities
		for _, vuln := range vulnerabilities {
			if err := s.vulnerabilityRepo.Create(ctx, vuln); err != nil {
				log.Printf("Failed to save vulnerability: %v", err)
			}
		}

		// Update scan with results
		scan.Status = models.ScanStatusCompleted
		scan.Progress = 100
		scan.Summary = s.generateScanSummary(vulnerabilities)
	}

	// Update scan completion
	completedAt := time.Now()
	scan.CompletedAt = &completedAt
	if scan.StartedAt != nil {
		duration := int(completedAt.Sub(*scan.StartedAt).Seconds())
		scan.Duration = &duration
	}
	scan.UpdatedAt = time.Now()

	if err := s.scanRepo.Update(ctx, scan); err != nil {
		log.Printf("Failed to update scan completion: %v", err)
	}

	log.Printf("Scan execution completed: %s", scan.ID)
}

// generateScanSummary generates a summary of scan results
func (s *SecurityService) generateScanSummary(vulnerabilities []*models.Vulnerability) *models.ScanSummary {
	summary := &models.ScanSummary{
		TotalVulnerabilities:      len(vulnerabilities),
		VulnerabilitiesBySeverity: make(map[models.VulnerabilitySeverity]int),
		ResourcesScanned:          1, // Simplified for now
		HighestSeverity:           models.VulnSeverityInfo,
	}

	for _, vuln := range vulnerabilities {
		summary.VulnerabilitiesBySeverity[vuln.Severity]++
		
		// Update highest severity
		if s.severityLevel(vuln.Severity) > s.severityLevel(summary.HighestSeverity) {
			summary.HighestSeverity = vuln.Severity
		}
	}

	return summary
}

// severityLevel returns numeric level for severity comparison
func (s *SecurityService) severityLevel(severity models.VulnerabilitySeverity) int {
	switch severity {
	case models.VulnSeverityCritical:
		return 4
	case models.VulnSeverityHigh:
		return 3
	case models.VulnSeverityMedium:
		return 2
	case models.VulnSeverityLow:
		return 1
	default:
		return 0
	}
}

// calculateComplianceScore calculates a simplified compliance score
func (s *SecurityService) calculateComplianceScore(severityCounts map[models.VulnerabilitySeverity]int, total int) float64 {
	if total == 0 {
		return 100.0
	}

	// Weighted scoring based on severity
	criticalWeight := 10.0
	highWeight := 5.0
	mediumWeight := 2.0
	lowWeight := 1.0

	totalWeight := float64(severityCounts[models.VulnSeverityCritical])*criticalWeight +
		float64(severityCounts[models.VulnSeverityHigh])*highWeight +
		float64(severityCounts[models.VulnSeverityMedium])*mediumWeight +
		float64(severityCounts[models.VulnSeverityLow])*lowWeight

	maxPossibleWeight := float64(total) * criticalWeight
	if maxPossibleWeight == 0 {
		return 100.0
	}

	score := (1.0 - (totalWeight / maxPossibleWeight)) * 100.0
	if score < 0 {
		score = 0
	}

	return score
}

// getSecurityTrends gets security trend data for the specified number of days
func (s *SecurityService) getSecurityTrends(ctx context.Context, organizationID string, days int) ([]models.SecurityTrendPoint, error) {
	// This would typically query historical data
	// For now, return mock trend data
	trends := []models.SecurityTrendPoint{}
	
	for i := days; i >= 0; i-- {
		date := time.Now().AddDate(0, 0, -i)
		trends = append(trends, models.SecurityTrendPoint{
			Date:               date,
			VulnerabilityCount: 10 + (i % 5), // Mock data
			CriticalCount:      i % 3,
			HighCount:          (i % 4) + 1,
			ComplianceScore:    85.0 + float64(i%10),
		})
	}
	
	return trends, nil
}

// logAuditEvent logs a security-related audit event
func (s *SecurityService) logAuditEvent(ctx context.Context, userID, organizationID, action, resourceType, resourceID string, details map[string]interface{}) {
	if s.auditRepo == nil {
		return
	}

	auditLog := &models.AuditLog{
		ID:             uuid.New().String(),
		OrganizationID: organizationID,
		UserID:         &userID,
		Action:         action,
		ResourceType:   &resourceType,
		ResourceID:     &resourceID,
		Details:        details,
		CreatedAt:      time.Now(),
	}

	if err := s.auditRepo.Create(ctx, auditLog); err != nil {
		log.Printf("Failed to log audit event: %v", err)
	}
}