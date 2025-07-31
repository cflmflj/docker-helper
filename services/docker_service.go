package services

import (
	"context"
	"docker-helper/utils"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/client"
)

type DockerService struct {
	client *client.Client
	logger *utils.Logger
}

func NewDockerService() (*DockerService, error) {
	logger := utils.NewLogger("info")

	logger.Info("正在创建Docker客户端...")
	cli, err := client.NewClientWithOpts(client.FromEnv)
	if err != nil {
		logger.Errorf("创建Docker客户端失败: %v", err)
		return nil, fmt.Errorf("failed to create docker client: %v", err)
	}

	// 验证Docker连接
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	logger.Info("验证Docker连接...")
	_, err = cli.Ping(ctx)
	if err != nil {
		logger.Errorf("连接Docker守护进程失败: %v", err)
		return nil, fmt.Errorf("failed to connect to docker daemon: %v", err)
	}
	logger.Info("Docker连接验证成功")

	return &DockerService{
		client: cli,
		logger: logger,
	}, nil
}

// PullImage 拉取镜像
func (ds *DockerService) PullImage(ctx context.Context, imageName string) error {
	ds.logger.Infof("Docker: 开始拉取镜像 %s", imageName)

	out, err := ds.client.ImagePull(ctx, imageName, types.ImagePullOptions{})
	if err != nil {
		ds.logger.Errorf("Docker: 拉取镜像 %s 失败: %v", imageName, err)
		return fmt.Errorf("failed to pull image %s: %v", imageName, err)
	}
	defer out.Close()

	// 读取输出但不显示详细信息（实际应用中可以解析JSON获取进度）
	_, err = io.Copy(io.Discard, out)
	if err != nil {
		ds.logger.Errorf("Docker: 读取拉取输出失败: %v", err)
		return fmt.Errorf("failed to read pull output: %v", err)
	}

	ds.logger.Infof("Docker: 成功拉取镜像 %s", imageName)
	return nil
}

// TagImage 给镜像打标签
func (ds *DockerService) TagImage(ctx context.Context, sourceImage, targetImage string) error {
	ds.logger.Infof("Docker: 开始标记镜像 %s -> %s", sourceImage, targetImage)

	err := ds.client.ImageTag(ctx, sourceImage, targetImage)
	if err != nil {
		ds.logger.Errorf("Docker: 标记镜像失败 %s -> %s: %v", sourceImage, targetImage, err)
		return fmt.Errorf("failed to tag image %s to %s: %v", sourceImage, targetImage, err)
	}

	ds.logger.Infof("Docker: 成功标记镜像 %s -> %s", sourceImage, targetImage)
	return nil
}

// PushImage 推送镜像
func (ds *DockerService) PushImage(ctx context.Context, imageName, username, password string) error {
	ds.logger.Infof("Docker: 开始推送镜像 %s (用户: %s)", imageName, username)

	// 构建认证信息
	authConfig := types.AuthConfig{
		Username: username,
		Password: password,
	}

	authJSON, err := json.Marshal(authConfig)
	if err != nil {
		ds.logger.Errorf("Docker: 序列化认证配置失败: %v", err)
		return fmt.Errorf("failed to marshal auth config: %v", err)
	}

	authStr := base64.URLEncoding.EncodeToString(authJSON)

	out, err := ds.client.ImagePush(ctx, imageName, types.ImagePushOptions{
		RegistryAuth: authStr,
	})
	if err != nil {
		ds.logger.Errorf("Docker: 推送镜像 %s 失败: %v", imageName, err)
		return fmt.Errorf("failed to push image %s: %v", imageName, err)
	}
	defer out.Close()

	// 读取推送输出
	_, err = io.Copy(io.Discard, out)
	if err != nil {
		ds.logger.Errorf("Docker: 读取推送输出失败: %v", err)
		return fmt.Errorf("failed to read push output: %v", err)
	}

	ds.logger.Infof("Docker: 成功推送镜像 %s", imageName)
	return nil
}

// RemoveImage 删除本地镜像
func (ds *DockerService) RemoveImage(ctx context.Context, imageName string) error {
	ds.logger.Infof("Docker: 开始删除镜像 %s", imageName)

	_, err := ds.client.ImageRemove(ctx, imageName, types.ImageRemoveOptions{
		Force:         true,
		PruneChildren: true,
	})
	if err != nil {
		ds.logger.Errorf("Docker: 删除镜像 %s 失败: %v", imageName, err)
		return fmt.Errorf("failed to remove image %s: %v", imageName, err)
	}

	ds.logger.Infof("Docker: 成功删除镜像 %s", imageName)
	return nil
}

// ImageExists 检查镜像是否存在
func (ds *DockerService) ImageExists(ctx context.Context, imageName string) (bool, error) {
	_, _, err := ds.client.ImageInspectWithRaw(ctx, imageName)
	if err != nil {
		if client.IsErrNotFound(err) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

// Close 关闭Docker客户端
func (ds *DockerService) Close() error {
	if ds.client != nil {
		return ds.client.Close()
	}
	return nil
}
