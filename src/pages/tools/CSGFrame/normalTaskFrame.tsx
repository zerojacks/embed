import React, { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useWasm } from '../../../contexts/WasmContext';
import type { NormalTaskParam } from '../../../types/csgframe';

interface NormalTaskFrameProps {
    onFrameGenerator: (frame: number[], params?: any) => void;
    initialParams?: any;
}

const ReportUnit = {
    0: "分钟",
    1: "小时",
    2: "日",
    3: "月"
} as const;

const DataStructType = {
    0: "自描述格式组织数据",
    1: "按任务定义数据格式",
    3: "自定义"
} as const;

const NormalTaskFrame: React.FC<NormalTaskFrameProps> = ({ onFrameGenerator, initialParams }) => {
    const { generatorNormalTaskFrame } = useWasm();

    // 获取当前时间并设为默认值（精确到分钟）
    const getCurrentTime = () => {
        const now = new Date();
        now.setSeconds(0, 0); // 将秒数和毫秒数设为0
        return now.getTime();
    };

    const [taskParam, setTaskParam] = useState<NormalTaskParam>(() => {
        if (initialParams) {
            return {
                ...initialParams,
                // 确保时间戳是数字类型
                report_base_time: initialParams.report_base_time || getCurrentTime(),
                read_base_time: initialParams.read_base_time || getCurrentTime()
            };
        }
        return {
            task_id: 1,
            valid_flag: true,
            report_base_time: getCurrentTime(),
            report_unit: 0,
            report_cycle: 1,
            data_struct: 0,
            read_base_time: getCurrentTime(),
            read_unit: 0,
            read_cycle: 1,
            data_rate: 1,
            exec_count: 1,
            points: '',
            items: ''
        };
    });

    // 格式化时间戳为 datetime-local 格式 (UTC，精确到分钟)
    const formatDateTimeLocal = (timestamp: number) => {
        if (timestamp === 0) return '';
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
        const date = new Date(dateTimeValue + ':00Z');
        return date.getTime();
    };

    const handleInputChange = (field: keyof NormalTaskParam, value: string | number | boolean) => {
        setTaskParam(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleTimeChange = (field: 'report_base_time' | 'read_base_time', value: string) => {
        const timestamp = parseDateTimeLocal(value);
        handleInputChange(field, timestamp);
    };

    const generateFrame = useCallback(async () => {
        try {
            // 验证必填字段
            if (!taskParam.points.trim()) {
                toast.error('请填写信息点标识');
                return;
            }
            if (!taskParam.items.trim()) {
                toast.error('请填写数据标识编码');
                return;
            }
            if (taskParam.task_id <= 0 || taskParam.task_id > 254) {
                toast.error('任务号必须在1-254范围内');
                return;
            }

            // 验证时间配置
            if (taskParam.report_base_time === 0) {
                toast.error('请配置上报基准时间');
                return;
            }
            if (taskParam.read_base_time === 0) {
                toast.error('请配置采样基准时间');
                return;
            }

            const hexString = await generatorNormalTaskFrame(taskParam);

            if (!hexString) {
                toast.error('生成报文失败：返回数据为空');
                return;
            }

            // 将十六进制字符串转换为数字数组
            const hexBytes = hexString.split(' ').filter(hex => hex.length > 0);
            const frame: number[] = hexBytes.map(hex => parseInt(hex, 16));

            // 传递参数给回调函数
            onFrameGenerator(frame, taskParam);
            toast.success('普通任务报文生成成功');

            console.log('普通任务参数:', taskParam);
        } catch (error) {
            console.error('生成普通任务报文失败:', error);
            toast.error(`生成报文失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }, [taskParam, generatorNormalTaskFrame, onFrameGenerator]);

    return (
        <div className="h-full flex flex-col">
            <div className="card bg-base-100 shadow-xl h-full flex flex-col">
                <div className="card-body flex flex-col h-full">
                    <h2 className="card-title text-primary mb-4">普通任务参数配置</h2>

                    {/* 可滚动的表单区域 */}
                    <div className="flex-1 overflow-auto mb-6">
                        <div className="space-y-4 px-2">
                            {/* 基本信息 */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="form-control flex flex-col w-full">
                                    <label className="label label-text text-xs">
                                        <span className="label-text font-semibold">任务号</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="input input-bordered input-primary w-full"
                                        value={taskParam.task_id}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value);
                                            handleInputChange('task_id', isNaN(value) ? 0 : value);
                                        }}
                                        placeholder="输入任务号"
                                        min="1"
                                        max="254"
                                    />
                                </div>

                                <div className="form-control flex flex-col w-full">
                                    <label className="label label-text text-xs">
                                        <span className="label-text font-semibold">有效标识</span>
                                    </label>
                                    <select
                                        className="select select-bordered select-primary w-full"
                                        value={taskParam.valid_flag ? '1' : '0'}
                                        onChange={(e) => handleInputChange('valid_flag', e.target.value === '1')}
                                    >
                                        <option value="0">无效</option>
                                        <option value="1">有效</option>
                                    </select>
                                </div>
                            </div>

                            {/* 上报配置 */}
                            <div className="divider">上报配置</div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="form-control flex flex-col w-full">
                                    <label className="label label-text text-xs">
                                        <span className="label-text font-semibold">上报基准时间</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="input input-bordered input-primary w-full"
                                        value={formatDateTimeLocal(taskParam.report_base_time)}
                                        onChange={(e) => handleTimeChange('report_base_time', e.target.value)}
                                    />
                                </div>

                                <div className="form-control flex flex-col w-full">
                                    <label className="label label-text text-xs">
                                        <span className="label-text font-semibold">上报周期单位</span>
                                    </label>
                                    <select
                                        className="select select-bordered select-primary w-full"
                                        value={taskParam.report_unit}
                                        onChange={(e) => handleInputChange('report_unit', parseInt(e.target.value))}
                                    >
                                        {Object.entries(ReportUnit).map(([key, value]) => (
                                            <option key={key} value={key}>
                                                {value}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-control flex flex-col w-full">
                                    <label className="label label-text text-xs">
                                        <span className="label-text font-semibold">上报周期</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="input input-bordered input-primary w-full"
                                        value={taskParam.report_cycle}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value);
                                            handleInputChange('report_cycle', isNaN(value) ? 0 : value);
                                        }}
                                        min="0"
                                        max="255"
                                    />
                                </div>

                                <div className="form-control flex flex-col w-full">
                                    <label className="label label-text text-xs">
                                        <span className="label-text font-semibold">数据结构方式</span>
                                    </label>
                                    <select
                                        className="select select-bordered select-primary w-full"
                                        value={taskParam.data_struct > 2 ? 3 : taskParam.data_struct}
                                        onChange={(e) => handleInputChange('data_struct', parseInt(e.target.value))}
                                    >
                                        {Object.entries(DataStructType).map(([key, value]) => (
                                            <option key={key} value={key}>
                                                {value}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* 自定义数据结构类型输入框 */}
                                {taskParam.data_struct > 2 && (
                                    <div className="form-control flex flex-col w-full">
                                        <label className="label label-text text-xs">
                                            <span className="label-text font-semibold">自定义数据类型值</span>
                                        </label>
                                        <input
                                            type="number"
                                            className="input input-bordered input-primary w-full"
                                            value={taskParam.data_struct}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value);
                                                handleInputChange('data_struct', isNaN(value) ? 3 : value);
                                            }}
                                            placeholder="请输入自定义数据类型值"
                                            min="3"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* 采样配置 */}
                            <div className="divider">采样配置</div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="form-control flex flex-col w-full">
                                    <label className="label label-text text-xs">
                                        <span className="label-text font-semibold">采样基准时间</span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="input input-bordered input-primary w-full"
                                        value={formatDateTimeLocal(taskParam.read_base_time)}
                                        onChange={(e) => handleTimeChange('read_base_time', e.target.value)}
                                    />
                                </div>

                                <div className="form-control flex flex-col w-full">
                                    <label className="label label-text text-xs">
                                        <span className="label-text font-semibold">采样周期单位</span>
                                    </label>
                                    <select
                                        className="select select-bordered select-primary w-full"
                                        value={taskParam.read_unit}
                                        onChange={(e) => handleInputChange('read_unit', parseInt(e.target.value))}
                                    >
                                        {Object.entries(ReportUnit).map(([key, value]) => (
                                            <option key={key} value={key}>
                                                {value}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-control flex flex-col w-full">
                                    <label className="label label-text text-xs">
                                        <span className="label-text font-semibold">采样周期</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="input input-bordered input-primary w-full"
                                        value={taskParam.read_cycle}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value);
                                            handleInputChange('read_cycle', isNaN(value) ? 0 : value);
                                        }}
                                        min="0"
                                        max="255"
                                    />
                                </div>

                                <div className="form-control flex flex-col w-full">
                                    <label className="label label-text text-xs">
                                        <span className="label-text font-semibold">数据抽取倍率</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="input input-bordered input-primary w-full"
                                        value={taskParam.data_rate}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value);
                                            handleInputChange('data_rate', isNaN(value) ? 0 : value);
                                        }}
                                        min="0"
                                        max="255"
                                    />
                                </div>
                            </div>

                            {/* 执行配置 */}
                            <div className="divider">执行配置</div>
                            <div className="form-control flex flex-col">
                                <label className="label label-text text-xs">
                                    <span className="label-text font-semibold">执行次数</span>
                                </label>
                                <input
                                    type="number"
                                    className="input input-bordered input-primary w-full"
                                    value={taskParam.exec_count}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        handleInputChange('exec_count', isNaN(value) ? 0 : value);
                                    }}
                                    min="0"
                                />
                            </div>

                            {/* 数据标识 */}
                            <div className="divider">数据标识</div>
                            <div className="space-y-4">
                                <div className="form-control flex flex-col">
                                    <label className="label label-text text-xs">
                                        <span className="label-text font-semibold">信息点标识</span>
                                    </label>
                                    <textarea
                                        className="textarea textarea-bordered textarea-primary w-full"
                                        value={taskParam.points}
                                        onChange={(e) => handleInputChange('points', e.target.value)}
                                        placeholder="使用英文','或'-'分隔，如1,3,5-6"
                                        rows={3}
                                    />
                                </div>

                                <div className="form-control flex flex-col">
                                    <label className="label label-text text-xs">
                                        <span className="label-text font-semibold">数据标识编码</span>
                                    </label>
                                    <textarea
                                        className="textarea textarea-bordered textarea-primary w-full"
                                        value={taskParam.items}
                                        onChange={(e) => handleInputChange('items', e.target.value)}
                                        placeholder="使用英文','分割，如E0000130,E0000131"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 操作按钮和提示信息 - 固定区域 */}
                    <div className="shrink-0 space-y-3">
                        <button
                            className="btn btn-primary w-full"
                            onClick={generateFrame}
                            disabled={!taskParam.points.trim() || !taskParam.items.trim() || taskParam.task_id <= 0 || taskParam.task_id > 254}
                        >
                            生成普通任务报文
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NormalTaskFrame;