import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Task } from '@/types/task';

// 轻量级任务卡片组件
const TaskCard = React.memo(({
  task,
  isSelected,
  onToggleSelection,
  onPreview,
  style
}: {
  task: Task;
  isSelected: boolean;
  onToggleSelection: () => void;
  onPreview: () => void;
  style?: React.CSSProperties;
}) => (
  <div 
    className="card bg-base-100 shadow hover:shadow-md transition-shadow cursor-pointer" 
    onClick={onPreview}
    style={style}
  >
    <div className="card-body p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelection}
            onClick={(e) => e.stopPropagation()}
            className="checkbox checkbox-primary checkbox-sm"
          />
          <div className="badge badge-primary badge-sm">#{task.taskNumber}</div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate">{task.taskName}</h3>
            <p className="text-xs text-base-content/60 truncate">{task.taskType}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="badge badge-secondary badge-xs">{task.worksheet}</div>
          <div className="text-xs text-base-content/50 mt-1">
            {task.measurementPointsCount}个测量点
          </div>
        </div>
      </div>
    </div>
  </div>
));

interface VirtualTaskListProps {
  tasks: Task[];
  selectedTasks: Set<string>;
  getTaskKey: (task: Task) => string;
  onToggleSelection: (task: Task) => void;
  onPreview: (task: Task) => void;
  height?: number;
  itemHeight?: number;
}

const VirtualTaskList: React.FC<VirtualTaskListProps> = ({
  tasks,
  selectedTasks,
  getTaskKey,
  onToggleSelection,
  onPreview,
  height,
  itemHeight = 130
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(height || 600);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 根据容器宽度动态计算列数
  const columns = useMemo(() => {
    if (containerWidth < 768) return 1; // 移动端单列
    return 2; // 桌面端双列
  }, [containerWidth]);

  // 计算虚拟滚动参数
  const itemsPerRow = columns;
  const totalRows = Math.ceil(tasks.length / itemsPerRow);
  const visibleRows = Math.ceil(containerHeight / itemHeight) + 2; // 多渲染2行作为缓冲
  const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
  const endRow = Math.min(totalRows, startRow + visibleRows);

  // 计算可见的任务项
  const visibleTasks = useMemo(() => {
    const items = [];
    for (let row = startRow; row < endRow; row++) {
      for (let col = 0; col < itemsPerRow; col++) {
        const index = row * itemsPerRow + col;
        if (index < tasks.length) {
          const task = tasks[index];
          items.push({
            task,
            index,
            row,
            col,
            top: row * itemHeight,
            left: (col / itemsPerRow) * 100,
            width: 100 / itemsPerRow - (itemsPerRow > 1 ? 1 : 0) // 多列时减去间距
          });
        }
      }
    }
    return items;
  }, [tasks, startRow, endRow, itemsPerRow, itemHeight]);

  // 处理滚动事件 - 使用节流优化性能
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
  }, []);

  // 监听容器尺寸变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height: observedHeight } = entry.contentRect;
        setContainerWidth(width);
        if (!height) { // 如果没有指定固定高度，则使用观察到的高度
          setContainerHeight(observedHeight);
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [height]);

  // 总内容高度
  const totalHeight = totalRows * itemHeight;

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto"
      style={{ height: height ? `${height}px` : '100%' }}
      onScroll={handleScroll}
    >
      {tasks.length === 0 ? (
        // 空状态
        <div className="flex items-center justify-center h-full min-h-[200px]">
          <div className="text-center">
            <p className="text-base-content/70">没有找到任务</p>
            <p className="text-xs text-base-content/50 mt-1">请尝试调整搜索条件</p>
          </div>
        </div>
      ) : (
        // 虚拟内容容器 - 用于撑开滚动条
        <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
          {/* 渲染可见的任务卡片 */}
          {visibleTasks.map(({ task, index, top, left, width }) => (
            <div
              key={`${getTaskKey(task)}-${index}`}
              style={{
                position: 'absolute',
                top: `${top}px`,
                left: `${left}%`,
                width: `${width}%`,
                height: `${itemHeight - 8}px`, // 减去margin
                padding: itemsPerRow > 1 ? '0 4px' : '0' // 多列时添加水平间距
              }}
            >
              <TaskCard
                task={task}
                isSelected={selectedTasks.has(getTaskKey(task))}
                onToggleSelection={() => onToggleSelection(task)}
                onPreview={() => onPreview(task)}
                style={{ height: '100%' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VirtualTaskList;