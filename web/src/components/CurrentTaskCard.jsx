import React from 'react';
import { Card, Space, Button, Typography, Tag, Popconfirm } from 'antd';
import { 
  ThunderboltOutlined, 
  PauseOutlined, 
  StopOutlined, 
  InfoCircleOutlined 
} from '@ant-design/icons';
import TaskProgressBar from './TaskProgressBar';

const { Text, Title } = Typography;

const CurrentTaskCard = ({ task, onCancel, onPause, onViewDetails }) => {
  if (!task) return null;

  // 格式化持续时间
  const formatDuration = (startTime) => {
    if (!startTime) return '';
    const now = new Date();
    const start = new Date(startTime);
    const durationMs = now - start;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
  };

  // 预估剩余时间
  const estimateRemainingTime = (progress) => {
    if (!progress || !task.start_time) return '';
    const { progress: progressValue = 0 } = progress;
    if (progressValue <= 0) return '';
    
    const elapsed = new Date() - new Date(task.start_time);
    const estimatedTotal = (elapsed / progressValue) * 100;
    const remaining = estimatedTotal - elapsed;
    
    if (remaining <= 0) return '即将完成';
    
    const remainingMinutes = Math.floor(remaining / 60000);
    if (remainingMinutes < 1) return '不到1分钟';
    return `约${remainingMinutes}分钟`;
  };

  return (
    <Card 
      title={
        <Space>
          <ThunderboltOutlined style={{ color: '#1890ff' }} />
          <span>当前执行任务</span>
          <Tag color="processing">执行中</Tag>
        </Space>
      }
      className="function-card current-task-card"
      size="small"
      extra={
        <Space>
          <Button
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => onViewDetails && onViewDetails(task)}
          >
            详情
          </Button>
          <Button
            size="small"
            icon={<PauseOutlined />}
            onClick={() => onPause && onPause(task.id)}
            disabled={true} // 暂时禁用暂停功能
          >
            暂停
          </Button>
          <Popconfirm
            title="确定要取消当前任务吗？"
            onConfirm={() => onCancel && onCancel(task.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              size="small"
              danger
              icon={<StopOutlined />}
            >
              取消
            </Button>
          </Popconfirm>
        </Space>
      }
    >
      <div className="current-task-content">
        {/* 任务基本信息 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <Title level={5} style={{ margin: 0 }}>
              {task.source_image}
            </Title>
          </div>
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              → {task.target_image}
            </Text>
          </div>
          <div>
            <Space split=" | ">
              {task.start_time && (
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  已执行: {formatDuration(task.start_time)}
                </Text>
              )}
              {task.progress && (
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  预计剩余: {estimateRemainingTime(task.progress)}
                </Text>
              )}
            </Space>
          </div>
        </div>

        {/* 进度条 */}
        <TaskProgressBar progress={task.progress} />
      </div>
    </Card>
  );
};

export default CurrentTaskCard; 