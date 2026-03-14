import React, { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { useWasm } from '../../../contexts/WasmContext';
import FrameDataInput from '../../../components/CSGFrame/FrameDataInput';
import type { CSGParam, FrameData, ParamType } from '../../../types/csgframe';

interface ParamFrameProps {
    onFrameGenerator: (frame: number[], params?: any) => void;
    initialParams?: any;
}

interface FrameDataInputType extends FrameData {
    id: string;
}

const ParamFrame: React.FC<ParamFrameProps> = ({ onFrameGenerator, initialParams }) => {
    const { generatorCSGParam } = useWasm();
    // Create a unique ID for this component instance to avoid radio button conflicts
    const componentId = React.useId();

    const [paramType, setParamType] = useState<ParamType>(() => {
        console.log('ParamFrame initialParams:', initialParams);
        return initialParams?.paramType || 'read';
    });
    const [frameDataList, setFrameDataList] = useState<FrameDataInputType[]>(() => {
        if (initialParams?.frameDataList && initialParams.frameDataList.length > 0) {
            return initialParams.frameDataList.map((item: any, index: number) => ({
                ...item,
                id: item.id || (index + 1).toString()
            }));
        }
        return [{ id: '1', point: '', item: '', data: '' }];
    });

    const addFrameData = useCallback(() => {
        const newId = (frameDataList.length + 1).toString();
        setFrameDataList(prev => [...prev, { id: newId, point: '', item: '', data: '' }]);
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

            // 如果是写操作，检查数据内容
            if (paramType === 'write') {
                const hasEmptyData = frameDataList.some(item => !item.data?.trim());
                if (hasEmptyData) {
                    toast.error('设置模式下请填写数据内容');
                    return;
                }
            }

            // 构建 CSGParam 对象
            const frameData = frameDataList.map(({ id, ...rest }) => rest);
            const csgParam: CSGParam = {
                data: frameData,
                type: paramType
            };

            // 调用 WASM 函数生成报文
            const hexString = await generatorCSGParam(csgParam);

            // 将十六进制字符串转换为数字数组
            const hexBytes = hexString.split(' ').filter(hex => hex.length > 0);
            const frame: number[] = hexBytes.map(hex => parseInt(hex, 16));

            // 传递参数给回调函数
            const params = {
                paramType,
                frameDataList: frameDataList.map(({ id, ...rest }) => rest)
            };

            console.log('Saving params:', params);
            onFrameGenerator(frame, params);
            toast.success('报文生成成功');
        } catch (error) {
            console.error('生成报文失败:', error);
            toast.error(`生成报文失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }, [frameDataList, paramType, onFrameGenerator]);

    return (
        <div className="h-full flex flex-col">
            <div className="card bg-base-100 shadow-xl h-full flex flex-col">
                <div className="card-body flex flex-col h-full">
                    <h2 className="card-title text-primary mb-4">参数类</h2>

                    {/* 操作类型选择 - 固定区域 */}
                    <div className="form-control mb-6 shrink-0">
                        <label className="label label-text text-xs">
                            <span className="label-text font-semibold">操作类型</span>
                        </label>
                        <div className="flex gap-4">
                            <label className="label cursor-pointer">
                                <input
                                    type="radio"
                                    name={`paramType-${componentId}`}
                                    className="radio radio-primary"
                                    checked={paramType === 'read'}
                                    onChange={() => setParamType('read')}
                                />
                                <span className="label-text ml-2">读取</span>
                            </label>
                            <label className="label cursor-pointer">
                                <input
                                    type="radio"
                                    name={`paramType-${componentId}`}
                                    className="radio radio-primary"
                                    checked={paramType === 'write'}
                                    onChange={() => setParamType('write')}
                                />
                                <span className="label-text ml-2">设置</span>
                            </label>
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
                                    showDataContent={paramType === 'write'}
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
                            disabled={frameDataList.some(item => !item.point || !item.item)}
                        >
                            {`生成${paramType === 'read' ? '读取' : '设置'}参数报文`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParamFrame;