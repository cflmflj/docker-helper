import React from 'react';
import { Alert, Progress, Typography, Button, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, CopyOutlined } from '@ant-design/icons';
import { message } from 'antd';

const { Text, Paragraph } = Typography;

const ProxyStatus = ({ status }) => {
  const { status: currentStatus, message: statusMessage, progress, result } = status;

  // 复制镜像地址到剪贴板
  const copyImageAddress = (imageAddress) => {
    navigator.clipboard.writeText(imageAddress).then(() => {
      message.success('镜像地址已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败，请手动复制');
    });
  };

  // 渲染不同状态的内容
  const renderStatusContent = () => {
    switch (currentStatus) {
      case 'idle':
        return (
          <Alert
            message="等待开始"
            description="请填写镜像信息后点击开始代理按钮"
            type="info"
            showIcon
          />
        );

      case 'running':
        return (
          <div>
            <Alert
              message="正在执行代理"
              description={
                <div>
                  <div style={{ marginBottom: 8 }}>{statusMessage}</div>
                  {progress && (
                    <Progress 
                      percent={0} 
                      status="active"
                      showInfo={false}
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                    />
                  )}
                </div>
              }
              type="info"
              icon={<LoadingOutlined spin />}
              showIcon
            />
          </div>
        );

      case 'success':
        return (
          <div>
            <Alert
              message="代理成功"
              description={
                <div>
                  <div style={{ marginBottom: 12 }}>{statusMessage}</div>
                  {result && (
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>目标镜像:</Text>
                      </div>
                      <div style={{ 
                        background: '#f6ffed', 
                        border: '1px solid #b7eb8f',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        marginBottom: '12px'
                      }}>
                        <Text code style={{ color: '#52c41a', wordBreak: 'break-all' }}>
                          {result.target_image}
                        </Text>
                      </div>
                      <Space>
                        <Button
                          type="primary"
                          size="small"
                          icon={<CopyOutlined />}
                          onClick={() => copyImageAddress(result.target_image)}
                        >
                          复制镜像地址
                        </Button>
                        {result.duration && (
                          <Text type="secondary">
                            耗时: {result.duration}秒
                          </Text>
                        )}
                      </Space>
                    </div>
                  )}
                </div>
              }
              type="success"
              icon={<CheckCircleOutlined />}
              showIcon
            />
          </div>
        );

      case 'error':
        return (
          <Alert
            message="代理失败"
            description={
              <div>
                <div style={{ marginBottom: 8 }}>
                  <Text type="danger">{statusMessage}</Text>
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  请检查网络连接、镜像名称和仓库认证信息
                </Text>
              </div>
            }
            type="error"
            icon={<CloseCircleOutlined />}
            showIcon
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="proxy-status">
      {renderStatusContent()}
    </div>
  );
};

export default ProxyStatus; 