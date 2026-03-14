import React, { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { useWasm } from '../../../contexts/WasmContext';
import FrameDataInput from '../../../components/CSGFrame/FrameDataInput';
import type { CSGHistoryDataFrame, FrameData, DataDensityKey } from '../../../types/csgframe';
import { DataDensity } from '../../../types/csgframe';

interface HistoryFrameProps {
    onFrameGenerator: (frame: number[], params?: any) => void;
    initialParams?: any;
}

interface FrameDataInputType extends FrameData {
    id: string;
}

const HistoryFrame: React.FC<HistoryFrameProps> = ({ onFrameGenerator, initialParams }) => {
    const { generatorCSGHistoryFrame } = useWasm();
    const [frameDataList, setFrameDataList] = useState<FrameDataInputType[]>(() => {
        if (initialParams?.frameDataList && initialParams.frameDataList.length > 0) {
            return initialParams.frameDataList.map((item: any, index: number) => ({
                ...item,
                id: item.id || (index + 1).toString()
            }));
        }
        return [{ id: '1', point: '', item: '' }];
    });
    
    // Time states - using timestamps (UTC, 精确到分钟)
    const [startTime, setStartTime] = useState<number>(() => {
        if (initialParams?.startTime) {
            return initialParams.startTime;
        }
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        // 将秒数和毫秒数设为0，只保留到分钟
        yesterday.setUTCSeconds(0, 0);
        return yesterday.getTime();
    });
    const [endTime, setEndTime] = useState<number>(() => {
        if (initialParams?.endTime) {
            return initialParams.endTime;
        }
        const now = new Date();
        // 将秒数和毫秒数设为0，只保留到分钟
        now.setUTCSeconds(0, 0);
        return now.getTime();
    });
    const [dataDensity, setDataDensity] = useState<DataDensityKey>(initialParams?.dataDensity || 1);

    // 格式化时间戳为 datetime-local 格式 (UTC，精确到分钟)
    const formatDateTimeLocal = (timestamp: number) => {
        const date = new Date(timestamp);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // 将 datetime-local 值转换为 UTC 时间戳 (精确到分钟，秒数设为0)
    const parseDateTimeLocal = (dateTimeValue: string) => {
        if (!dateTimeValue) return 0;
        // 将输入的本地时间作为UTC时间处理，并将秒数设为0
        const date = new Date(dateTimeValue + ':00Z'); // 添加:00秒和Z表示UTC时间
        return date.getTime();
    };

    const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const timestamp = parseDateTimeLocal(e.target.value);
        setStartTime(timestamp);
    };

    const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const timestamp = parseDateTimeLocal(e.target.value);
        setEndTime(timestamp);
    };

    const addFrameData = useCallback(() => {
        const newId = (frameDataList.length + 1).toString();
        setFrameDataList(prev => [...prev, { id: newId, point: '', item: '' }]);
    }, [frameDataList.length]);

    const removeFrameData = useCallback((id: string) => {
        if (frameDataList.length > 1) {
            setFrameDataList(prev => prev.filter(item => item.id !== id));
        }
    }, [frameDataList.length]);

    const updateFrameData = useCallback((id: string, field: keyof FrameData, value: string) => {
        setFrameDataList(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    }, []);

    const generateFrame = useCallback(async () => {
        try {
            // 验证输入数据
            const hasEmptyFields = frameDataList.some(item => !item.point.trim() || !item.item.trim());
            if (hasEmptyFields) {
                toast.error('请填写所有必填字段');
                return;
            }

            // 验证时间范围
            if (startTime >= endTime) {
                toast.error('起始时间必须早于结束时间');
                return;
            }

            // 构建 CSGHistoryDataFrame 对象
            const frameData = frameDataList.map(({ id, ...rest }) => rest);
            const csgHistoryData: CSGHistoryDataFrame = {
                data: frameData,
                startTime,
                endTime,
                dataDensity
            };

            const hexString = await generatorCSGHistoryFrame(csgHistoryData);

            if (!hexString) {
                toast.error('生成报文失败：返回数据为空');
                return;
            }

            // 将十六进制字符串转换为数字数组
            const hexBytes = hexString.split(' ').filter(hex => hex.length > 0);
            const frame: number[] = hexBytes.map(hex => parseInt(hex, 16));

            // 传递参数给回调函数
            const params = {
                frameDataList: frameDataList.map(({ id, ...rest }) => rest),
                startTime,
                endTime,
                dataDensity
            };

            onFrameGenerator(frame, params);
            toast.success('历史数据读取报文生成成功');
            
            // 在控制台输出历史数据参数供调试
            console.log('历史数据参数:', csgHistoryData);
        } catch (error) {
            console.error('生成历史数据读取报文失败:', error);
            toast.error(`生成报文失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }, [frameDataList, startTime, endTime, dataDensity, generatorCSGHistoryFrame, onFrameGenerator]);

    return (
        <div className="h-full flex flex-col">
            <div className="card bg-base-100 shadow-xl h-full flex flex-col">
                <div className="card-body flex flex-col h-full">
                    <h2 className="card-title text-primary mb-4">历史数据读取</h2>

                    {/* 时间和密度配置区域 - 固定区域 */}
                    <div className="shrink-0 mb-6 space-y-4 px-2">
                        {/* 时间选择器 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label label-text text-xs">
                                    <span className="label-text font-semibold">起始时间</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    className="input input-bordered input-primary w-full"
                                    value={formatDateTimeLocal(startTime)}
                                    onChange={handleStartTimeChange}
                                    placeholder="选择起始时间"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label label-text text-xs">
                                    <span className="label-text font-semibold">结束时间</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    className="input input-bordered input-primary w-full"
                                    value={formatDateTimeLocal(endTime)}
                                    onChange={handleEndTimeChange}
                                    placeholder="选择结束时间"
                                />
                            </div>
                        </div>

                        {/* 数据密度选择器 - 上下布局 */}
                        <div className="form-control w-full">
                            <label className="label label-text text-xs">
                                <span className="label-text font-semibold">数据密度</span>
                            </label>
                            <select
                                className="select select-bordered select-primary w-full"
                                value={dataDensity}
                                onChange={(e) => setDataDensity(Number(e.target.value) as DataDensityKey)}
                            >
                                {Object.entries(DataDensity).map(([key, value]) => (
                                    <option key={key} value={key}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 数据项列表 - 可滚动区域 */}
                    <div className="flex-1 overflow-auto mb-6">
                        <div className="space-y-4 pr-2">
                            {frameDataList.map((frameData, index) => (
                                <FrameDataInput
                                    key={frameData.id}
                                    frameData={frameData}
                                    index={index}
                                    showDataContent={false}
                                    showRemoveButton={frameDataList.length > 1}
                                    onUpdate={updateFrameData}
                                    onRemove={frameDataList.length > 1 ? removeFrameData : undefined}
                                />
                            ))}
                        </div>
                    </div>

                    {/* 操作按钮和提示信息 - 固定区域 */}
                    <div className="shrink-0 space-y-3">
                        <button
                            className="btn btn-outline btn-primary w-full"
                            onClick={addFrameData}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            添加数据项
                        </button>

                        <button
                            className="btn btn-primary w-full"
                            onClick={generateFrame}
                            disabled={frameDataList.some(item => !item.point?.trim() || !item.item?.trim()) || startTime >= endTime}
                        >
                            生成历史数据读取报文
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoryFrame;