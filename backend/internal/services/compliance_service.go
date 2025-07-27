package services

import (
	"context"
	"fmt"
	"time"

	"cloudweave/internal/models"
	"cloudweave/internal/repositories"
)

// ComplianceService handles compliance-related business logic
type ComplianceService struct {
	frameworkRepo  repositories.ComplianceFrameworkRepositoryInterface
	controlRepo    repositories.ComplianceControlRepositoryInterface
	assessmentRepo repositories.ComplianceAssessmentRepositoryInterface
	auditRepo      repositories.AuditLogRepositoryInterface
	txManager      repositories.TransactionManager
}

// NewComplianceService creates a new compliance service
func NewComplianceService(
	frameworkRepo repositories.ComplianceFrameworkRepositoryInterface,
	controlRepo repositories.ComplianceControlRepositoryInterface,
	assessmentRepo repositories.ComplianceAssessmentRepositoryInterface,
	auditRepo repositories.AuditLogRepositoryInterface,
	txManager repositories.TransactionManager,
) *ComplianceService {
	return &ComplianceService{
		frameworkRepo:  frameworkRepo,
		controlRepo:    controlRepo,
		assessmentRepo: assessmentRepo,
		auditRepo:      auditRepo,
		txManager:      txManager,
	}
}

// Framework Management

// CreateFramework creates a new compliance framework configuration
func (s *ComplianceService) CreateFramework(ctx context.Context, framework *models.ComplianceFrameworkConfig, userID string) error {
	// Validate framework
	if err := s.validateFramework(framework); err != nil {
		return fmt.Errorf("invalid framework: %w", err)
	}

	// Set timestamps
	now := time.Now()
	framework.CreatedAt = now
	framework.UpdatedAt = now

	// Create framework
	if err := s.frameworkRepo.Create(ctx, framework); err != nil {
		return fmt.Errorf("failed to create framework: %w", err)
	}

	// Log audit event
	s.logAuditEvent(ctx, framework.OrganizationID, userID, "compliance_framework_created",
		fmt.Sprintf("Created compliance framework: %s", framework.Name), framework.ID)

	return nil
}

// GetFramework retrieves a compliance framework by ID
func (s *ComplianceService) GetFramework(ctx context.Context, organizationID, frameworkID string) (*models.ComplianceFrameworkConfig, error) {
	framework, err := s.frameworkRepo.GetByID(ctx, organizationID, frameworkID)
	if err != nil {
		return nil, fmt.Errorf("failed to get framework: %w", err)
	}
	return framework, nil
}

// ListFrameworks retrieves all compliance frameworks for an organization
func (s *ComplianceService) ListFrameworks(ctx context.Context, organizationID string, limit, offset int) ([]*models.ComplianceFrameworkConfig, int, error) {
	frameworks, total, err := s.frameworkRepo.List(ctx, organizationID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list frameworks: %w", err)
	}
	return frameworks, total, nil
}

// UpdateFramework updates an existing compliance framework
func (s *ComplianceService) UpdateFramework(ctx context.Context, framework *models.ComplianceFrameworkConfig, userID string) error {
	// Validate framework
	if err := s.validateFramework(framework); err != nil {
		return fmt.Errorf("invalid framework: %w", err)
	}

	// Update timestamp
	framework.UpdatedAt = time.Now()

	// Update framework
	if err := s.frameworkRepo.Update(ctx, framework); err != nil {
		return fmt.Errorf("failed to update framework: %w", err)
	}

	// Log audit event
	s.logAuditEvent(ctx, framework.OrganizationID, userID, "compliance_framework_updated",
		fmt.Sprintf("Updated compliance framework: %s", framework.Name), framework.ID)

	return nil
}

// DeleteFramework deletes a compliance framework
func (s *ComplianceService) DeleteFramework(ctx context.Context, organizationID, frameworkID, userID string) error {
	// Get framework for audit logging
	framework, err := s.frameworkRepo.GetByID(ctx, organizationID, frameworkID)
	if err != nil {
		return fmt.Errorf("failed to get framework: %w", err)
	}

	// Delete framework
	if err := s.frameworkRepo.Delete(ctx, organizationID, frameworkID); err != nil {
		return fmt.Errorf("failed to delete framework: %w", err)
	}

	// Log audit event
	s.logAuditEvent(ctx, organizationID, userID, "compliance_framework_deleted",
		fmt.Sprintf("Deleted compliance framework: %s", framework.Name), frameworkID)

	return nil
}

// Control Management

// CreateControl creates a new compliance control
func (s *ComplianceService) CreateControl(ctx context.Context, control *models.ComplianceControl, userID string) error {
	// Validate control
	if err := s.validateControl(control); err != nil {
		return fmt.Errorf("invalid control: %w", err)
	}

	// Set timestamps
	now := time.Now()
	control.CreatedAt = now
	control.UpdatedAt = now

	// Create control
	if err := s.controlRepo.Create(ctx, control); err != nil {
		return fmt.Errorf("failed to create control: %w", err)
	}

	// Log audit event
	s.logAuditEvent(ctx, "", userID, "compliance_control_created",
		fmt.Sprintf("Created compliance control: %s", control.Title), control.ID)

	return nil
}

// GetControl retrieves a compliance control by ID
func (s *ComplianceService) GetControl(ctx context.Context, controlID string) (*models.ComplianceControl, error) {
	control, err := s.controlRepo.GetByID(ctx, controlID)
	if err != nil {
		return nil, fmt.Errorf("failed to get control: %w", err)
	}
	return control, nil
}

// ListControlsByFramework retrieves all controls for a framework
func (s *ComplianceService) ListControlsByFramework(ctx context.Context, frameworkID string, limit, offset int) ([]*models.ComplianceControl, int, error) {
	controls, total, err := s.controlRepo.ListByFramework(ctx, frameworkID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list controls: %w", err)
	}
	return controls, total, nil
}

// UpdateControl updates an existing compliance control
func (s *ComplianceService) UpdateControl(ctx context.Context, control *models.ComplianceControl, userID string) error {
	// Validate control
	if err := s.validateControl(control); err != nil {
		return fmt.Errorf("invalid control: %w", err)
	}

	// Update timestamp
	control.UpdatedAt = time.Now()

	// Update control
	if err := s.controlRepo.Update(ctx, control); err != nil {
		return fmt.Errorf("failed to update control: %w", err)
	}

	// Log audit event
	s.logAuditEvent(ctx, "", userID, "compliance_control_updated",
		fmt.Sprintf("Updated compliance control: %s", control.Title), control.ID)

	return nil
}

// GetControlStatistics retrieves control statistics for a framework
func (s *ComplianceService) GetControlStatistics(ctx context.Context, frameworkID string) (*models.ComplianceStatistics, error) {
	statusCounts, err := s.controlRepo.GetCountsByStatus(ctx, frameworkID)
	if err != nil {
		return nil, fmt.Errorf("failed to get status counts: %w", err)
	}

	severityCounts, err := s.controlRepo.GetCountsBySeverity(ctx, frameworkID)
	if err != nil {
		return nil, fmt.Errorf("failed to get severity counts: %w", err)
	}

	// Calculate totals
	totalControls := 0
	for _, count := range statusCounts {
		totalControls += count
	}

	compliantControls := statusCounts[models.ComplianceControlStatusCompliant]
	compliancePercentage := 0.0
	if totalControls > 0 {
		compliancePercentage = float64(compliantControls) / float64(totalControls) * 100
	}

	return &models.ComplianceStatistics{
		TotalControls:        totalControls,
		CompliantControls:    compliantControls,
		NonCompliantControls: statusCounts[models.ComplianceControlStatusNonCompliant],
		PendingControls:      statusCounts[models.ComplianceControlStatusPending],
		CompliancePercentage: compliancePercentage,
		StatusBreakdown:      statusCounts,
		SeverityBreakdown:    severityCounts,
	}, nil
}

// Assessment Management

// CreateAssessment creates a new compliance assessment
func (s *ComplianceService) CreateAssessment(ctx context.Context, assessment *models.ComplianceAssessment, userID string) error {
	// Validate assessment
	if err := s.validateAssessment(assessment); err != nil {
		return fmt.Errorf("invalid assessment: %w", err)
	}

	// Set timestamps
	now := time.Now()
	assessment.CreatedAt = now
	assessment.UpdatedAt = now

	// Create assessment
	if err := s.assessmentRepo.Create(ctx, assessment); err != nil {
		return fmt.Errorf("failed to create assessment: %w", err)
	}

	// Log audit event
	s.logAuditEvent(ctx, assessment.OrganizationID, userID, "compliance_assessment_created",
		fmt.Sprintf("Created compliance assessment: %s", assessment.Name), assessment.ID)

	return nil
}

// GetAssessment retrieves a compliance assessment by ID
func (s *ComplianceService) GetAssessment(ctx context.Context, organizationID, assessmentID string) (*models.ComplianceAssessment, error) {
	assessment, err := s.assessmentRepo.GetByID(ctx, organizationID, assessmentID)
	if err != nil {
		return nil, fmt.Errorf("failed to get assessment: %w", err)
	}
	return assessment, nil
}

// ListAssessments retrieves all compliance assessments for an organization
func (s *ComplianceService) ListAssessments(ctx context.Context, organizationID string, limit, offset int) ([]*models.ComplianceAssessment, int, error) {
	assessments, total, err := s.assessmentRepo.List(ctx, organizationID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list assessments: %w", err)
	}
	return assessments, total, nil
}

// UpdateAssessment updates an existing compliance assessment
func (s *ComplianceService) UpdateAssessment(ctx context.Context, assessment *models.ComplianceAssessment, userID string) error {
	// Validate assessment
	if err := s.validateAssessment(assessment); err != nil {
		return fmt.Errorf("invalid assessment: %w", err)
	}

	// Update timestamp
	assessment.UpdatedAt = time.Now()

	// Update assessment
	if err := s.assessmentRepo.Update(ctx, assessment); err != nil {
		return fmt.Errorf("failed to update assessment: %w", err)
	}

	// Log audit event
	s.logAuditEvent(ctx, assessment.OrganizationID, userID, "compliance_assessment_updated",
		fmt.Sprintf("Updated compliance assessment: %s", assessment.Name), assessment.ID)

	return nil
}

// RunAssessment executes a compliance assessment
func (s *ComplianceService) RunAssessment(ctx context.Context, organizationID, assessmentID, userID string) error {
	// Get assessment
	assessment, err := s.assessmentRepo.GetByID(ctx, organizationID, assessmentID)
	if err != nil {
		return fmt.Errorf("failed to get assessment: %w", err)
	}

	// Update status to running
	assessment.Status = models.ComplianceAssessmentStatusRunning
	assessment.StartedAt = &time.Time{}
	*assessment.StartedAt = time.Now()
	assessment.UpdatedAt = time.Now()

	if err := s.assessmentRepo.Update(ctx, assessment); err != nil {
		return fmt.Errorf("failed to update assessment status: %w", err)
	}

	// Log audit event
	s.logAuditEvent(ctx, organizationID, userID, "compliance_assessment_started",
		fmt.Sprintf("Started compliance assessment: %s", assessment.Name), assessmentID)

	// TODO: Implement actual assessment logic here
	// This would involve checking controls, running tests, etc.

	return nil
}

// Validation methods

func (s *ComplianceService) validateFramework(framework *models.ComplianceFrameworkConfig) error {
	if framework.Name == "" {
		return fmt.Errorf("framework name is required")
	}
	if framework.OrganizationID == "" {
		return fmt.Errorf("organization ID is required")
	}
	if framework.Type == "" {
		return fmt.Errorf("framework type is required")
	}
	return nil
}

func (s *ComplianceService) validateControl(control *models.ComplianceControl) error {
	if control.Title == "" {
		return fmt.Errorf("control title is required")
	}
	if control.FrameworkID == "" {
		return fmt.Errorf("framework ID is required")
	}
	if control.ControlID == "" {
		return fmt.Errorf("control ID is required")
	}
	return nil
}

func (s *ComplianceService) validateAssessment(assessment *models.ComplianceAssessment) error {
	if assessment.Name == "" {
		return fmt.Errorf("assessment name is required")
	}
	if assessment.OrganizationID == "" {
		return fmt.Errorf("organization ID is required")
	}
	if assessment.FrameworkID == "" {
		return fmt.Errorf("framework ID is required")
	}
	return nil
}

// Helper methods

func (s *ComplianceService) logAuditEvent(ctx context.Context, orgID, userID, action, details, resourceID string) {
	resourceType := "compliance"
	detailsMap := map[string]interface{}{
		"message": details,
	}

	auditLog := &models.AuditLog{
		OrganizationID: orgID,
		UserID:         &userID,
		Action:         action,
		ResourceType:   &resourceType,
		ResourceID:     &resourceID,
		Details:        detailsMap,
		IPAddress:      nil, // TODO: Extract from context
		UserAgent:      nil, // TODO: Extract from context
		CreatedAt:      time.Now(),
	}

	// Log asynchronously to avoid blocking the main operation
	go func() {
		if err := s.auditRepo.Create(context.Background(), auditLog); err != nil {
			// Log error but don't fail the main operation
			fmt.Printf("Failed to create audit log: %v\n", err)
		}
	}()
}
