import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import TreeItem, { generateRowId } from './TreeItem';
import type { TreeItemType } from './TreeItem';
import { domToPng, domToSvg } from 'modern-screenshot';
import { toast } from 'react-hot-toast'
import Progress from './progress';
import { ExportImage, CopyImage, ExpandAll } from './Icons'
import { useFrameTreeStore } from '../stores/useFrameAnalysicStore';

export interface Column {
  name: string;
  width: number;
  minWidth: number;
}

// 导出配置类型
interface ExportConfig {
  removeBorders: boolean;
  backgroundColor: string;
  scale: number;
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
}

interface TreeTableViewProps {
  data: TreeItemType[];
  tableheads: Column[];
  onRowClick: (item: TreeItemType) => void;
}

export const TreeTable: React.FC<TreeTableViewProps> = ({ data, tableheads, onRowClick }) => {

  const {
    selectedRowId,
    expandedRows,
    selectedCell,
    expandedAll,
    isLoading,
    treeScrollPosition,
    setSelectedRowId,
    setExpandedRows,
    setSelectedCell,
    setExpandedAll,
    setIsLoading,
    setTreeScrollPosition
  } = useFrameTreeStore();
  const tableRef = useRef<HTMLTableElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const [progress, setProgress] = useState({ type: '', position: 'end', visible: false });
  const [treedata, setTreeData] = useState<TreeItemType[]>(data);

  // 列宽调节相关状态
  const [columns, setColumns] = useState<Column[]>(tableheads);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<number | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // 初始化时扩展最后一列以填满容器
  useEffect(() => {
    if (containerRef.current && !isResizing) {
      const containerWidth = containerRef.current.clientWidth;

      if (containerWidth > 0 && tableheads.length > 0) {
        // 使用百分比分配列宽
        const adjustedColumns = tableheads.map((col, index) => {
          let widthPercentage: number;

          // 根据列的内容特性分配百分比
          switch (index) {
            case 0: // 帧域列
              widthPercentage = 0.3; // 30%
              break;
            case 1: // 数据列
              widthPercentage = 0.25; // 25%
              break;
            case 2: // 说明列
              widthPercentage = 0.45; // 45%
              break;
            default:
              widthPercentage = 1 / tableheads.length; // 平均分配
          }

          const calculatedWidth = Math.floor(containerWidth * widthPercentage);
          const minWidth = getColumnMinWidth(col);

          return {
            ...col,
            width: Math.max(calculatedWidth, minWidth)
          };
        });

        setColumns(adjustedColumns);
      } else {
        setColumns(tableheads);
      }
    }
  }, [tableheads, containerRef.current?.clientWidth]);

  const is_expand = selectedRowId ? expandedRows.has(selectedRowId) : false;

  // 默认导出配置
  const defaultExportConfig: ExportConfig = {
    removeBorders: true,
    backgroundColor: '#ffffff',
    scale: 2,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: '14px',
    lineHeight: '1.5'
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // 需要判断设置的位置是否在当前视口内，每一个方向都需要判断
    let x = e.clientX;
    let y = e.clientY;
    if (x + 200 > window.innerWidth) {
      x = e.clientX - 200;
    }
    if (y + 150 > window.innerHeight) {
      y = e.clientY - 150;
    }
    setContextMenu({ visible: true, x: x, y: y });
  };
  // 单独的异步函数来处理图片生成
  const generateImage = async (
    element: HTMLElement,
    format: 'png' | 'svg' = 'png',
    config: ExportConfig = defaultExportConfig
  ): Promise<string> => {
    try {
      if (format === 'png') {
        // 使用 modern-screenshot 生成 PNG
        const dataUrl = await domToPng(element, {
          backgroundColor: config.backgroundColor,
          scale: config.scale,
          style: {
            fontFamily: config.fontFamily,
            fontSize: config.fontSize,
            lineHeight: config.lineHeight,
          },
          // 添加过滤器来排除可能有问题的元素
          filter: (node: Node) => {
            if (node instanceof Element) {
              const element = node as HTMLElement;

              // 排除可能导致边框的元素
              const problematicClasses = ['border', 'shadow', 'outline'];
              const hasProblematicClass = problematicClasses.some(cls =>
                element.className && element.className.includes(cls)
              );

              // 如果元素有问题的类，但不是表格相关元素，则排除
              if (hasProblematicClass && !['TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD'].includes(element.tagName)) {
                return false;
              }
            }
            return true;
          },
        });
        return dataUrl;
      } else {
        // 使用 modern-screenshot 生成 SVG
        const dataUrl = await domToSvg(element, {
          backgroundColor: config.backgroundColor,
          style: {
            fontFamily: config.fontFamily,
            fontSize: config.fontSize,
            lineHeight: config.lineHeight,
          },
        });
        return dataUrl;
      }
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  };

  const handleExportImage = async () => {
    const element = tableRef.current;
    setProgress(prevProgress => ({ ...prevProgress, visible: true }));

    if (element) {
      try {
        // 强制React检查是否需要更新UI
        await new Promise(resolve => setTimeout(resolve, 100));

        // 生成图片
        const dataUrl = await generateImage(element, 'png');

        if (dataUrl) {
          // 创建下载链接
          const link = document.createElement('a');
          link.download = `protocol-analysis-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
          link.href = dataUrl;

          // 触发下载
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          console.log('Image downloaded successfully!');
          setProgress(prevProgress => ({ ...prevProgress, visible: false }));
          setContextMenu({ visible: false, x: 0, y: 0 });
          toast.success("图片导出成功");
        } else {
          throw new Error('Failed to generate image');
        }
      } catch (error) {
        console.error('Error exporting image:', error);
        setProgress(prevProgress => ({ ...prevProgress, visible: false }));
        toast.error("图片导出失败");

        // 确保清理临时样式表
        const tempStyle = document.getElementById('temp-export-style');
        if (tempStyle) {
          document.head.removeChild(tempStyle);
        }
      }
    }
  };

  const handleCopyImage = async () => {
    closeContextMenu();

    try {
      toast('复制中，请勿操作', {
        icon: 'ℹ️',
        duration: 2000,
      });
      setProgress(prevProgress => ({ ...prevProgress, visible: true }));

      const element = tableRef.current;
      if (!element) {
        throw new Error('Table element not found');
      }

      // 等待一帧确保 DOM 更新完成
      await new Promise(resolve => requestAnimationFrame(resolve));

      console.log('Generating image for clipboard...');

      // 使用 html2canvas 生成图片
      const dataUrl = await generateImage(element, 'png');

      if (!dataUrl || dataUrl === 'data:,') {
        throw new Error('Generated image is empty');
      }

      // 将 data URL 转换为 blob
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error('Failed to convert image to blob');
      }

      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error('Generated blob is empty');
      }

      // 检查浏览器是否支持 Clipboard API
      if (!navigator.clipboard || !navigator.clipboard.write) {
        throw new Error('Clipboard API not supported');
      }

      // 使用 Clipboard API 复制图片
      const clipboardItem = new ClipboardItem({
        'image/png': blob,
      });

      await navigator.clipboard.write([clipboardItem]);

      console.log('Image copied successfully');
      setProgress(prevProgress => ({ ...prevProgress, visible: false }));
      toast.success("图片复制成功");

    } catch (error) {
      console.error('Error copying image:', error);
      setProgress(prevProgress => ({ ...prevProgress, visible: false }));

      // 提供更详细的错误信息
      let errorMessage = "图片复制失败";

      if (error instanceof Error) {
        if (error.message.includes('Clipboard API not supported')) {
          errorMessage = "浏览器不支持图片复制，请使用导出功能";
        } else if (error.message.includes('NotAllowedError') || error.name === 'NotAllowedError') {
          errorMessage = "没有剪贴板权限，请允许访问剪贴板";
        } else if (error.message.includes('empty')) {
          errorMessage = "图片生成失败，请重试";
        } else if (error.message.includes('timeout')) {
          errorMessage = "图片生成超时，请重试";
        }
      }

      toast.error(errorMessage);
    }
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  // 计算文本宽度的函数
  const calculateTextWidth = (text: string, fontSize: string = '14px', fontFamily: string = 'ui-sans-serif, system-ui, sans-serif'): number => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      context.font = `${fontSize} ${fontFamily}`;
      return Math.ceil(context.measureText(text).width);
    }
    // 如果无法测量，使用字符数 * 平均字符宽度作为估算
    return text.length * 8;
  };

  // 获取列的智能最小宽度
  const getColumnMinWidth = (column: Column): number => {
    const textWidth = calculateTextWidth(column.name);
    const padding = 32; // 左右内边距
    const resizeHandle = 6; // 调节手柄宽度
    const calculatedMinWidth = textWidth + padding + resizeHandle;

    // 使用配置的最小宽度和计算出的文本宽度中的较大值
    return Math.max(column.minWidth || 80, calculatedMinWidth);
  };

  // 列宽调节相关函数
  const handleMouseDown = (e: React.MouseEvent, columnIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizingColumn(columnIndex);
    setStartX(e.clientX);
    setStartWidth(columns[columnIndex].width);
  };



  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizing || resizingColumn === null) return;

    const deltaX = e.clientX - startX;
    const newWidth = startWidth + deltaX;

    setColumns(prevColumns => {
      const newColumns = [...prevColumns];
      const currentColumn = newColumns[resizingColumn];

      // 使用智能最小宽度计算
      const minWidth = getColumnMinWidth(currentColumn);

      // 计算调整后的列宽
      const adjustedWidth = Math.max(minWidth, newWidth);

      // 更新当前调整的列
      newColumns[resizingColumn] = {
        ...currentColumn,
        width: adjustedWidth
      };

      return newColumns;
    });
  }, [isResizing, resizingColumn, startX, startWidth]);

  const handleMouseUp = React.useCallback(() => {
    setIsResizing(false);
    setResizingColumn(null);
  }, []);

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // 当 tableheads 改变时更新 columns
  useEffect(() => {
    setColumns(tableheads);
  }, [tableheads]);


  useEffect(() => {
    const dataWithIds = generateUniqueIds(data);
    setTreeData(dataWithIds);
    handleExpandAll(dataWithIds);

    setIsLoading(true);
  }, [data]);

  useLayoutEffect(() => {
    if (isLoading) {
      if (treeScrollPosition && containerRef.current) {
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop = treeScrollPosition;
          }
        }, 0);
      }
    }
  }, [isLoading]);

  const generateUniqueIds = (items: TreeItemType[], level: number = 1): TreeItemType[] => {
    return items.map((item, index) => ({
      ...item,
      uniqueId: generateRowId(item, level * index),  // 传递深度给 generateRowId
      depth: level,  // 添加深度信息到 item
      children: item.children ? generateUniqueIds(item.children, level + 1) : []  // 递归调用时增加 level
    }));
  };

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        setTreeScrollPosition(containerRef.current.scrollTop);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const handleRowClick = (item: TreeItemType) => {
    setSelectedRowId(item.uniqueId || '');
    onRowClick(item);
  };

  const handleRowDoubleClick = (item: TreeItemType, hasChildren: boolean | undefined) => {
    if (hasChildren) {
      toggleRowExpansion(item.uniqueId || '');
    }
  };

  const toggleRowExpansion = (rowId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(rowId)) {
      newExpandedRows.delete(rowId);
    } else {
      newExpandedRows.add(rowId);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleExpandAll = (data: TreeItemType[]) => {
    const allExpanded = new Set<string>();
    // 遍历data，添加所有的 uniqueId
    const traverse = (items: TreeItemType[]) => {
      items.forEach(item => {
        allExpanded.add(item.uniqueId || '');
        if (item.children) {
          traverse(item.children);
        }
      });
    };
    traverse(data);
    setExpandedRows(allExpanded);
    setExpandedAll(true);
  };
  const ExpandCurHandler = () => {
    if (selectedRowId) {
      toggleRowExpansion(selectedRowId)
    }
  };

  const ExpandAllHandler = () => {
    if (expandedAll) {
      handleCollapseAll()
    } else {
      handleExpandAll(generateUniqueIds(data));
    }
  };
  const handleCollapseAll = () => {
    setExpandedRows(new Set());
    setExpandedAll(false);
  };

  return (
    <div className="w-full h-full overflow-x-auto overflow-y-auto treetableview rounded-md shadow-sm bg-base-100" ref={containerRef} onContextMenu={handleContextMenu} style={{ border: 'none' }}>
      {progress.visible && <Progress type={progress.type} xlevel={progress.position} />}
      <table className="bg-base-100" ref={tableRef} style={{ borderCollapse: 'separate', borderSpacing: '0', border: 'none', tableLayout: 'fixed', width: '100%' }}>
        <colgroup>
          {columns.map((column, index) => (
            <col key={index} style={{ width: `${column.width}px` }} />
          ))}
        </colgroup>
        <thead className="sticky top-0 z-10 bg-base-200 text-base-content">
          <tr style={{
            border: 'none',
            borderTop: 'none',
            borderBottom: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            outline: 'none'
          }}>
            {columns.map((column, index) => (
              <th
                key={index}
                style={{
                  position: 'relative',
                  width: `${column.width}px`,
                  border: 'none',
                  borderTop: 'none',
                  borderBottom: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  outline: 'none'
                }}
                className="font-medium text-center border-none shrink-0 overflow-hidden text-ellipsis whitespace-nowrap px-2"
              >
                {column.name}
                {/* 列宽调节手柄 */}
                {index < columns.length - 1 && (
                  <div
                    className="absolute top-0 h-full cursor-col-resize group"
                    style={{
                      right: '-4px',
                      width: '8px',
                      zIndex: 50,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, index)}
                    title={`拖拽调节第${index + 1}列宽度`}
                  >
                    {/* 分割线 */}
                    <div
                      className={`w-0.5 h-full mx-auto transition-all duration-200 ${isResizing && resizingColumn === index
                          ? 'bg-primary shadow-lg shadow-primary/50 w-1'
                          : 'bg-base-content/30 group-hover:bg-primary group-hover:w-1'
                        }`}
                    />
                    {/* 拖拽区域背景 */}
                    <div
                      className={`absolute inset-0 transition-all duration-200 rounded-sm ${isResizing && resizingColumn === index
                          ? 'bg-primary/25 border border-primary/30'
                          : 'bg-transparent group-hover:bg-primary/15'
                        }`}
                    />
                    {/* 拖拽指示器 */}
                    <div
                      className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${isResizing && resizingColumn === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="w-0.5 h-1 bg-primary rounded-full"></div>
                        <div className="w-0.5 h-1 bg-primary rounded-full"></div>
                        <div className="w-0.5 h-1 bg-primary rounded-full"></div>
                      </div>
                    </div>
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ border: 'none' }}>
          {treedata.map((item, index) => (
            <TreeItem
              key={item.uniqueId || generateRowId(item, index)}
              data={item}
              level={item.depth || 0}
              onRowClick={handleRowClick}
              onRowDoubleClick={handleRowDoubleClick}
              selectedRowId={selectedRowId}
              selectedCell={selectedCell}
              setSelectedCell={setSelectedCell}
              rowIndex={index}
              expandedRows={expandedRows}
              columns={columns} // 传递 columns 参数
            />
          ))}
        </tbody>
      </table>
      {contextMenu.visible && (
        <div
          className="fixed  bg-white border shadow-lg rounded-box"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={closeContextMenu}
        >
          <ul tabIndex={0} className="menu bg-base-100 rounded-box z-1 w-52 p-2 shadow">
            <li className="cursor-pointer" onClick={handleExportImage}>
              <a>
                <ExportImage className="h-5 w-5"></ExportImage>导出图片
              </a>
            </li>
            <li className="cursor-pointer" onClick={handleCopyImage}>
              <a>
                <CopyImage className="h-5 w-5"></CopyImage>复制图片
              </a>
            </li>
            <li className="cursor-pointer" onClick={ExpandCurHandler}>
              <a>
                <ExpandAll className="h-5 w-5"></ExpandAll> {is_expand ? "折叠当前节点" : "展开当前节点"}
              </a>
            </li>
            <li className="cursor-pointer" onClick={ExpandAllHandler}>
              <a>
                <ExpandAll className="h-5 w-5"></ExpandAll> {expandedAll ? "折叠所有节点" : "展开所有节点"}
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
