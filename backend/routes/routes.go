package routes

import (
	"github.com/gin-gonic/gin"

	"job-tracker/backend/handlers"
)

func RegisterRoutes(router *gin.Engine, applicationHandler *handlers.ApplicationHandler) {
	api := router.Group("/api")
	{
		applications := api.Group("/applications")
		{
			applications.POST("", applicationHandler.CreateApplication)
			applications.GET("", applicationHandler.GetApplications)
			applications.PUT("/:id", applicationHandler.UpdateApplication)
			applications.DELETE("/:id", applicationHandler.DeleteApplication)
		}
	}
}
