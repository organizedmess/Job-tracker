package main

import (
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"job-tracker/backend/config"
	"job-tracker/backend/handlers"
	"job-tracker/backend/models"
	"job-tracker/backend/routes"
	"job-tracker/backend/services"
)

func main() {
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

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:4200"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	applicationHandler := handlers.NewApplicationHandler(db)
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
