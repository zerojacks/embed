import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { ItemConfigList } from '@/types';

// 轻量级配置项卡片组件
const ConfigItemCard = React.memo(({
  item,
  index,
  style
}: {
  item: ItemConfigList;
  index: number;
  style?: React.CSSProperties;
}) => (
  <div
    className="bg-base-200 border-b border-base-300 hover:bg-base-300 transition-colors px-4 py-2"
    style={style}
  >
    <div className="flex items-center justify-between gap-4">
      {/* 左侧：项目ID和名称 */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-nowrap">
          {item.item || '未知数据项ID'}
        </span>
        <span className="text-sm truncate">
          {item.name || '未命名'}
        </span>
      </div>

      {/* 右侧：协议和区域 */}
      <div className="flex items-center gap-2 shrink-0">
        {item.protocol && (
          <span className="badge badge-outline badge-xs">
            {item.protocol}
          </span>
        )}
        {item.region && (
          <span className="badge badge-ghost badge-xs">
            {item.region}
          </span>
        )}
      </div>
    </div>
  </div>
));

interface VirtualConfigItemListProps {
  items: ItemConfigList[];
  height?: number;
  itemHeight?: number;
}

const VirtualConfigItemList: React.FC<VirtualConfigItemListProps> = ({
  items,
  height = 400,
  itemHeight = 48 // 进一步减小高度，更紧凑
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(height);
  const containerRef = useRef<HTMLDivElement>(null);

  // 计算虚拟滚动参数
  const totalItems = items.length;
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 4; // 增加缓冲区
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
  const endIndex = Math.min(totalItems, startIndex + visibleCount);

  // 计算可见的配置项
  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = startIndex; i < endIndex; i++) {
      if (i < items.length) {
        result.push({
          item: items[i],
          index: i,
          top: i * itemHeight
        });
      }
    }
    return result;
  }, [items, startIndex, endIndex, itemHeight]);

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
        const { height: observedHeight } = entry.contentRect;
        if (!height) { // 如果没有指定固定高度，则使用观察到的高度
          setContainerHeight(observedHeight);
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [height]);

  // 总内容高度
  const totalHeight = totalItems * itemHeight;

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto border border-base-300 rounded-lg"
      style={{ height: `${containerHeight}px` }}
      onScroll={handleScroll}
    >
      {items.length === 0 ? (
        // 空状态
        <div className="flex items-center justify-center h-full min-h-[200px]">
          <div className="text-center">
            <p className="text-base-content/70">没有找到配置项</p>
            <p className="text-xs text-base-content/50 mt-1">请尝试调整搜索条件</p>
          </div>
        </div>
      ) : (
        // 虚拟内容容器 - 用于撑开滚动条
        <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
          {/* 渲染可见的配置项卡片 */}
          {visibleItems.map(({ item, index, top }) => (
            <div
              key={`${item.item}-${index}`}
              style={{
                position: 'absolute',
                top: `${top}px`,
                left: '8px',
                right: '8px',
                height: `${itemHeight - 4}px`, // 减去间距
                paddingBottom: '4px' // 底部间距
              }}
            >
              <ConfigItemCard
                item={item}
                index={index}
                style={{ height: '100%' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VirtualConfigItemList;