package routes

import (
	"github.com/gin-gonic/gin"

	"job-tracker/backend/handlers"
	"job-tracker/backend/middleware"
)

func RegisterRoutes(router *gin.Engine, applicationHandler *handlers.ApplicationHandler, authHandler *handlers.AuthHandler) {
	api := router.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			applications := protected.Group("/applications")
			{
				applications.POST("", applicationHandler.CreateApplication)
				applications.GET("", applicationHandler.GetApplications)
				applications.GET("/export", applicationHandler.ExportApplicationsCSV)
				applications.GET("/:id/history", applicationHandler.GetApplicationHistory)
				applications.PUT("/:id", applicationHandler.UpdateApplication)
				applications.DELETE("/:id", applicationHandler.DeleteApplication)
			}
			protected.GET("/stats", applicationHandler.GetStats)
		}
	}
}
