import React, { memo, useCallback } from 'react';
import type { Task } from '@/types/task';
import InfoItem from './InfoItem';

interface TaskDetailProps {
  task: Task;
  expandedMeasurementPoints: Set<string>;
  setExpandedMeasurementPoints: (expanded: Set<string>) => void;
  showCheckbox?: boolean;
  selectedTasks?: Set<string>;
  toggleTaskSelection?: (task: Task) => void;
  getTaskKey?: (task: Task) => string;
}

const TaskDetail: React.FC<TaskDetailProps> = memo(({
  task,
  expandedMeasurementPoints,
  setExpandedMeasurementPoints,
  showCheckbox = false,
  selectedTasks,
  toggleTaskSelection,
  getTaskKey
}) => {
  const taskKey = `${task.worksheet}-${task.taskNumber}-${task.columnIndex}`;
  const isExpanded = expandedMeasurementPoints.has(taskKey);
  const isSelected = selectedTasks && getTaskKey ? selectedTasks.has(getTaskKey(task)) : false;

  // 优化展开/收起逻辑
  const handleToggleExpand = useCallback(() => {
    const newExpanded = new Set(expandedMeasurementPoints);
    if (newExpanded.has(taskKey)) {
      newExpanded.delete(taskKey);
    } else {
      newExpanded.add(taskKey);
    }
    setExpandedMeasurementPoints(newExpanded);
  }, [expandedMeasurementPoints, taskKey, setExpandedMeasurementPoints]);

  // 优化选择逻辑
  const handleToggleSelection = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (toggleTaskSelection) {
      toggleTaskSelection(task);
    }
  }, [toggleTaskSelection, task]);

  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
      <div className="card-body">
        <div className="flex items-start justify-between mb-4 pb-3 border-b border-base-300">
          <div className="flex items-center gap-3">
            {showCheckbox && selectedTasks && toggleTaskSelection && getTaskKey && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleToggleSelection}
                onClick={handleCheckboxClick}
                className="checkbox checkbox-primary"
              />
            )}
            <div className="badge badge-primary badge-lg font-bold">
              #{task.taskNumber}
            </div>
            <div>
              <h2 className="text-lg font-bold">{task.taskName}</h2>
              <p className="text-sm text-base-content/70">{task.taskType}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="badge badge-secondary mb-1">
              {task.worksheet}
            </div>
            <div className="text-xs text-base-content/50">
              列 {task.columnIndex}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          <InfoItem
            label="数据结构方式"
            value={task.dataStructureType}
            originalValue={task.dataStructureTypeOriginal}
            highlight
          />
          <InfoItem
            label="采样基准时间"
            value={task.samplingBaseTime}
            originalValue={task.samplingBaseTimeOriginal}
            highlight
          />
          <InfoItem
            label="定时采样周期"
            value={task.samplingPeriod}
            originalValue={task.samplingPeriodOriginal}
            highlight
          />
          <InfoItem
            label="采样周期单位"
            value={task.samplingPeriodUnit}
            originalValue={task.samplingPeriodUnitOriginal}
            highlight
          />
          <InfoItem
            label="上报基准时间"
            value={task.reportBaseTime}
            originalValue={task.reportBaseTimeOriginal}
            highlight
          />
          <InfoItem
            label="定时上报周期"
            value={task.reportPeriod}
            originalValue={task.reportPeriodOriginal}
            highlight
          />
          <InfoItem
            label="上报周期单位"
            value={task.reportPeriodUnit}
            originalValue={task.reportPeriodUnitOriginal}
            highlight
          />
          <InfoItem
            label="数据抽取倍率"
            value={task.extractionRatio}
            originalValue={task.extractionRatioOriginal}
            highlight
          />
          <InfoItem 
            label="执行次数" 
            value={task.executionCount} 
            highlight
          />
        </div>

        <div className="mt-4 pt-4 border-t border-base-300">
          <div className="alert alert-warning mb-3">
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold text-sm">
                测量点号 (共{task.measurementPointsCount}个):
              </span>
              <button
                onClick={handleToggleExpand}
                className="btn btn-xs btn-ghost"
              >
                {isExpanded ? '收起详情' : '展开详情'}
              </button>
            </div>

            {/* 显示原始测量点范围 */}
            <div className="mt-2">
              <div className="text-xs mb-1">原始范围:</div>
              <div className="flex flex-wrap gap-1">
                {task.measurementPoints.split(', ').map((range, idx) => (
                  <div key={idx} className="badge badge-warning badge-sm font-mono">
                    {range}
                  </div>
                ))}
              </div>
            </div>

            {/* 展开显示解析后的测量点详情 */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-warning/30">
                <div className="text-xs mb-2">解析结果 (展开的测量点):</div>
                <div className="bg-base-100 border rounded p-2 max-h-32 overflow-y-auto">
                  <div className="flex flex-wrap gap-1">
                    {task.parsedMeasurementPoints.slice(0, 100).map((point, idx) => (
                      <div key={idx} className="badge badge-info badge-xs font-mono">
                        {point}
                      </div>
                    ))}
                    {task.parsedMeasurementPoints.length > 100 && (
                      <div className="badge badge-ghost badge-xs">
                        ...还有{task.parsedMeasurementPoints.length - 100}个
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-base-content/50 mt-1">
                  总计: {task.measurementPointsCount} 个测量点
                </div>
              </div>
            )}
          </div>
          
          <div className="alert alert-info mb-3">
            <div>
              <span className="font-semibold text-sm">
                数据项 ({task.dataItems ? Object.keys(task.dataItems).length : 0}个):
              </span>

              {/* 显示原始数据项信息 */}
              {task.dataItemsOriginal && (
                <div className="mt-2 mb-3">
                  <div className="text-xs mb-1">原始数据:</div>
                  <div className="bg-base-200 rounded p-2 text-sm break-all">
                    {task.dataItemsOriginal}
                  </div>
                </div>
              )}

              {/* 显示提取后的结构化数据项 */}
              {task.dataItems && Object.keys(task.dataItems).length > 0 ? (
                <div className="mt-2">
                  <div className="text-xs mb-2">提取结果:</div>
                  <div className="space-y-1">
                    {Object.entries(task.dataItems).map(([hexId, name]) => (
                      <div key={hexId} className="flex items-center gap-2">
                        <div className="badge badge-info badge-sm font-mono">
                          {hexId}
                        </div>
                        <span className="text-sm">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : task.dataItemsOriginal ? (
                <div className="mt-2">
                  <div className="text-xs alert alert-warning">
                    未能从原始数据中提取到结构化的数据项信息
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <div className="text-xs text-base-content/50">无数据项信息</div>
                </div>
              )}
            </div>
          </div>
          
          <div className="alert alert-success">
            <div>
              <span className="font-semibold text-sm">任务参数 (16进制): </span>
              <div className="mt-2">
                <div className="bg-base-100 rounded p-2 font-mono text-sm break-all">
                  {task.taskParam || '未生成'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，只在关键属性变化时重新渲染
  return (
    prevProps.task === nextProps.task &&
    prevProps.expandedMeasurementPoints === nextProps.expandedMeasurementPoints &&
    prevProps.selectedTasks === nextProps.selectedTasks &&
    prevProps.showCheckbox === nextProps.showCheckbox
  );
});

TaskDetail.displayName = 'TaskDetail';

export default TaskDetail;