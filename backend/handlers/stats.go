package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"

	"job-tracker/backend/models"
)

type StatsResponse struct {
	TotalApplied  int64   `json:"total_applied"`
	InInterview   int64   `json:"in_interview"`
	Offers        int64   `json:"offers"`
	Rejections    int64   `json:"rejections"`
	RejectionRate float64 `json:"rejection_rate"`
}

func (h *ApplicationHandler) GetStats(c *gin.Context) {
	userID := getUserID(c)
	cacheKey := fmt.Sprintf("stats:%d", userID)

	if h.Redis != nil {
		cached, err := h.Redis.Get(context.Background(), cacheKey).Bytes()
		if err == nil {
			var stats StatsResponse
			if jsonErr := json.Unmarshal(cached, &stats); jsonErr == nil {
				c.JSON(http.StatusOK, stats)
				return
			}
		}
		log.Warn().Str("cache_key", cacheKey).Msg("cache miss, querying db")
	}

	var total, inInterview, offers, rejections int64

	if err := h.DB.Model(&models.Application{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		log.Error().Err(err).Msg("db query failed")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch stats"})
		return
	}
	h.DB.Model(&models.Application{}).Where("user_id = ? AND status = ?", userID, "interview").Count(&inInterview)
	h.DB.Model(&models.Application{}).Where("user_id = ? AND status = ?", userID, "offer").Count(&offers)
	h.DB.Model(&models.Application{}).Where("user_id = ? AND status = ?", userID, "rejected").Count(&rejections)

	var rejectionRate float64
	if total > 0 {
		rejectionRate = float64(rejections) / float64(total) * 100
	}

	stats := StatsResponse{
		TotalApplied:  total,
		InInterview:   inInterview,
		Offers:        offers,
		Rejections:    rejections,
		RejectionRate: rejectionRate,
	}

	if h.Redis != nil {
		data, err := json.Marshal(stats)
		if err == nil {
			_ = h.Redis.Set(context.Background(), cacheKey, data, 5*time.Minute).Err()
		}
	}

	c.JSON(http.StatusOK, stats)
}
