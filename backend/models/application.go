package models

import "time"

type Application struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID      uint      `gorm:"not null;index" json:"user_id"`
	Company     string    `gorm:"type:varchar(255);not null" json:"company"`
	Role        string    `gorm:"type:varchar(255);not null" json:"role"`
	Status      string    `gorm:"type:varchar(50);not null" json:"status"`
	AppliedDate time.Time `gorm:"not null" json:"applied_date"`
	Notes       string    `gorm:"type:text" json:"notes"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
}
