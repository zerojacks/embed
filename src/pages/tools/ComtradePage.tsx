import React, { useState, useRef, useCallback, useMemo } from 'react';
import { 
  type ComtradeConfig, 
  type ComtradeData, 
  parseComtradeCfg, 
  parseComtradeDatAscii, 
  parseComtradeDatBinary 
} from '../../utils/comtradeParser';

import { Link } from 'react-router-dom';
import { ArrowLeft, FileSearch } from 'lucide-react';

// 引入 react-window 用于虚拟列表
import { List } from 'react-window';

export default function ComtradePage() {
  const [config, setConfig] = useState<ComtradeConfig | null>(null);
  const [datData, setDatData] = useState<ComtradeData[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const cfgInputRef = useRef<HTMLInputElement>(null);
  const datInputRef = useRef<HTMLInputElement>(null);

  const handleCfgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsedConfig = parseComtradeCfg(text);
        setConfig(parsedConfig);
        setDatData([]); // Reset data when config changes
        setError('');
        
        // Reset dat input so user is prompted to upload matching dat
        if (datInputRef.current) datInputRef.current.value = '';
      } catch (err: unknown) {
        setError('解析 CFG 文件失败: ' + (err instanceof Error ? err.message : String(err)));
        setConfig(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDatUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !config) {
      if (!config) setError('请先上传并解析 CFG 文件');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (config.fileType === 'ASCII') {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const text = event.target?.result as string;
            const parsedData = parseComtradeDatAscii(text, config); 
            setDatData(parsedData);
            setLoading(false);
          } catch (err: unknown) {
            setError('解析 ASCII DAT 文件失败: ' + (err instanceof Error ? err.message : String(err)));
            setLoading(false);
          }
        };
        reader.readAsText(file);
      } else if (config.fileType === 'BINARY') {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const buffer = event.target?.result as ArrayBuffer;
            const parsedData = await parseComtradeDatBinary(buffer, config); 
            setDatData(parsedData);
            setLoading(false);
          } catch (err: unknown) {
            setError('解析 BINARY DAT 文件失败: ' + (err instanceof Error ? err.message : String(err)));
            setLoading(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        throw new Error(`暂不支持的数据格式: ${config.fileType}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  const Row = useCallback(({ index, style }: { index: number, style: React.CSSProperties }) => {
    const row = datData[index];
    return (
      <div style={style} className="flex border-b border-base-200 text-sm hover:bg-base-200">
        <div className="w-16 shrink-0 p-2 border-r border-base-200">{row.sampleNumber}</div>
        <div className="w-48 shrink-0 p-2 border-r border-base-200 text-xs flex items-center">
          {row.timestampStr || row.timestamp}
        </div>
        {row.analogValues.map((val, i) => (
          <div key={`vA${i}`} className="flex-1 min-w-[96px] p-2 border-r border-base-200 text-right">
            {val.toFixed(3)}
          </div>
        ))}
        {row.digitalValues.map((val, i) => (
          <div key={`vD${i}`} className="flex-1 min-w-[64px] p-2 border-r border-base-200 text-center">
            {val}
          </div>
        ))}
      </div>
    );
  }, [datData]);

  // 计算表格总宽度以支持水平滚动
  const tableWidth = useMemo(() => {
    if (!config) return '100%';
    const baseWidth = 64 + 192; // sampleNumber + timestamp
    const analogWidth = config.analogChannelsCount * 96;
    const digitalWidth = config.digitalChannelsCount * 64;
    return Math.max(1000, baseWidth + analogWidth + digitalWidth);
  }, [config]);

  return (
    <div className="h-full flex flex-col bg-base-100">
      {/* Header */}
      <div className="flex-none p-4 border-b border-base-300">
        <div className="flex items-center gap-4">
          <Link to="/tools" className="btn btn-ghost btn-circle">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <FileSearch className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">COMTRADE 解析器</h1>
              <p className="text-sm text-base-content/70">
                解析电力系统暂态数据交换通用格式 (IEEE C37.111 / IEC 60255-24)。请先上传 <b>.cfg</b> 文件，再上传 <b>.dat</b> 文件。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 overflow-auto flex flex-col min-h-0">
      {error && (
        <div className="alert alert-error shadow-sm">
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">上传文件</h2>
            
            <div className="form-control w-full mb-4">
              <label className="label">
                <span className="label-text font-medium">1. 上传配置文件 (.cfg)</span>
              </label>
              <input 
                type="file" 
                accept=".cfg"
                ref={cfgInputRef}
                className="file-input file-input-bordered file-input-primary w-full" 
                onChange={handleCfgUpload}
              />
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">2. 上传数据文件 (.dat)</span>
              </label>
              <input 
                type="file" 
                accept=".dat"
                ref={datInputRef}
                disabled={!config}
                className="file-input file-input-bordered file-input-secondary w-full" 
                onChange={handleDatUpload}
              />
              {!config && (
                <label className="label">
                  <span className="label-text-alt text-warning">请先上传有效的 CFG 文件</span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Config Summary */}
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">基本信息</h2>
            {config ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-base-content/60">厂站名称：</span>{config.stationName || 'N/A'}</div>
                <div><span className="text-base-content/60">记录装置：</span>{config.recordingDeviceId || 'N/A'}</div>
                <div><span className="text-base-content/60">标准年份：</span>{config.revYear}</div>
                <div><span className="text-base-content/60">文件格式：</span><span className="badge badge-outline">{config.fileType}</span></div>
                <div><span className="text-base-content/60">总通道数：</span>{config.totalChannels}</div>
                <div><span className="text-base-content/60">模拟通道：</span>{config.analogChannelsCount}</div>
                <div><span className="text-base-content/60">数字通道：</span>{config.digitalChannelsCount}</div>
                <div><span className="text-base-content/60">电网频率：</span>{config.lineFrequency} Hz</div>
                <div><span className="text-base-content/60">开始时间：</span>{config.startTime}</div>
                <div><span className="text-base-content/60">触发时间：</span>{config.triggerTime}</div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-base-content/40">
                等待解析...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Channels Info */}
      {config && (
        <div className="card bg-base-100 shadow-sm border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-lg mb-4">通道定义</h2>
            
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm">
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>类型</th>
                    <th>名称</th>
                    <th>相位</th>
                    <th>单位</th>
                    <th>乘数(a)</th>
                    <th>偏移(b)</th>
                    <th>最小值</th>
                    <th>最大值</th>
                  </tr>
                </thead>
                <tbody>
                  {config.analogChannels.map(ch => (
                    <tr key={`A${ch.index}`}>
                      <td>{ch.index}</td>
                      <td><span className="badge badge-primary badge-sm">模拟</span></td>
                      <td>{ch.name}</td>
                      <td>{ch.phase}</td>
                      <td>{ch.unit}</td>
                      <td>{ch.a}</td>
                      <td>{ch.b}</td>
                      <td>{ch.min}</td>
                      <td>{ch.max}</td>
                    </tr>
                  ))}
                  {config.digitalChannels.map(ch => (
                    <tr key={`D${ch.index}`}>
                      <td>{ch.index}</td>
                      <td><span className="badge badge-secondary badge-sm">数字</span></td>
                      <td>{ch.name}</td>
                      <td>{ch.phase}</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                      <td>-</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Data Preview */}
      {datData.length > 0 && config && (
        <div className="card bg-base-100 shadow-sm border border-base-300 flex-1 min-h-[400px]">
          <div className="card-body flex flex-col p-0">
            <div className="p-4 border-b border-base-300">
              <h2 className="card-title text-lg">数据浏览 (共 {datData.length} 行)</h2>
            </div>
            
            <div className="flex-1 overflow-x-auto flex flex-col min-h-0">
              <div style={{ minWidth: tableWidth }} className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="flex border-b border-base-300 bg-base-200 text-sm font-semibold sticky top-0 z-10 shrink-0">
                  <div className="w-16 shrink-0 p-2 border-r border-base-300">#</div>
                  <div className="w-48 shrink-0 p-2 border-r border-base-300">时间戳</div>
                  {config.analogChannels.map(ch => (
                    <div key={`A${ch.index}`} className="flex-1 min-w-[96px] p-2 border-r border-base-300 text-right truncate" title={`${ch.name} (${ch.unit})`}>
                      {ch.name} <span className="text-xs font-normal text-base-content/60">({ch.unit})</span>
                    </div>
                  ))}
                  {config.digitalChannels.map(ch => (
                    <div key={`D${ch.index}`} className="flex-1 min-w-[64px] p-2 border-r border-base-300 text-center truncate" title={ch.name}>
                      {ch.name}
                    </div>
                  ))}
                </div>
                
                {/* Virtual List Body */}
                <div className="flex-1 relative">
                  <div className="absolute inset-0">
                    <List<any>
                      style={{ height: "100%", width: "100%" }}
                      rowCount={datData.length}
                      rowHeight={36}
                      rowComponent={Row}
                      rowProps={{}}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center items-center py-8">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      )}
      </div>
    </div>
  );
}
