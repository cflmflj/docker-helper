package services

import (
	"context"
	"fmt"
	"time"

	"docker-transformer/utils"
)

type ImageService struct {
	dockerService *DockerService
	logger        *utils.Logger
}

func NewImageService() (*ImageService, error) {
	dockerService, err := NewDockerService()
	if err != nil {
		return nil, err
	}

	// 创建logger实例
	logger := utils.NewLogger("info")

	return &ImageService{
		dockerService: dockerService,
		logger:        logger,
	}, nil
}

// ProxyImage 代理镜像：拉取 -> 标记 -> 推送 -> 清理
func (is *ImageService) ProxyImage(ctx context.Context, sourceImage, targetImage, username, password string) (string, int, error) {
	startTime := time.Now()
	is.logger.Infof("开始镜像代理操作: %s -> %s", sourceImage, targetImage)

	// 1. 验证源镜像名称
	is.logger.Infof("步骤1: 验证源镜像名称: %s", sourceImage)
	if err := utils.ValidateImageName(sourceImage); err != nil {
		is.logger.Errorf("源镜像名称验证失败: %v", err)
		return "", 0, fmt.Errorf("源镜像名称无效: %v", err)
	}

	// 2. 标准化源镜像名称
	normalizedSource := utils.NormalizeImageName(sourceImage)
	is.logger.Infof("步骤2: 标准化源镜像名称: %s -> %s", sourceImage, normalizedSource)

	// 3. 使用用户指定的目标镜像名称（不进行自动构建）
	is.logger.Infof("步骤3: 使用目标镜像名称: %s", targetImage)

	// 4. 拉取源镜像
	is.logger.Infof("步骤4: 开始拉取源镜像: %s", normalizedSource)
	pullStartTime := time.Now()
	if err := is.dockerService.PullImage(ctx, normalizedSource); err != nil {
		is.logger.Errorf("拉取镜像失败: %v", err)
		return "", 0, fmt.Errorf("拉取镜像失败: %v", err)
	}
	pullDuration := time.Since(pullStartTime)
	is.logger.Infof("步骤4: 拉取镜像完成，耗时: %v", pullDuration)

	// 5. 标记镜像
	is.logger.Infof("步骤5: 开始标记镜像: %s -> %s", normalizedSource, targetImage)
	tagStartTime := time.Now()
	if err := is.dockerService.TagImage(ctx, normalizedSource, targetImage); err != nil {
		is.logger.Errorf("标记镜像失败: %v", err)
		return "", 0, fmt.Errorf("标记镜像失败: %v", err)
	}
	tagDuration := time.Since(tagStartTime)
	is.logger.Infof("步骤5: 标记镜像完成，耗时: %v", tagDuration)

	// 6. 推送镜像
	is.logger.Infof("步骤6: 开始推送镜像到目标仓库: %s (用户: %s)", targetImage, username)
	pushStartTime := time.Now()
	if err := is.dockerService.PushImage(ctx, targetImage, username, password); err != nil {
		is.logger.Errorf("推送镜像失败: %v", err)
		// 清理已标记的镜像
		is.logger.Infof("清理已标记的镜像: %s", targetImage)
		is.dockerService.RemoveImage(ctx, targetImage)
		return "", 0, fmt.Errorf("推送镜像失败: %v", err)
	}
	pushDuration := time.Since(pushStartTime)
	is.logger.Infof("步骤6: 推送镜像完成，耗时: %v", pushDuration)

	// 7. 清理本地镜像（可选）
	is.logger.Infof("步骤7: 开始清理本地镜像")
	cleanupStartTime := time.Now()
	if err := is.dockerService.RemoveImage(ctx, normalizedSource); err != nil {
		is.logger.Errorf("清理源镜像失败: %v", err)
	} else {
		is.logger.Infof("已清理源镜像: %s", normalizedSource)
	}

	if err := is.dockerService.RemoveImage(ctx, targetImage); err != nil {
		is.logger.Errorf("清理目标镜像失败: %v", err)
	} else {
		is.logger.Infof("已清理目标镜像: %s", targetImage)
	}
	cleanupDuration := time.Since(cleanupStartTime)
	is.logger.Infof("步骤7: 清理完成，耗时: %v", cleanupDuration)

	duration := int(time.Since(startTime).Seconds())
	is.logger.Infof("镜像代理操作完成! 总耗时: %d秒，目标镜像: %s", duration, targetImage)
	is.logger.Infof("性能统计 - 拉取: %v, 标记: %v, 推送: %v, 清理: %v",
		pullDuration, tagDuration, pushDuration, cleanupDuration)

	return targetImage, duration, nil
}

// ParseImage 解析镜像信息
func (is *ImageService) ParseImage(image string) (map[string]string, error) {
	if err := utils.ValidateImageName(image); err != nil {
		return nil, err
	}

	registry, namespace, repository, tag := utils.ParseImageName(image)
	normalized := utils.NormalizeImageName(image)

	return map[string]string{
		"parsed_image": normalized,
		"registry":     registry,
		"namespace":    namespace,
		"repository":   repository,
		"tag":          tag,
	}, nil
}

// Close 关闭服务
func (is *ImageService) Close() error {
	if is.dockerService != nil {
		return is.dockerService.Close()
	}
	return nil
}
