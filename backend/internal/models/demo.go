package models

import (
	"time"
)

// DemoScenario represents different demo data scenarios
type DemoScenario string

const (
	DemoScenarioStartup     DemoScenario = "startup"
	DemoScenarioEnterprise  DemoScenario = "enterprise"
	DemoScenarioDevOps      DemoScenario = "devops"
	DemoScenarioMultiCloud  DemoScenario = "multicloud"
)

// DemoData represents a demo data entry in the database
type DemoData struct {
	ID          string       `json:"id" db:"id"`
	UserID      string       `json:"userId" db:"user_id"`
	Scenario    DemoScenario `json:"scenario" db:"scenario"`
	DataType    string       `json:"dataType" db:"data_type"`
	Data        interface{}  `json:"data" db:"data"`
	GeneratedAt time.Time    `json:"generatedAt" db:"generated_at"`
	ExpiresAt   *time.Time   `json:"expiresAt" db:"expires_at"`
}

// DemoDataSet represents a complete set of demo data for a user
type DemoDataSet struct {
	UserID         string                    `json:"userId"`
	Scenario       DemoScenario              `json:"scenario"`
	Infrastructure []*DemoInfrastructure     `json:"infrastructure"`
	Deployments    []*DemoDeployment         `json:"deployments"`
	Metrics        []*DemoMetric             `json:"metrics"`
	Alerts         []*DemoAlert              `json:"alerts"`
	CostData       *DemoCostData             `json:"costData"`
	GeneratedAt    time.Time                 `json:"generatedAt"`
	ExpiresAt      *time.Time                `json:"expiresAt"`
}

// DemoMetadata contains metadata about demo data
type DemoMetadata struct {
	IsDemo      bool         `json:"isDemo"`
	Scenario    DemoScenario `json:"scenario"`
	Realistic   bool         `json:"realistic"`
	Tags        []string     `json:"tags"`
	Description string       `json:"description"`
}

// DemoInfrastructure represents demo infrastructure data
type DemoInfrastructure struct {
	*Infrastructure
	DemoMetadata DemoMetadata `json:"demoMetadata"`
}

// DemoDeployment represents demo deployment data
type DemoDeployment struct {
	*Deployment
	DemoMetadata DemoMetadata `json:"demoMetadata"`
}

// DemoMetric represents demo metric data
type DemoMetric struct {
	*Metric
	DemoMetadata DemoMetadata `json:"demoMetadata"`
}

// DemoAlert represents demo alert data
type DemoAlert struct {
	*Alert
	DemoMetadata DemoMetadata `json:"demoMetadata"`
}

// DemoCostData represents demo cost information
type DemoCostData struct {
	TotalCost      float64                    `json:"totalCost"`
	Currency       string                     `json:"currency"`
	Period         string                     `json:"period"`
	ByService      map[string]float64         `json:"byService"`
	ByRegion       map[string]float64         `json:"byRegion"`
	Trend          []CostDataPoint            `json:"trend"`
	Forecast       []CostDataPoint            `json:"forecast"`
	Recommendations []CostOptimizationTip     `json:"recommendations"`
	DemoMetadata   DemoMetadata               `json:"demoMetadata"`
}

// CostDataPoint represents a single cost data point
type CostDataPoint struct {
	Date   time.Time `json:"date"`
	Amount float64   `json:"amount"`
}

// CostOptimizationTip represents a cost optimization recommendation
type CostOptimizationTip struct {
	Type        string  `json:"type"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Savings     float64 `json:"savings"`
	Priority    string  `json:"priority"`
}

// InitializeDemoRequest represents a request to initialize demo data
type InitializeDemoRequest struct {
	Scenario DemoScenario `json:"scenario" binding:"required"`
}

// CompleteOnboardingRequest represents a request to complete onboarding
type CompleteOnboardingRequest struct {
	DemoMode    bool                   `json:"demoMode"`
	Preferences map[string]interface{} `json:"preferences,omitempty"`
}

// TransitionToRealRequest represents a request to transition from demo to real data
type TransitionToRealRequest struct {
	CloudProviders []string `json:"cloudProviders" binding:"required"`
	KeepSettings   bool     `json:"keepSettings"`
}