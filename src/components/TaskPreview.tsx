import React, { useEffect, useRef, useCallback } from 'react';
import { X, FileText, Database, Clock, Settings } from 'lucide-react';
import type { Task } from '@/types/task';
import InfoItem from './InfoItem';

interface TaskPreviewProps {
  task: Task | null;
  onClose: () => void;
  expandedMeasurementPoints: Set<string>;
  setExpandedMeasurementPoints: (expanded: Set<string>) => void;
}

const TaskPreview: React.FC<TaskPreviewProps> = ({
  task,
  onClose,
  expandedMeasurementPoints,
  setExpandedMeasurementPoints
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // 使用useCallback优化性能
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (task) {
      console.log('Opening dialog for task:', task);
      // 使用requestAnimationFrame确保流畅显示
      requestAnimationFrame(() => {
        dialog.showModal();
      });
    } else {
      dialog.close();
    }

    // 处理ESC键和点击外部关闭
    const handleDialogClose = () => handleClose();
    const handleDialogCancel = (e: Event) => {
      e.preventDefault();
      handleClose();
    };

    dialog.addEventListener('close', handleDialogClose);
    dialog.addEventListener('cancel', handleDialogCancel);

    return () => {
      dialog.removeEventListener('close', handleDialogClose);
      dialog.removeEventListener('cancel', handleDialogCancel);
    };
  }, [task, handleClose]);

  // 如果没有task，返回隐藏的dialog
  if (!task) {
    return <dialog ref={dialogRef} className="hidden" />;
  }

  const taskKey = `${task.worksheet}-${task.taskNumber}-${task.columnIndex}`;
  const isExpanded = expandedMeasurementPoints.has(taskKey);

  const handleToggleExpand = useCallback(() => {
    const newExpanded = new Set(expandedMeasurementPoints);
    if (newExpanded.has(taskKey)) {
      newExpanded.delete(taskKey);
    } else {
      newExpanded.add(taskKey);
    }
    setExpandedMeasurementPoints(newExpanded);
  }, [expandedMeasurementPoints, taskKey, setExpandedMeasurementPoints]);

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-open"
      onClick={(e) => {
        // 点击dialog背景关闭
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="modal-box max-w-5xl w-full max-h-[95vh] p-0 overflow-hidden">
        {/* 头部 - 任务基本信息 */}
        <div className="bg-base-200 border-b border-base-300 p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-20 h-20 flex items-center justify-center">
                  <span className="text-3xl font-bold">#{task.taskNumber}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-secondary badge-sm">{task.worksheet}</span>
                  <span className="badge badge-accent badge-sm">列{task.columnIndex}</span>
                  <span className="badge badge-info badge-sm">{task.measurementPointsCount}个测量点</span>
                </div>
                <h1 className="text-2xl font-bold mb-1 text-base-content">{task.taskName}</h1>
                <p className="text-base-content/70">{task.taskType}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="btn btn-sm btn-circle btn-ghost hover:bg-base-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="overflow-y-auto max-h-[calc(95vh-140px)] p-6 space-y-6">
          
          {/* 配置参数区域 */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-primary" />
                <h2 className="card-title text-lg">配置参数</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            </div>
          </div>

          {/* 测量点区域 */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-warning" />
                  <h2 className="card-title text-lg">测量点号</h2>
                  <div className="badge badge-warning">{task.measurementPointsCount}个</div>
                </div>
                <button
                  onClick={handleToggleExpand}
                  className="btn btn-sm btn-outline"
                >
                  {isExpanded ? '收起详情' : '展开详情'}
                </button>
              </div>

              {/* 原始测量点范围 */}
              <div className="mb-4">
                <div className="text-sm font-medium mb-2">原始范围:</div>
                <div className="flex flex-wrap gap-2">
                  {task.measurementPoints.split(', ').map((range, idx) => (
                    <div key={idx} className="badge badge-warning font-mono">
                      {range}
                    </div>
                  ))}
                </div>
              </div>

              {/* 展开显示解析后的测量点详情 */}
              {isExpanded && (
                <div className="border-t border-base-300 pt-4">
                  <div className="text-sm font-medium mb-2">解析结果 (展开的测量点):</div>
                  <div className="bg-base-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <div className="flex flex-wrap gap-1">
                      {task.parsedMeasurementPoints.slice(0, 200).map((point, idx) => (
                        <div key={idx} className="badge badge-info badge-sm font-mono">
                          {point}
                        </div>
                      ))}
                      {task.parsedMeasurementPoints.length > 200 && (
                        <div className="badge badge-ghost">
                          ...还有{task.parsedMeasurementPoints.length - 200}个
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-base-content/60 mt-2">
                    总计: {task.measurementPointsCount} 个测量点
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 数据项区域 */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-info" />
                <h2 className="card-title text-lg">数据项</h2>
                <div className="badge badge-info">
                  {task.dataItems ? Object.keys(task.dataItems).length : 0}个
                </div>
              </div>

              {/* 原始数据项信息 */}
              {task.dataItemsOriginal && (
                <div className="mb-4">
                  <div className="text-sm font-medium mb-2">原始数据:</div>
                  <div className="bg-base-200 rounded-lg p-3 text-sm break-all font-mono">
                    {task.dataItemsOriginal}
                  </div>
                </div>
              )}

              {/* 结构化数据项 */}
              {task.dataItems && Object.keys(task.dataItems).length > 0 ? (
                <div>
                  <div className="text-sm font-medium mb-2">提取结果:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.entries(task.dataItems).map(([hexId, name]) => (
                      <div key={hexId} className="flex items-center gap-2 p-2 bg-base-200 rounded">
                        <div className="badge badge-info font-mono">
                          {hexId}
                        </div>
                        <span className="text-sm flex-1">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : task.dataItemsOriginal ? (
                <div className="alert alert-warning">
                  <span className="text-sm">未能从原始数据中提取到结构化的数据项信息</span>
                </div>
              ) : (
                <div className="text-sm text-base-content/60">无数据项信息</div>
              )}
            </div>
          </div>

          {/* 任务参数区域 */}
          <div className="card bg-base-100 shadow-sm border border-base-300">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-success" />
                <h2 className="card-title text-lg">任务参数</h2>
                <div className="badge badge-success">16进制</div>
              </div>
              <div className="bg-base-200 rounded-lg p-4">
                <div className="font-mono text-sm break-all leading-relaxed">
                  {task.taskParam || '未生成'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 模态框背景 */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
};

export default TaskPreview;