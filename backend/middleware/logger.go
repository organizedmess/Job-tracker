package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path

		c.Next()

		latencyMs := time.Since(start).Milliseconds()

		userID, _ := c.Get("user_id")

		log.Info().
			Str("method", c.Request.Method).
			Str("path", path).
			Int("status", c.Writer.Status()).
			Int64("latency_ms", latencyMs).
			Str("ip", c.ClientIP()).
			Interface("user_id", userID).
			Msg("request")
	}
}
