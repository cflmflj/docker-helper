import React from 'react';
import { Card, List, Space, Button, Typography, Tag, Popconfirm, Empty } from 'antd';
import { 
  ClockCircleOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const TaskQueueCard = ({ queue, onPriorityChange, onRemove, onEdit }) => {
  if (!queue || queue.length === 0) return null;

  // 格式化队列位置
  const formatQueuePosition = (index) => {
    return `#${index + 1}`;
  };

  // 预估开始时间
  const estimateStartTime = (position, currentTaskRemaining = 120) => {
    if (position === 0) return '即将开始';
    const estimatedMinutes = currentTaskRemaining + (position * 3); // 假设每个任务平均3分钟
    if (estimatedMinutes < 60) return `约${estimatedMinutes}分钟后`;
    const hours = Math.floor(estimatedMinutes / 60);
    const minutes = estimatedMinutes % 60;
    return `约${hours}小时${minutes}分钟后`;
  };

  return (
    <Card 
      title={
        <Space>
          <ClockCircleOutlined style={{ color: '#faad14' }} />
          <span>等待队列</span>
          <Tag color="warning">{queue.length}个任务</Tag>
        </Space>
      }
      className="function-card queue-card"
      size="small"
      extra={
        queue.length > 1 && (
          <Button size="small" type="link">
            批量管理
          </Button>
        )
      }
    >
      {queue.length === 0 ? (
        <Empty
          description="队列为空"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          dataSource={queue}
          renderItem={(task, index) => (
            <List.Item className="queue-item">
              <div style={{ width: '100%' }}>
                {/* 队列位置和基本信息 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <Space>
                      <Tag color="default">{formatQueuePosition(index)}</Tag>
                      <Text strong style={{ fontSize: '14px' }}>
                        {task.source_image}
                      </Text>
                    </Space>
                  </div>
                  <Space>
                    {index > 0 && (
                      <Button
                        size="small"
                        type="text"
                        icon={<ArrowUpOutlined />}
                        onClick={() => onPriorityChange && onPriorityChange(task.id, 'up')}
                        title="提高优先级"
                      />
                    )}
                    {index < queue.length - 1 && (
                      <Button
                        size="small"
                        type="text"
                        icon={<ArrowDownOutlined />}
                        onClick={() => onPriorityChange && onPriorityChange(task.id, 'down')}
                        title="降低优先级"
                      />
                    )}
                    <Button
                      size="small"
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => onEdit && onEdit(task)}
                      title="编辑任务"
                    />
                    <Popconfirm
                      title="确定要删除这个任务吗？"
                      onConfirm={() => onRemove && onRemove(task.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        title="删除任务"
                      />
                    </Popconfirm>
                  </Space>
                </div>

                {/* 目标镜像 */}
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    → {task.target_image}
                  </Text>
                </div>

                {/* 预估信息 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    预计开始: {estimateStartTime(index)}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {new Date(task.queue_time).toLocaleTimeString('zh-CN')}
                  </Text>
                </div>
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default TaskQueueCard; 