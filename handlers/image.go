package handlers

import (
	"net/http"

	"docker-transformer/models"
	"docker-transformer/services"
	"docker-transformer/utils"

	"github.com/gin-gonic/gin"
)

type ImageHandler struct {
	imageService *services.ImageService
	logger       *utils.Logger
}

func NewImageHandler() (*ImageHandler, error) {
	imageService, err := services.NewImageService()
	if err != nil {
		return nil, err
	}

	logger := utils.NewLogger("info")

	return &ImageHandler{
		imageService: imageService,
		logger:       logger,
	}, nil
}

// ParseImage 解析镜像名称
func (h *ImageHandler) ParseImage(c *gin.Context) {
	var req models.ImageParseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Errorf("镜像解析请求参数无效: %v", err)
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: "请求参数无效: " + err.Error(),
		})
		return
	}

	h.logger.Infof("收到镜像解析请求: %s", req.Image)

	// 解析镜像名称
	imageInfo, err := h.imageService.ParseImage(req.Image)
	if err != nil {
		h.logger.Errorf("镜像名称解析失败: %s, 错误: %v", req.Image, err)
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: "镜像名称解析失败: " + err.Error(),
		})
		return
	}

	// 构建响应
	response := models.ImageParseResponse{
		ParsedImage: imageInfo["parsed_image"],
		Registry:    imageInfo["registry"],
		Namespace:   imageInfo["namespace"],
		Repository:  imageInfo["repository"],
		Tag:         imageInfo["tag"],
	}

	h.logger.Infof("镜像解析成功: %s -> %s", req.Image, imageInfo["parsed_image"])

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "镜像解析成功",
		Data:    response,
	})
}

// BuildTargetImage 构建目标镜像名称
func (h *ImageHandler) BuildTargetImage(c *gin.Context) {
	var req struct {
		SourceImage string `json:"source_image" binding:"required"`
		TargetHost  string `json:"target_host" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Errorf("目标镜像构建请求参数无效: %v", err)
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: "请求参数无效: " + err.Error(),
		})
		return
	}

	h.logger.Infof("收到目标镜像构建请求: %s -> %s", req.SourceImage, req.TargetHost)

	// 解析源镜像
	imageInfo, err := h.imageService.ParseImage(req.SourceImage)
	if err != nil {
		h.logger.Errorf("源镜像名称解析失败: %s, 错误: %v", req.SourceImage, err)
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: "源镜像名称解析失败: " + err.Error(),
		})
		return
	}

	// 构建目标镜像名称 (使用utils包中的函数)
	// 这里为了简化，直接在handler中构建
	registry := imageInfo["registry"]
	namespace := imageInfo["namespace"]
	repository := imageInfo["repository"]
	tag := imageInfo["tag"]

	var targetImage string
	if registry == "docker.io" && namespace == "library" {
		// nginx:latest -> harbor.com/transform/nginx:latest
		targetImage = req.TargetHost + "/transform/" + repository + ":" + tag
	} else if registry == "docker.io" {
		// user/nginx:latest -> harbor.com/transform/user/nginx:latest
		targetImage = req.TargetHost + "/transform/" + namespace + "/" + repository + ":" + tag
	} else {
		// gcr.io/google/nginx:latest -> harbor.com/transform/gcr.io/google/nginx:latest
		targetImage = req.TargetHost + "/transform/" + registry + "/" + namespace + "/" + repository + ":" + tag
	}

	h.logger.Infof("目标镜像构建成功: %s -> %s", req.SourceImage, targetImage)

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "目标镜像构建成功",
		Data: map[string]string{
			"source_image": imageInfo["parsed_image"],
			"target_image": targetImage,
		},
	})
}

// Close 关闭服务
func (h *ImageHandler) Close() error {
	if h.imageService != nil {
		return h.imageService.Close()
	}
	return nil
}
