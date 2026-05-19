import React, { useState, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useWasm } from '../../../contexts/WasmContext';
import type { WaveRecordParam } from '../../../types/csgframe';

interface WaveRecordFrameProps {
    onFrameGenerator: (frame: number[], params?: any) => void;
    initialParams?: any;
}

const WaveRecordFrame: React.FC<WaveRecordFrameProps> = ({ onFrameGenerator, initialParams }) => {
    const { generatorCSGReadWaveRecord } = useWasm();
    const [params, setParams] = useState<WaveRecordParam>(() => {
        if (initialParams) {
            return {
                alarm_id: initialParams.alarm_id || 0,
                points: initialParams.points || '0001',
                wave_type: initialParams.wave_type || 1,
                time: initialParams.time || '',
                start_idx: initialParams.start_idx
            };
        }
        return {
            alarm_id: 0,
            points: '0001',
            wave_type: 1,
            time: '',
        };
    });

    const [alarmIdHex, setAlarmIdHex] = useState(() => {
        const id = initialParams?.alarm_id || 0xE2000085;
        return id.toString(16).toUpperCase().padStart(8, '0');
    });

    const isReadContent = useMemo(() => params.start_idx !== undefined, [params.start_idx]);

    const handleParamChange = useCallback((field: keyof WaveRecordParam, value: any) => {
        setParams(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleDIChange = useCallback((di: string) => {
        setParams(prev => {
            if (di === 'E3010008') {
                return { ...prev, start_idx: prev.start_idx ?? 0 };
            } else {
                const { start_idx, ...rest } = prev;
                return rest;
            }
        });
    }, []);

    const generateFrame = useCallback(async () => {
        try {
            // 验证输入数据
            if (!params.points.trim()) {
                toast.error('请填写信息点标识DA');
                return;
            }

            if (alarmIdHex.length !== 8) {
                toast.error('告警数据标识编码必须为4字节（8位十六进制）');
                return;
            }

            if (params.time.length !== 14) {
                toast.error('告警发生时间格式错误，必须为 14 位数字 (YYMMDDhhmmssms)');
                return;
            }

            const finalParams = {
                ...params,
                alarm_id: parseInt(alarmIdHex, 16)
            };

            // 调用 WASM 函数生成报文
            const hexString = await generatorCSGReadWaveRecord(finalParams);

            if (!hexString) {
                toast.error('生成报文失败：返回数据为空');
                return;
            }

            // 将十六进制字符串转换为数字数组
            const hexBytes = hexString.split(' ').filter(hex => hex.length > 0);
            const frame: number[] = hexBytes.map(hex => parseInt(hex, 16));

            onFrameGenerator(frame, finalParams);
            toast.success('录波数据报文生成成功');
        } catch (error) {
            console.error('生成录波数据报文失败:', error);
            toast.error(`生成报文失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }, [params, alarmIdHex, generatorCSGReadWaveRecord, onFrameGenerator]);

    return (
        <div className="h-full flex flex-col">
            <div className="card bg-base-100 shadow-xl h-full flex flex-col">
                <div className="card-body flex flex-col h-full overflow-hidden">
                    <h2 className="card-title text-primary mb-4 shrink-0">录波数据读取</h2>

                    <div className="flex-1 overflow-auto space-y-6 pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 数据标识选择 */}
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-bold">数据标识编码 (DI)</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={isReadContent ? 'E3010008' : 'E3010007'}
                                    onChange={(e) => handleDIChange(e.target.value)}
                                >
                                    <option value="E3010007">E3010007 - 查询录波数据信息 (FD7)</option>
                                    <option value="E3010008">E3010008 - 读取录波数据内容 (FD8)</option>
                                </select>
                            </div>

                            {/* 告警数据标识编码 */}
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-bold">告警数据标识编码</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full font-mono"
                                    value={alarmIdHex}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().slice(0, 8);
                                        setAlarmIdHex(val);
                                    }}
                                    placeholder="4字节十六进制告警ID (如: E2000001)"
                                />
                            </div>

                            {/* 信息点标识DA */}
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-bold">测量点</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full font-mono"
                                    value={params.points}
                                    onChange={(e) => handleParamChange('points', e.target.value)}
                                    placeholder="例如: 0001"
                                />
                            </div>

                            {/* 故障类型 */}
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-bold">故障类型</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={params.wave_type}
                                    onChange={(e) => handleParamChange('wave_type', parseInt(e.target.value))}
                                >
                                    <option value={1}>01 - 暂降</option>
                                    <option value={2}>02 - 暂升</option>
                                    <option value={3}>03 - 短时中断</option>
                                    <option value={0}>00 - 其他</option>
                                </select>
                            </div>

                            {/* 告警发生时间 */}
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text font-bold">告警发生时间</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full font-mono"
                                    value={params.time}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 14);
                                        handleParamChange('time', val);
                                    }}
                                    placeholder="YYMMDDhhmmssms (14位数字)"
                                />
                                <label className="label">
                                    <span className="label-text-alt text-base-content/60">格式: 年月日时分秒毫秒(10ms单位)</span>
                                </label>
                            </div>

                            {/* 录波数据周波序号 (仅FD8) */}
                            {isReadContent && (
                                <div className="form-control w-full">
                                    <label className="label">
                                        <span className="label-text font-bold">录波数据周波序号 (Start Index)</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="input input-bordered w-full"
                                        value={params.start_idx}
                                        onChange={(e) => handleParamChange('start_idx', parseInt(e.target.value) || 0)}
                                        placeholder="从0开始"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="shrink-0 pt-4 mt-auto">
                        <button
                            className="btn btn-primary w-full"
                            onClick={generateFrame}
                        >
                            生成录波数据报文
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaveRecordFrame;
