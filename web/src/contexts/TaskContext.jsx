import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';
import api, { 
  getTasks, 
  getTaskStats, 
  createTask as apiCreateTask, 
  getTaskProgress, 
  cancelTask as apiCancelTask, 
  changePriority as apiChangePriority 
} from '../services/api';

const TaskContext = createContext();

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState({
    current: null,           // 当前执行任务
    queue: [],              // 等待队列
    recent: [],             // 最近完成
    stats: {                // 统计信息
      total: 0,
      running: 0,
      queued: 0,
      success: 0,
      failed: 0,
      avgDuration: 0
    }
  });

  const [loading, setLoading] = useState(false);
  const [pollInterval, setPollInterval] = useState(null);

  // 获取任务列表和最近历史
  const fetchTasks = async () => {
    try {
      // 由于后端暂未实现任务队列管理，我们先从历史记录中获取最近的数据
      const [tasksResponse, historyResponse] = await Promise.all([
        getTasks(), // 这个暂时返回空数组，用于未来的任务队列功能
        api.get('/history') // 获取实际的历史记录
      ]);
      
      // 处理任务队列（暂时为空，待后端实现）
      let current = null;
      let queue = [];
      
      if (tasksResponse.data.success) {
        const taskList = tasksResponse.data.data || [];
        current = taskList.find(task => task.status === 'running') || null;
        queue = taskList.filter(task => task.status === 'queued')
                        .sort((a, b) => new Date(a.queue_time) - new Date(b.queue_time));
      }
      
      // 处理最近历史记录
      let recent = [];
      if (historyResponse.data.success) {
        const historyList = historyResponse.data.data || [];
        recent = historyList
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .slice(0, 5); // 只取最近5条
      }
      
      setTasks(prev => ({
        ...prev,
        current,
        queue,
        recent
      }));
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  // 获取任务统计
  const fetchTaskStats = async () => {
    try {
      const response = await getTaskStats();
      if (response.data.success) {
        const statsData = response.data.data || {};
        setTasks(prev => ({
          ...prev,
          stats: {
            total: statsData.total || 0,
            running: statsData.running || 0,
            queued: statsData.queued || 0,
            success: statsData.success_count || 0,
            failed: statsData.failed_count || 0,
            avgDuration: Math.round(statsData.avg_duration || 0)
          }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch task stats:', error);
    }
  };

  // 获取任务进度
  const fetchTaskProgress = async (taskId) => {
    if (!taskId) return;
    
    try {
      const response = await getTaskProgress(taskId);
      if (response.data.success) {
        const progress = response.data.data;
        setTasks(prev => ({
          ...prev,
          current: prev.current ? {
            ...prev.current,
            progress
          } : null
        }));
      }
    } catch (error) {
      console.error('Failed to fetch task progress:', error);
    }
  };

  // 创建任务
  const createTask = async (taskData) => {
    setLoading(true);
    try {
      const response = await apiCreateTask(taskData);
      if (response.data.success) {
        message.success('镜像转换成功！');
        // 延迟一下再刷新，确保后端已经记录了历史
        setTimeout(async () => {
          await fetchTasks();
          await fetchTaskStats();
        }, 1000);
        return response.data.data;
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || '镜像转换失败';
      message.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 取消任务
  const cancelTask = async (taskId) => {
    try {
      const response = await apiCancelTask(taskId);
      if (response.data.success) {
        message.success('任务已取消');
        await fetchTasks();
        await fetchTaskStats();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || '取消任务失败';
      message.error(errorMsg);
    }
  };

  // 调整任务优先级
  const changePriority = async (taskId, direction) => {
    try {
      const response = await apiChangePriority(taskId, direction);
      if (response.data.success) {
        message.success('优先级已调整');
        await fetchTasks();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || '调整优先级失败';
      message.error(errorMsg);
    }
  };

  // 开始轮询
  const startPolling = () => {
    if (pollInterval) return;
    
    const interval = setInterval(async () => {
      await fetchTasks();
      await fetchTaskStats();
      
      // 如果有当前任务，获取其进度
      if (tasks.current) {
        await fetchTaskProgress(tasks.current.id);
      }
    }, 2000);
    
    setPollInterval(interval);
  };

  // 停止轮询
  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchTasks();
    fetchTaskStats();
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, []);

  // 监听当前任务变化，控制轮询
  useEffect(() => {
    // 由于当前没有真正的任务队列，我们简化轮询逻辑
    // 只在有活动任务时进行轮询，或者定期更新历史记录
    if (tasks.current) {
      startPolling();
    } else {
      // 如果没有活动任务，设置较长间隔的轮询来更新历史记录
      const longInterval = setInterval(async () => {
        await fetchTasks();
        await fetchTaskStats();
      }, 30000); // 30秒更新一次历史记录
      
      return () => clearInterval(longInterval);
    }
  }, [tasks.current]);

  const value = {
    tasks,
    loading,
    createTask,
    cancelTask,
    changePriority,
    fetchTasks,
    fetchTaskStats,
    fetchTaskProgress
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

export default TaskContext; 