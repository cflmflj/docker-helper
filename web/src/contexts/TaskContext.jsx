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

  // 获取任务列表
  const fetchTasks = async () => {
    try {
      const response = await getTasks();
      if (response.data.success) {
        const taskList = response.data.data || [];
        
        // 分类任务
        const current = taskList.find(task => task.status === 'running') || null;
        const queue = taskList.filter(task => task.status === 'queued')
                             .sort((a, b) => new Date(a.queue_time) - new Date(b.queue_time));
        const recent = taskList.filter(task => ['success', 'failed'].includes(task.status))
                              .sort((a, b) => new Date(b.end_time || b.created_at) - new Date(a.end_time || a.created_at))
                              .slice(0, 10);
        
        setTasks(prev => ({
          ...prev,
          current,
          queue,
          recent
        }));
      }
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
        message.success('任务已添加到队列');
        await fetchTasks();
        await fetchTaskStats();
        return response.data.data;
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || '创建任务失败';
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
    if (tasks.current || tasks.queue.length > 0) {
      startPolling();
    } else {
      stopPolling();
    }
  }, [tasks.current, tasks.queue.length]);

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