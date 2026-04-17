package main

import (
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
	zlog "github.com/rs/zerolog/log"

	"job-tracker/backend/config"
	"job-tracker/backend/handlers"
	"job-tracker/backend/models"
	"job-tracker/backend/routes"
	"job-tracker/backend/services"
)

func main() {
	zerolog.TimeFieldFormat = time.RFC3339
	zlog.Logger = zerolog.New(os.Stdout).With().Timestamp().Logger()

	db, err := config.ConnectDB()
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	if err := db.AutoMigrate(&models.User{}, &models.Application{}); err != nil {
		log.Fatalf("failed to auto-migrate models: %v", err)
	}

	if err := db.AutoMigrate(&models.StatusHistory{}); err != nil {
		log.Fatalf("failed to auto-migrate status history model: %v", err)
	}

	emailSvc := services.NewEmailService(db)
	emailSvc.StartReminderScheduler()

	redisClient := config.ConnectRedis()

	allowedOrigins := []string{"http://localhost:4200", "https://job-tracker-olive-mu.vercel.app"}
	if extraOrigin := os.Getenv("ALLOWED_ORIGIN"); extraOrigin != "" {
		allowedOrigins = append(allowedOrigins, extraOrigin)
	}

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	applicationHandler := handlers.NewApplicationHandler(db, redisClient)
	authHandler := handlers.NewAuthHandler(db)
	routes.RegisterRoutes(router, applicationHandler, authHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if err := router.Run(":" + port); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
