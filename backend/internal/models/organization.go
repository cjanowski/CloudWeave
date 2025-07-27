package models

import "time"

type Organization struct {
	ID        string                 `json:"id" db:"id"`
	Name      string                 `json:"name" db:"name"`
	Slug      string                 `json:"slug" db:"slug"`
	Settings  map[string]interface{} `json:"settings" db:"settings"`
	CreatedAt time.Time              `json:"createdAt" db:"created_at"`
	UpdatedAt time.Time              `json:"updatedAt" db:"updated_at"`
}

type CreateOrganizationRequest struct {
	Name string `json:"name" binding:"required,min=2,max=255"`
	Slug string `json:"slug" binding:"required,min=2,max=100"`
}

type UpdateOrganizationRequest struct {
	Name     *string                `json:"name,omitempty" binding:"omitempty,min=2,max=255"`
	Settings map[string]interface{} `json:"settings,omitempty"`
}
