import React from 'react';
import { Card, List, Space, Button, Typography, Tag, Empty } from 'antd';
import { 
  HistoryOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const RecentHistoryCard = ({ recent, onViewAll }) => {
  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}小时前`;
    
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 格式化持续时间
  const formatDuration = (duration) => {
    if (!duration) return '';
    if (duration < 60) return `${duration}秒`;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}分${seconds}秒`;
  };

  return (
    <Card 
      title={
        <Space>
          <HistoryOutlined style={{ color: '#52c41a' }} />
          <span>最近记录</span>
        </Space>
      }
      className="function-card recent-history-card"
      size="small"
      extra={
        <Button 
          size="small" 
          type="link" 
          icon={<UnorderedListOutlined />}
          onClick={() => onViewAll && onViewAll()}
        >
          查看全部
        </Button>
      }
    >
      {!recent || recent.length === 0 ? (
        <Empty
          description="暂无转换记录"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: '20px 0' }}
        >
          <div style={{ fontSize: '12px', color: '#999', marginTop: 8 }}>
            完成镜像转换后，记录将在这里显示
          </div>
        </Empty>
      ) : (
        <List
          size="small"
          dataSource={recent.slice(0, 5)} // 只显示最近5条
          renderItem={(item) => (
            <List.Item className="recent-history-item">
              <div style={{ width: '100%' }}>
                {/* 状态和源镜像 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ flex: 1 }}>
                    <Space>
                      <Tag
                        icon={item.status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                        color={item.status === 'success' ? 'success' : 'error'}
                        size="small"
                      >
                        {item.status === 'success' ? '成功' : '失败'}
                      </Tag>
                      <Text strong style={{ fontSize: '13px' }}>
                        {item.source_image}
                      </Text>
                    </Space>
                  </div>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {formatTime(item.created_at)}
                  </Text>
                </div>

                {/* 目标镜像 */}
                <div style={{ marginBottom: 4 }}>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    → {item.target_image}
                  </Text>
                </div>

                {/* 耗时信息 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {item.duration && (
                    <Text type="secondary" style={{ fontSize: '10px' }}>
                      耗时: {formatDuration(item.duration)}
                    </Text>
                  )}
                  {item.status === 'failed' && item.error_msg && (
                    <Text type="danger" style={{ fontSize: '10px' }} ellipsis={{ tooltip: item.error_msg }}>
                      {item.error_msg.length > 20 ? item.error_msg.substring(0, 20) + '...' : item.error_msg}
                    </Text>
                  )}
                </div>
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default RecentHistoryCard; 