package models

import "time"

type Application struct {
	ID            uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID        uint       `gorm:"not null;index" json:"user_id"`
	Company       string     `gorm:"type:varchar(255);not null" json:"company"`
	Role          string     `gorm:"type:varchar(255);not null" json:"role"`
	Status        string     `gorm:"type:varchar(50);not null" json:"status"`
	AppliedDate   time.Time  `gorm:"not null" json:"applied_date"`
	Notes         string     `gorm:"type:text" json:"notes"`
	SalaryRange   string     `gorm:"type:varchar(100)" json:"salary_range"`
	JobURL        string     `gorm:"type:text" json:"job_url"`
	InterviewDate *time.Time `json:"interview_date"`
	Priority      string     `gorm:"type:varchar(20)" json:"priority"`
	CreatedAt     time.Time  `gorm:"autoCreateTime" json:"created_at"`
}
