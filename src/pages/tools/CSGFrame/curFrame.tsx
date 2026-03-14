import React, { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { useWasm } from '../../../contexts/WasmContext';
import FrameDataInput from '../../../components/CSGFrame/FrameDataInput';
import type { CSGCurrentDataFrame, FrameData } from '../../../types/csgframe';

interface CurFrameProps {
    onFrameGenerator: (frame: number[], params?: any) => void;
    initialParams?: any;
}

interface FrameDataInputType extends FrameData {
    id: string;
}

const CurFrame: React.FC<CurFrameProps> = ({ onFrameGenerator, initialParams }) => {
    const { generatorCSGReadCur } = useWasm();
    const [frameDataList, setFrameDataList] = useState<FrameDataInputType[]>(() => {
        if (initialParams?.frameDataList && initialParams.frameDataList.length > 0) {
            return initialParams.frameDataList.map((item: any, index: number) => ({
                ...item,
                id: item.id || (index + 1).toString()
            }));
        }
        return [{ id: '1', point: '', item: '' }];
    });

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

            // 构建 CSGCurrentDataFrame 对象
            const frameData = frameDataList.map(({ id, ...rest }) => rest);
            const csgCurrentData: CSGCurrentDataFrame = {
                data: frameData
            };

            // 调用 WASM 函数生成报文
            const hexString = await generatorCSGReadCur(csgCurrentData);

            if (!hexString) {
                toast.error('生成报文失败：返回数据为空');
                return;
            }

            // 将十六进制字符串转换为数字数组
            const hexBytes = hexString.split(' ').filter(hex => hex.length > 0);
            const frame: number[] = hexBytes.map(hex => parseInt(hex, 16));

            // 传递参数给回调函数
            const params = {
                frameDataList: frameDataList.map(({ id, ...rest }) => rest)
            };

            onFrameGenerator(frame, params);
            toast.success('当前数据读取报文生成成功');
        } catch (error) {
            console.error('生成当前数据读取报文失败:', error);
            toast.error(`生成报文失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }, [frameDataList, generatorCSGReadCur, onFrameGenerator]);

    return (
        <div className="h-full flex flex-col">
            <div className="card bg-base-100 shadow-xl h-full flex flex-col">
                <div className="card-body flex flex-col h-full">
                    <h2 className="card-title text-primary mb-4">当前数据读取</h2>

                    {/* 数据项列表 - 可滚动区域 */}
                    <div className="flex-1 overflow-auto mb-6">
                        <div className="space-y-4 pr-2 px-2">
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
                            disabled={frameDataList.some(item => !item.point || !item.item)}
                        >
                            生成当前数据读取报文
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CurFrame;