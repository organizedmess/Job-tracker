package handlers

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"job-tracker/backend/models"
)

type ApplicationHandler struct {
	DB *gorm.DB
}

type CreateApplicationInput struct {
	Company       string `json:"company"`
	Role          string `json:"role"`
	Status        string `json:"status"`
	AppliedDate   string `json:"applied_date"`
	Notes         string `json:"notes"`
	SalaryRange   string `json:"salary_range"`
	JobURL        string `json:"job_url"`
	InterviewDate string `json:"interview_date"`
	Priority      string `json:"priority"`
}

type UpdateApplicationInput struct {
	Company       string `json:"company"`
	Role          string `json:"role"`
	Status        string `json:"status"`
	Notes         string `json:"notes"`
	SalaryRange   string `json:"salary_range"`
	JobURL        string `json:"job_url"`
	InterviewDate string `json:"interview_date"`
	Priority      string `json:"priority"`
}

type StatsResponse struct {
	TotalApplied  int64   `json:"total_applied"`
	InInterview   int64   `json:"in_interview"`
	Offers        int64   `json:"offers"`
	Rejections    int64   `json:"rejections"`
	RejectionRate float64 `json:"rejection_rate"`
}

func NewApplicationHandler(db *gorm.DB) *ApplicationHandler {
	return &ApplicationHandler{DB: db}
}

func getUserID(c *gin.Context) uint {
	id, _ := c.Get("user_id")
	return id.(uint)
}

func normalizeStatus(status string) string {
	if status == "" {
		return "applied"
	}
	return strings.ToLower(status)
}

func parseOptionalRFC3339(value string) (*time.Time, error) {
	if value == "" {
		return nil, nil
	}
	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return nil, err
	}
	return &parsed, nil
}

func validateApplicationInput(company, role, jobURL string, interviewDate *time.Time) []string {
	errors := make([]string, 0)

	if strings.TrimSpace(company) == "" {
		errors = append(errors, "company is required")
	}
	if strings.TrimSpace(role) == "" {
		errors = append(errors, "role is required")
	}
	if strings.TrimSpace(jobURL) != "" {
		parsed, err := url.ParseRequestURI(jobURL)
		if err != nil || parsed.Scheme == "" || parsed.Host == "" {
			errors = append(errors, "invalid URL format")
		}
	}
	if interviewDate != nil {
		today := time.Now()
		today = time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())
		candidate := time.Date(interviewDate.Year(), interviewDate.Month(), interviewDate.Day(), 0, 0, 0, 0, interviewDate.Location())
		if candidate.Before(today) {
			errors = append(errors, "interview_date cannot be in the past")
		}
	}

	return errors
}

func (h *ApplicationHandler) createStatusHistory(applicationID uint, status string) {
	_ = h.DB.Create(&models.StatusHistory{
		ApplicationID: applicationID,
		Status:        status,
		ChangedAt:     time.Now(),
	}).Error
}

func (h *ApplicationHandler) CreateApplication(c *gin.Context) {
	userID := getUserID(c)

	var input CreateApplicationInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"errors": []string{"invalid request payload"}})
		return
	}

	status := normalizeStatus(input.Status)

	priority := input.Priority
	if priority == "" {
		priority = "medium"
	}

	appliedDate := time.Now()
	if input.AppliedDate != "" {
		parsed, err := time.Parse(time.RFC3339, input.AppliedDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"errors": []string{"applied_date must be RFC3339 format"}})
			return
		}
		appliedDate = parsed
	}

	interviewDate, err := parseOptionalRFC3339(input.InterviewDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"errors": []string{"interview_date must be RFC3339 format"}})
		return
	}

	validationErrors := validateApplicationInput(input.Company, input.Role, input.JobURL, interviewDate)
	if len(validationErrors) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"errors": validationErrors})
		return
	}

	application := models.Application{
		UserID:        userID,
		Company:       input.Company,
		Role:          input.Role,
		Status:        status,
		AppliedDate:   appliedDate,
		Notes:         input.Notes,
		SalaryRange:   input.SalaryRange,
		JobURL:        input.JobURL,
		InterviewDate: interviewDate,
		Priority:      priority,
	}

	if err := h.DB.Create(&application).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create application"})
		return
	}

	h.createStatusHistory(application.ID, application.Status)

	c.JSON(http.StatusCreated, application)
}

func (h *ApplicationHandler) GetApplications(c *gin.Context) {
	userID := getUserID(c)

	var applications []models.Application
	query := h.DB.Where("user_id = ?", userID)

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	if search := strings.TrimSpace(c.Query("search")); search != "" {
		like := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(company) LIKE ? OR LOWER(role) LIKE ?", like, like)
	}

	order := c.Query("order")
	if order != "asc" {
		order = "desc"
	}

	switch c.Query("sort_by") {
	case "company":
		query = query.Order("company " + order)
	default:
		query = query.Order("applied_date " + order)
	}

	if err := query.Find(&applications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch applications"})
		return
	}

	c.JSON(http.StatusOK, applications)
}

func (h *ApplicationHandler) UpdateApplication(c *gin.Context) {
	userID := getUserID(c)

	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var current models.Application
	if err := h.DB.Where("id = ? AND user_id = ?", uint(id), userID).First(&current).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch application"})
		return
	}

	var input UpdateApplicationInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"errors": []string{"invalid request payload"}})
		return
	}

	nextCompany := current.Company
	nextRole := current.Role
	nextJobURL := current.JobURL
	nextStatus := current.Status
	nextPriority := current.Priority
	nextSalaryRange := current.SalaryRange
	nextNotes := current.Notes
	nextInterviewDate := current.InterviewDate

	if input.Company != "" {
		nextCompany = input.Company
	}
	if input.Role != "" {
		nextRole = input.Role
	}
	if input.JobURL != "" {
		nextJobURL = input.JobURL
	}
	if input.Status != "" {
		nextStatus = normalizeStatus(input.Status)
	}
	if input.Priority != "" {
		nextPriority = input.Priority
	}
	if input.SalaryRange != "" {
		nextSalaryRange = input.SalaryRange
	}
	if input.Notes != "" {
		nextNotes = input.Notes
	}

	if input.InterviewDate != "" {
		parsed, err := parseOptionalRFC3339(input.InterviewDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"errors": []string{"interview_date must be RFC3339 format"}})
			return
		}
		nextInterviewDate = parsed
	}

	validationErrors := validateApplicationInput(nextCompany, nextRole, nextJobURL, nextInterviewDate)
	if len(validationErrors) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"errors": validationErrors})
		return
	}

	updates := map[string]interface{}{
		"company":        nextCompany,
		"role":           nextRole,
		"status":         nextStatus,
		"notes":          nextNotes,
		"salary_range":   nextSalaryRange,
		"job_url":        nextJobURL,
		"priority":       nextPriority,
		"interview_date": nextInterviewDate,
	}

	result := h.DB.Model(&models.Application{}).
		Where("id = ? AND user_id = ?", uint(id), userID).
		Updates(updates)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update application"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
		return
	}

	if nextStatus != current.Status {
		h.createStatusHistory(uint(id), nextStatus)
	}

	var updated models.Application
	if err := h.DB.First(&updated, uint(id)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch updated application"})
		return
	}

	c.JSON(http.StatusOK, updated)
}

func (h *ApplicationHandler) DeleteApplication(c *gin.Context) {
	userID := getUserID(c)

	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	result := h.DB.Where("id = ? AND user_id = ?", uint(id), userID).Delete(&models.Application{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete application"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "application deleted"})
}

func (h *ApplicationHandler) GetApplicationHistory(c *gin.Context) {
	userID := getUserID(c)
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var app models.Application
	if err := h.DB.Where("id = ? AND user_id = ?", uint(id), userID).First(&app).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch application"})
		return
	}

	var history []models.StatusHistory
	if err := h.DB.Where("application_id = ?", app.ID).Order("changed_at asc").Find(&history).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch status history"})
		return
	}

	c.JSON(http.StatusOK, history)
}

func (h *ApplicationHandler) ExportApplicationsCSV(c *gin.Context) {
	userID := getUserID(c)
	var applications []models.Application

	if err := h.DB.Where("user_id = ?", userID).Order("applied_date desc").Find(&applications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch applications"})
		return
	}

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", "attachment; filename=applications.csv")

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	_ = writer.Write([]string{"Company", "Role", "Status", "Applied Date", "Priority", "Salary Range", "Job URL"})
	for _, app := range applications {
		_ = writer.Write([]string{
			app.Company,
			app.Role,
			app.Status,
			app.AppliedDate.Format(time.RFC3339),
			app.Priority,
			app.SalaryRange,
			app.JobURL,
		})
	}

	if err := writer.Error(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to write csv: %v", err)})
		return
	}
}

func (h *ApplicationHandler) GetStats(c *gin.Context) {
	userID := getUserID(c)

	var total, inInterview, offers, rejections int64
	h.DB.Model(&models.Application{}).Where("user_id = ?", userID).Count(&total)
	h.DB.Model(&models.Application{}).Where("user_id = ? AND status = ?", userID, "interview").Count(&inInterview)
	h.DB.Model(&models.Application{}).Where("user_id = ? AND status = ?", userID, "offer").Count(&offers)
	h.DB.Model(&models.Application{}).Where("user_id = ? AND status = ?", userID, "rejected").Count(&rejections)

	var rejectionRate float64
	if total > 0 {
		rejectionRate = float64(rejections) / float64(total) * 100
	}

	c.JSON(http.StatusOK, StatsResponse{
		TotalApplied:  total,
		InInterview:   inInterview,
		Offers:        offers,
		Rejections:    rejections,
		RejectionRate: rejectionRate,
	})
}
