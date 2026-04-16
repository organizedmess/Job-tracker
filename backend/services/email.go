package services

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
	"gorm.io/gorm"

	"job-tracker/backend/models"
)

type EmailService struct {
	DB *gorm.DB
}

func NewEmailService(db *gorm.DB) *EmailService {
	return &EmailService{DB: db}
}

func (s *EmailService) StartReminderScheduler() {
	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			s.sendInterviewReminders()
		}
	}()
}

func (s *EmailService) sendInterviewReminders() {
	tomorrow := time.Now().Add(24 * time.Hour)
	startOfTomorrow := time.Date(tomorrow.Year(), tomorrow.Month(), tomorrow.Day(), 0, 0, 0, 0, tomorrow.Location())
	endOfTomorrow := startOfTomorrow.Add(24 * time.Hour)

	var applications []models.Application
	if err := s.DB.
		Where("interview_date >= ? AND interview_date < ?", startOfTomorrow, endOfTomorrow).
		Find(&applications).Error; err != nil {
		log.Printf("[EmailService] Error querying upcoming interviews: %v", err)
		return
	}

	for _, app := range applications {
		var user models.User
		if err := s.DB.First(&user, app.UserID).Error; err != nil {
			log.Printf("[EmailService] User not found for application %d: %v", app.ID, err)
			continue
		}
		if err := s.sendReminder(app, user.Email); err != nil {
			log.Printf("[EmailService] Failed to send reminder for application %d: %v", app.ID, err)
		}
	}
}

func (s *EmailService) sendReminder(app models.Application, toEmail string) error {
	apiKey := os.Getenv("SENDGRID_API_KEY")
	fromEmail := os.Getenv("SENDGRID_FROM_EMAIL")

	if apiKey == "" || fromEmail == "" {
		log.Printf("[EmailService] SendGrid not configured, skipping reminder for application %d", app.ID)
		return nil
	}

	from := mail.NewEmail("Job Tracker", fromEmail)
	to := mail.NewEmail("", toEmail)
	subject := fmt.Sprintf("Interview Reminder: %s at %s", app.Role, app.Company)
	body := fmt.Sprintf(
		"Hi,\n\nThis is a reminder that you have an interview for the role of %s at %s scheduled for tomorrow.\n\nGood luck!\n\nJob Tracker",
		app.Role, app.Company,
	)

	message := mail.NewSingleEmail(from, subject, to, body, "")
	client := sendgrid.NewSendClient(apiKey)

	resp, err := client.Send(message)
	if err != nil {
		return err
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("sendgrid returned status %d: %s", resp.StatusCode, resp.Body)
	}

	log.Printf("[EmailService] Reminder sent to %s for %s at %s", toEmail, app.Role, app.Company)
	return nil
}
