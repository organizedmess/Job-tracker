package models

import "time"

type StatusHistory struct {
	ID            uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	ApplicationID uint      `gorm:"not null;index" json:"application_id"`
	Status        string    `gorm:"type:varchar(50);not null" json:"status"`
	ChangedAt     time.Time `gorm:"not null" json:"changed_at"`
}
