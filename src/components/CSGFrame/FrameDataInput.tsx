import React from 'react';
import { X } from 'lucide-react';
import type { FrameData } from '../../types/csgframe';

interface FrameDataInputProps {
    frameData: FrameData & { id: string };
    index: number;
    showDataContent?: boolean;
    showRemoveButton?: boolean;
    onUpdate: (id: string, field: keyof FrameData, value: string) => void;
    onRemove?: (id: string) => void;
}

const FrameDataInput: React.FC<FrameDataInputProps> = ({
    frameData,
    index,
    showDataContent = false,
    showRemoveButton = true,
    onUpdate,
    onRemove
}) => {
    return (
        <div className="card bg-base-200 shadow-sm">
            <div className="card-body p-3">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-base-content text-sm">数据项 {index + 1}</h3>
                    {showRemoveButton && onRemove && (
                        <button
                            className="btn btn-xs btn-circle btn-error"
                            onClick={() => onRemove(frameData.id)}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    {/* 测量点和数据标识在一行 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 测量点输入 */}
                        <div className="form-control flex flex-col w-full">
                            <label className="label label-text text-xs">
                                <span className="label-text font-semibold">测量点</span>
                            </label>
                            <input
                                type="text"
                                placeholder="使用英文','或'-'分隔，如1,3,5-6"
                                className="input input-bordered input-primary w-full"
                                value={frameData.point}
                                onChange={(e) => onUpdate(frameData.id, 'point', e.target.value)}
                            />
                        </div>

                        {/* 数据标识输入 */}
                        <div className="form-control flex flex-col w-full">
                            <label className="label label-text text-xs">
                                <span className="label-text font-semibold">数据标识</span>
                            </label>
                            <input
                                type="text"
                                placeholder="使用英文','分割，如E0000130,E0000131"
                                className="input input-bordered input-primary w-full"
                                value={frameData.item}
                                onChange={(e) => onUpdate(frameData.id, 'item', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* 数据内容输入 - 仅在需要时显示 */}
                    {showDataContent && (
                        <div className="form-control flex flex-col w-full">
                            <label className="label label-text text-xs">
                                <span className="label-text font-semibold">数据内容</span>
                            </label>
                            <textarea
                                placeholder="输入数据内容（支持多行）"
                                className="textarea textarea-bordered textarea-secondary w-full"
                                rows={2}
                                value={frameData.data || ''}
                                onChange={(e) => onUpdate(frameData.id, 'data', e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FrameDataInput;