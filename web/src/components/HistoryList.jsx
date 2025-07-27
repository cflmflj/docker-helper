import React, { useState, useEffect } from 'react';
import { List, Typography, Tag, Button, Space, Empty, Spin, message, Popconfirm } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Text } = Typography;

const HistoryList = ({ refreshTrigger }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 });

  // 获取历史记录
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const [historyResponse, statsResponse] = await Promise.all([
        api.get('/history'),
        api.get('/history/stats')
      ]);
      
      if (historyResponse.data.success) {
        setHistory(historyResponse.data.data || []);
      }
      
      if (statsResponse.data.success) {
        const statsData = statsResponse.data.data || {};
        setStats({ 
          total: statsData.total || 0, 
          success: statsData.success_count || 0, 
          failed: statsData.failed_count || 0 
        });
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
      message.error('获取历史记录失败');
    } finally {
      setLoading(false);
    }
  };

  // 清空历史记录
  const clearHistory = async () => {
    try {
      const response = await api.delete('/history');
      if (response.data.success) {
        setHistory([]);
        setStats({ total: 0, success: 0, failed: 0 });
        message.success('历史记录已清空');
      }
    } catch (error) {
      message.error('清空历史记录失败');
    }
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 格式化持续时间
  const formatDuration = (duration) => {
    if (!duration) return '';
    if (duration < 60) {
      return `${duration}秒`;
    }
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}分${seconds}秒`;
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger]);

  return (
    <div className="history-list">
      {/* 统计信息 */}
      <div style={{ marginBottom: 16, padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
        <Space>
          <Text strong>总计: {stats.total}</Text>
          <Text type="success">成功: {stats.success}</Text>
          <Text type="danger">失败: {stats.failed}</Text>
        </Space>
      </div>

      {/* 操作按钮 */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchHistory}
            loading={loading}
            size="small"
          >
            刷新
          </Button>
          {history.length > 0 && (
            <Popconfirm
              title="确定要清空所有历史记录吗？"
              onConfirm={clearHistory}
              okText="确定"
              cancelText="取消"
            >
              <Button
                icon={<DeleteOutlined />}
                danger
                size="small"
              >
                清空
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      {/* 历史记录列表 */}
      <Spin spinning={loading}>
        {history.length === 0 ? (
          <Empty
            description="暂无转换记录"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={history}
            renderItem={(item) => (
              <List.Item className="history-item">
                <div style={{ width: '100%' }}>
                  {/* 源镜像 */}
                  <div style={{ marginBottom: 4 }}>
                    <Text strong style={{ fontSize: '14px' }}>
                      {item.source_image}
                    </Text>
                  </div>
                  
                  {/* 箭头和目标镜像 */}
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      → {item.target_image}
                    </Text>
                  </div>
                  
                  {/* 状态和时间 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <Tag
                        icon={item.status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                        color={item.status === 'success' ? 'success' : 'error'}
                      >
                        {item.status === 'success' ? '成功' : '失败'}
                      </Tag>
                      {item.duration && (
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {formatDuration(item.duration)}
                        </Text>
                      )}
                    </Space>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {formatTime(item.created_at)}
                    </Text>
                  </div>
                  
                  {/* 错误信息 */}
                  {item.status === 'failed' && item.error_msg && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="danger" style={{ fontSize: '11px' }}>
                        错误: {item.error_msg}
                      </Text>
                    </div>
                  )}
                </div>
              </List.Item>
            )}
          />
        )}
      </Spin>
    </div>
  );
};

export default HistoryList; 