import React, { useState, useMemo, useCallback, useRef, useTransition, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Upload, FileText, Download, Search, AlertCircle, CheckCircle, ArrowLeft, X } from 'lucide-react';

// 导入类型
import type { Task } from '@/types/task';

// 导入组件
import TaskPreview from '@/components/TaskPreview';
import VirtualTaskList from '@/components/VirtualTaskList';

// 导入自定义hooks
import { useTaskExtractor } from '@/hooks/useTaskExtractor';
import { useTaskSelection } from '@/hooks/useTaskSelection';

// 导入工具函数
import { parseSearchQuery, matchesSearchCriteria } from '@/utils/searchUtils';
import { exportToJSON, exportToINI, exportToTaskTemplate } from '@/utils/exportUtils';

// 防抖hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function TaskExtractPage() {
  // 使用自定义hooks
  const {
    extractedData,
    fileName,
    stats,
    loading,
    error,
    handleFileUpload
  } = useTaskExtractor();

  const {
    selectedTasks,
    getTaskKey,
    getSelectedTasks,
    toggleTaskSelection,
    toggleSelectAll
  } = useTaskSelection();

  // 本地状态
  const [searchText, setSearchText] = useState<string>('');
  const [selectedSheet, setSelectedSheet] = useState<string>('all');
  const [expandedMeasurementPoints, setExpandedMeasurementPoints] = useState<Set<string>>(new Set());
  const [previewTask, setPreviewTask] = useState<Task | null>(null);
  const [, startTransition] = useTransition();
  const [isDragOver, setIsDragOver] = useState(false);

  // 防抖搜索
  const debouncedSearchText = useDebounce(searchText, 300);

  // 使用 useMemo 优化当前任务列表计算
  const currentTasks = useMemo(() => {
    if (selectedSheet === 'all') {
      return Object.values(extractedData).flat();
    } else {
      return extractedData[selectedSheet] || [];
    }
  }, [extractedData, selectedSheet]);

  // 使用 useMemo 优化搜索解析
  const searchCriteria = useMemo(() => {
    if (!debouncedSearchText.trim()) return null;
    return parseSearchQuery(debouncedSearchText);
  }, [debouncedSearchText]);

  // 使用 useMemo 优化筛选数据
  const filteredData = useMemo(() => {
    if (!searchCriteria) return currentTasks;

    return currentTasks.filter(task =>
      matchesSearchCriteria(task, searchCriteria.filters, searchCriteria.generalTerms)
    );
  }, [currentTasks, searchCriteria]);

  // 使用 useCallback 优化事件处理函数
  const handleSheetChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    startTransition(() => {
      setSelectedSheet(e.target.value);
    });
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  }, []);

  const handlePreviewTask = useCallback((task: Task) => {
    setPreviewTask(task);
  }, []);

  // 拖拽上传处理函数
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(file =>
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.toLowerCase().endsWith('.xlsx') ||
      file.name.toLowerCase().endsWith('.xls')
    );

    if (excelFile) {
      // 创建一个更完整的模拟事件对象
      const mockEvent = {
        target: {
          files: [excelFile]
        },
        currentTarget: {
          files: [excelFile]
        },
        preventDefault: () => { },
        stopPropagation: () => { }
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      handleFileUpload(mockEvent);
    }
  }, [handleFileUpload]);

  // 优化导出函数
  const handleExportINI = useCallback(() => {
    exportToINI(extractedData);
  }, [extractedData]);

  const handleExportJSON = useCallback(() => {
    exportToJSON(extractedData);
  }, [extractedData]);

  const handleExportTemplate = useCallback(() => {
    const tasksToExport = selectedTasks.size > 0
      ? getSelectedTasks(currentTasks)
      : currentTasks;
    exportToTaskTemplate(tasksToExport);
  }, [selectedTasks, getSelectedTasks, currentTasks]);

  // 优化全选逻辑
  const selectAllButtonText = useMemo(() => {
    const filteredTaskKeys = filteredData.map(task => getTaskKey(task));
    const allFilteredSelected = filteredTaskKeys.every(key => selectedTasks.has(key));
    return allFilteredSelected && filteredTaskKeys.length > 0 ? '取消全选' : '全选';
  }, [filteredData, selectedTasks, getTaskKey]);

  const handleToggleSelectAll = useCallback(() => {
    startTransition(() => {
      toggleSelectAll(filteredData);
    });
  }, [toggleSelectAll, filteredData]);

  // 优化选中任务列表
  const selectedTasksList = useMemo(() => {
    return getSelectedTasks(currentTasks);
  }, [getSelectedTasks, currentTasks, selectedTasks]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-base-300">
        <div className="flex items-center gap-4">
          <Link to="/tools" className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">任务提取工具</h1>
              <p className="text-sm text-base-content/70">智能Excel任务定义提取工具</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Important Notice */}
          <div className="alert alert-warning mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="font-bold">重要提示</h3>
              <div className="text-sm space-y-1">
                <p>由于Excel表格可能存在格式以及排版等问题，智能识别未必能100%准确。</p>
                <p className="font-medium text-warning-content">提取之后的数据未必完全正确，需要重新核对，请在使用提取结果前仔细验证数据的正确性。</p>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="card bg-base-100 shadow-lg mb-6">
            <div className="card-body">
              <h2 className="card-title text-lg mb-4">
                <Upload className="w-5 h-5" />
                文件上传
              </h2>

              <div className="form-control">
                <label className="cursor-pointer">
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 transition-all ${isDragOver
                      ? 'border-primary bg-primary/10 scale-105'
                      : 'border-primary/30 hover:border-primary/50 hover:bg-primary/5'
                      }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Upload className={`w-12 h-12 transition-colors ${isDragOver ? 'text-primary animate-bounce' : 'text-primary'
                        }`} />
                      <div className="text-center">
                        <span className="text-lg font-medium">
                          {isDragOver
                            ? '松开鼠标上传文件'
                            : fileName || '点击上传或拖拽Excel文件到此处'
                          }
                        </span>
                        <p className="text-sm text-base-content/70 mt-1">
                          {isDragOver
                            ? '支持 .xlsx, .xls 格式文件'
                            : '支持 .xlsx, .xls 格式，自动识别Excel结构并提取任务定义'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {loading && (
                <div className="alert alert-info mt-4">
                  <div className="loading loading-spinner loading-sm"></div>
                  <span>正在智能分析Excel结构并提取数据...</span>
                </div>
              )}

              {error && (
                <div className="alert alert-error mt-4">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {stats && (
                <div className="alert alert-success mt-4">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <h3 className="font-bold">解析成功！</h3>
                    <div className="text-sm mt-2 space-y-1">
                      <p>✓ 共处理 <strong>{stats.totalSheets}</strong> 个工作表</p>
                      <p>✓ 共提取 <strong>{stats.totalTasks}</strong> 个任务定义</p>
                      <div className="mt-2 p-2 bg-base-200 rounded">
                        <p className="font-semibold mb-1">各工作表任务数:</p>
                        {Object.entries(stats.tasksBySheet).map(([sheet, count]) => (
                          <p key={sheet} className="text-xs ml-2">• {sheet}: {count} 个任务</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {Object.keys(extractedData).length > 0 && (
            <>
              {/* Controls Section */}
              <div className="card bg-base-100 shadow-lg mb-6">
                <div className="card-body">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    {/* Sheet Selector */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">选择工作表</span>
                      </label>
                      <select
                        className="select select-bordered"
                        value={selectedSheet}
                        onChange={handleSheetChange}
                      >
                        <option value="all">全部工作表</option>
                        {stats?.sheetNames.map(name => (
                          <option key={name} value={name}>
                            {name} ({stats?.tasksBySheet[name] || 0}个任务)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Advanced Search - 单独一行 */}
                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text font-medium flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        高级搜索
                      </span>
                      <span className="label-text-alt">支持GitHub风格的搜索语法</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="input input-bordered w-full pl-4 pr-4 font-mono text-sm"
                        placeholder="taskid:1 name:电压 sheet:Sheet1 count:50 ..."
                        value={searchText}
                        onChange={handleSearchChange}
                        style={{
                          background: searchText ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)' : undefined
                        }}
                      />
                      {searchText && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="badge badge-primary badge-xs">
                            {filteredData.length} 结果
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 实时搜索高亮预览 */}
                    {searchText && (
                      <div className="mt-2 p-3 bg-base-200 rounded-lg border">
                        <div className="text-xs font-medium mb-2 text-base-content/70">搜索解析:</div>
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            const criteria = parseSearchQuery(searchText);
                            const elements: React.ReactElement[] = [];

                            // 显示过滤器
                            Object.entries(criteria.filters).forEach(([key, values]) => {
                              values.forEach(value => {
                                elements.push(
                                  <span key={`${key}:${value}`} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono">
                                    <span className="font-semibold">{key}:</span>
                                    <span>{value}</span>
                                  </span>
                                );
                              });
                            });

                            // 显示通用搜索词
                            criteria.generalTerms.forEach(term => {
                              elements.push(
                                <span key={term} className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-mono">
                                  {term}
                                </span>
                              );
                            });

                            return elements.length > 0 ? elements : (
                              <span className="text-xs text-base-content/50">输入搜索条件...</span>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Search Help */}
                  <div className="collapse collapse-arrow bg-base-200">
                    <input type="checkbox" />
                    <div className="collapse-title text-sm font-medium">
                      搜索语法说明
                    </div>
                    <div className="collapse-content text-xs">
                      <div className="flex flex-wrap gap-4 mb-2">
                        <span><code className="bg-base-300 px-1 rounded">taskid:1</code> 任务号</span>
                        <span><code className="bg-base-300 px-1 rounded">name:电压</code> 任务名称</span>
                        <span><code className="bg-base-300 px-1 rounded">sheet:Sheet1</code> 工作表</span>
                        <span><code className="bg-base-300 px-1 rounded">type:定时</code> 任务类型</span>
                        <span><code className="bg-base-300 px-1 rounded">count:50</code> 测量点数</span>
                        <span><code className="bg-base-300 px-1 rounded">data:3</code> 数据项数</span>
                      </div>
                      <p>
                        <span className="text-base-content/70">支持组合搜索，如: </span>
                        <code className="bg-info/20 text-info px-1 rounded">taskid:1 sheet:Sheet1 电压</code>
                      </p>
                    </div>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={handleExportINI}
                      className="btn btn-primary btn-sm"
                    >
                      <Download className="w-4 h-4" />
                      导出INI格式
                    </button>
                    <button
                      onClick={handleExportJSON}
                      className="btn btn-success btn-sm"
                    >
                      <Download className="w-4 h-4" />
                      导出JSON格式
                    </button>
                    <button
                      onClick={handleExportTemplate}
                      className="btn btn-secondary btn-sm"
                    >
                      <Download className="w-4 h-4" />
                      导出任务模板
                    </button>
                  </div>
                </div>
              </div>

              {/* Results Section */}
              {filteredData.length > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                  {/* Task List */}
                  <div className="xl:col-span-3 space-y-4">
                    {/* Stats Bar */}
                    <div className="card bg-base-100 shadow">
                      <div className="card-body py-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm">
                            显示 <strong>{filteredData.length}</strong> 个任务定义
                            {searchText && <span className="text-warning"> (已筛选)</span>}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className="text-sm">
                              已选择 <strong>{selectedTasks.size}</strong> 个任务
                            </span>
                            <button
                              onClick={handleToggleSelectAll}
                              className="btn btn-xs btn-outline"
                            >
                              {selectAllButtonText}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 虚拟任务列表 */}
                    <div className="card bg-base-100 shadow">
                      <div className="card-body p-0">
                        <VirtualTaskList
                          tasks={filteredData}
                          selectedTasks={selectedTasks}
                          getTaskKey={getTaskKey}
                          onToggleSelection={toggleTaskSelection}
                          onPreview={handlePreviewTask}
                          height={Math.min(800, Math.max(400, filteredData.length * 65))} // 动态高度，最小400px，最大800px
                          itemHeight={130}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Selected Tasks Panel */}
                  <div className="xl:col-span-1">
                    <div className="card bg-base-100 shadow-lg sticky top-4">
                      <div className="card-body">
                        <h3 className="card-title text-lg">
                          选中的任务 ({selectedTasks.size})
                        </h3>

                        {selectedTasks.size === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-sm text-base-content/70">还没有选择任务</p>
                            <p className="text-xs text-base-content/50 mt-1">勾选左侧任务来添加到选择列表</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {selectedTasksList.map((task) => (
                              <div
                                key={getTaskKey(task)}
                                className="card card-compact bg-base-200 cursor-pointer hover:bg-base-300 transition-colors"
                                onClick={(e) => {
                                  if ((e.target as HTMLElement).closest('button')) {
                                    return;
                                  }
                                  handlePreviewTask(task);
                                }}
                              >
                                <div className="card-body p-3">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <div className="badge badge-primary badge-sm shrink-0">
                                        #{task.taskNumber}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <span className="text-sm font-medium block truncate">
                                          {task.taskName}
                                        </span>
                                        <div className="text-xs text-base-content/70 mt-1">
                                          {task.worksheet} • 列{task.columnIndex} • {task.measurementPointsCount}个测量点
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTaskSelection(task);
                                      }}
                                      className="btn btn-xs btn-circle btn-error shrink-0"
                                      title="移除任务"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Task Preview Modal */}
          <TaskPreview
            task={previewTask}
            onClose={() => setPreviewTask(null)}
            expandedMeasurementPoints={expandedMeasurementPoints}
            setExpandedMeasurementPoints={setExpandedMeasurementPoints}
          />
        </div>
      </div>
    </div>
  );
}