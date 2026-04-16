package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"job-tracker/backend/models"
)

type ApplicationHandler struct {
	DB *gorm.DB
}

type CreateApplicationInput struct {
	UserID      uint   `json:"user_id"`
	Company     string `json:"company"`
	Role        string `json:"role"`
	Status      string `json:"status"`
	AppliedDate string `json:"applied_date"`
	Notes       string `json:"notes"`
}

type UpdateApplicationInput struct {
	Status string `json:"status"`
	Notes  string `json:"notes"`
}

func NewApplicationHandler(db *gorm.DB) *ApplicationHandler {
	return &ApplicationHandler{DB: db}
}

func (h *ApplicationHandler) CreateApplication(c *gin.Context) {
	var input CreateApplicationInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request payload"})
		return
	}

	status := input.Status
	if status == "" {
		status = "applied"
	}

	appliedDate := time.Now()
	if input.AppliedDate != "" {
		parsed, err := time.Parse(time.RFC3339, input.AppliedDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "applied_date must be RFC3339 format"})
			return
		}
		appliedDate = parsed
	}

	application := models.Application{
		UserID:      input.UserID,
		Company:     input.Company,
		Role:        input.Role,
		Status:      status,
		AppliedDate: appliedDate,
		Notes:       input.Notes,
	}

	if err := h.DB.Create(&application).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create application"})
		return
	}

	c.JSON(http.StatusCreated, application)
}

func (h *ApplicationHandler) GetApplications(c *gin.Context) {
	var applications []models.Application

	if err := h.DB.Order("created_at desc").Find(&applications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch applications"})
		return
	}

	c.JSON(http.StatusOK, applications)
}

func (h *ApplicationHandler) UpdateApplication(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var input UpdateApplicationInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request payload"})
		return
	}

	updates := map[string]interface{}{
		"status": input.Status,
		"notes":  input.Notes,
	}

	result := h.DB.Model(&models.Application{}).Where("id = ?", uint(id)).Updates(updates)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update application"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "application not found"})
		return
	}

	var updated models.Application
	if err := h.DB.First(&updated, uint(id)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch updated application"})
		return
	}

	c.JSON(http.StatusOK, updated)
}

func (h *ApplicationHandler) DeleteApplication(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	result := h.DB.Delete(&models.Application{}, uint(id))
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
