import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { message } from 'antd';
import api, { 
  getTasks, 
  getTaskStats, 
  createTask as apiCreateTask, 
  createTransformTask,
  getTaskStatus, 
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
  const pollIntervalRef = useRef(null);
  const activeTasksRef = useRef(new Set()); // 追踪活跃任务的ID

  // 获取任务列表（当前+队列+最近）
  const fetchTasks = async () => {
    try {
      // 并行获取任务列表和历史记录
      const [tasksResponse, historyResponse] = await Promise.all([
        getTasks(),
        api.get('/history?limit=5') // 获取最近5条历史记录
      ]);

      let current = null;
      let queue = [];
      
      if (tasksResponse.data.success) {
        const taskData = tasksResponse.data.data || {};
        current = taskData.current || null;
        queue = taskData.queue || [];
      }

      let recent = [];
      if (historyResponse.data.success) {
        recent = historyResponse.data.data || [];
      }

      setTasks(prev => ({
        ...prev,
        current,
        queue,
        recent
      }));

      // 更新活跃任务集合
      const newActiveTasks = new Set();
      if (current) {
        newActiveTasks.add(current.id);
      }
      queue.forEach(task => {
        newActiveTasks.add(task.id);
      });
      activeTasksRef.current = newActiveTasks;
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  // 获取任务统计
  const fetchTaskStats = async () => {
    try {
      const response = await api.get('/history/stats');
      if (response.data.success) {
        const statsData = response.data.data || {};
        setTasks(prev => ({
          ...prev,
          stats: {
            total: statsData.total || 0,
            running: 0, // 历史统计中没有running状态
            queued: 0,  // 历史统计中没有queued状态
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

  // 获取单个任务状态
  const fetchTaskStatus = async (taskId) => {
    if (!taskId) return;
    
    try {
      const response = await getTaskStatus(taskId);
      if (response.data.success) {
        const taskData = response.data.data;
        
        // 更新当前任务状态
        setTasks(prev => ({
          ...prev,
          current: prev.current?.id === taskId ? taskData : prev.current
        }));

        return taskData;
      }
    } catch (error) {
      console.error('Failed to fetch task status:', error);
    }
  };

  // 创建异步任务
  const createTask = async (taskData) => {
    setLoading(true);
    try {
      // 使用新的异步任务接口或兼容接口
      const response = await createTransformTask(taskData);
      if (response.data.success) {
        const result = response.data.data;
        
        // 检查是否返回了任务ID（异步模式）
        if (result.message && result.message.includes('任务ID:')) {
          // 异步模式：立即返回任务ID
          const taskId = result.message.split('任务ID: ')[1];
          message.success('任务已创建，正在后台执行...');
          
          // 立即刷新任务列表
          await fetchTasks();
          await fetchTaskStats();
          
          // 开始轮询该任务的状态
          startTaskPolling(taskId);
          
          return { taskId, target_image: result.target_image };
        } else {
          // 同步模式（兼容旧行为）
          message.success('镜像转换成功！');
          setTimeout(async () => {
            await fetchTasks();
            await fetchTaskStats();
          }, 1000);
          return result;
        }
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

  // 智能轮询间隔计算
  const getPollingInterval = (hasActiveTasks) => {
    if (!hasActiveTasks) {
      return 30000; // 无活跃任务时，30秒轮询一次历史记录
    }
    return 2000; // 有活跃任务时，2秒轮询一次
  };

  // 开始智能轮询
  const startPolling = () => {
    if (pollIntervalRef.current) return;
    
    const poll = async () => {
      await fetchTasks();
      await fetchTaskStats();
      
      // 检查是否有活跃任务
      const hasActiveTasks = activeTasksRef.current.size > 0;
      const interval = getPollingInterval(hasActiveTasks);
      
      // 设置下一次轮询
      pollIntervalRef.current = setTimeout(poll, interval);
    };
    
    // 立即开始第一次轮询
    poll();
  };

  // 停止轮询
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearTimeout(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // 开始特定任务的轮询
  const startTaskPolling = (taskId) => {
    const pollTask = async () => {
      const taskData = await fetchTaskStatus(taskId);
      
      // 检查任务是否完成
      if (taskData && ['completed', 'failed', 'cancelled'].includes(taskData.status)) {
        message.success(
          taskData.status === 'completed' 
            ? `任务执行成功！耗时 ${taskData.duration} 秒` 
            : `任务已${taskData.status === 'failed' ? '失败' : '取消'}`
        );
        
        // 任务完成后刷新列表
        await fetchTasks();
        await fetchTaskStats();
        return; // 停止轮询
      }
      
      // 继续轮询
      setTimeout(pollTask, 2000);
    };
    
    // 延迟1秒开始轮询，给后端时间处理
    setTimeout(pollTask, 1000);
  };

  // 初始化数据和轮询
  useEffect(() => {
    fetchTasks();
    fetchTaskStats();
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const value = {
    tasks,
    loading,
    createTask,
    cancelTask,
    changePriority,
    fetchTasks,
    fetchTaskStats,
    fetchTaskStatus,
    startTaskPolling
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

export default TaskContext; 