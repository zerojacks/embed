import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Copy, Trash2, ArrowLeft, Binary } from 'lucide-react';

const BitManipulationPage: React.FC = () => {
    const [hexInput, setHexInput] = useState('');
    const [isLittleEndian, setIsLittleEndian] = useState(true);
    const [batchBitInput, setBatchBitInput] = useState('');
    const [batchBitValue, setBatchBitValue] = useState<1 | 0>(1);

    const bytes = useMemo(() => {
        const cleanHex = hexInput.replace(/\s+/g, '');
        if (cleanHex.length % 2 !== 0) return [];
        const result: number[] = [];
        for (let i = 0; i < cleanHex.length; i += 2) {
            result.push(parseInt(cleanHex.substr(i, 2), 16));
        }
        return result;
    }, [hexInput]);

    const handleBitToggle = (byteIdx: number, bitIdx: number) => {
        const newBytes = [...bytes];
        newBytes[byteIdx] ^= (1 << bitIdx);
        setHexInput(newBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' '));
    };

    const applyBatchManipulation = () => {
        if (bytes.length === 0) {
            toast.error('请先输入有效的十六进制数据');
            return;
        }

        const newBytes = [...bytes];
        const bitParts = batchBitInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
        let count = 0;

        try {
            bitParts.forEach(part => {
                if (part.includes('-')) {
                    const [start, end] = part.split('-').map(s => parseInt(s.trim()));
                    if (isNaN(start) || isNaN(end)) throw new Error('无效的范围格式');
                    const min = Math.min(start, end);
                    const max = Math.max(start, end);
                    for (let i = min; i <= max; i++) {
                        applyToGlobalBit(newBytes, i, batchBitValue);
                        count++;
                    }
                } else {
                    const bitIdx = parseInt(part);
                    if (isNaN(bitIdx)) throw new Error('无效的数字格式');
                    applyToGlobalBit(newBytes, bitIdx, batchBitValue);
                    count++;
                }
            });

            setHexInput(newBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' '));
            toast.success(`成功操作 ${count} 个位`);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : '解析位范围失败');
        }
    };

    const applyToGlobalBit = (newBytes: number[], globalIdx: number, value: 1 | 0) => {
        const totalBits = newBytes.length * 8;
        if (globalIdx < 0 || globalIdx >= totalBits) return;

        let byteIdx: number;
        let bitOffset: number;

        if (isLittleEndian) {
            byteIdx = Math.floor(globalIdx / 8);
            bitOffset = globalIdx % 8;
        } else {
            const globalByteOffset = Math.floor(globalIdx / 8);
            byteIdx = newBytes.length - 1 - globalByteOffset;
            bitOffset = globalIdx % 8;
        }

        if (value === 1) {
            newBytes[byteIdx] |= (1 << bitOffset);
        } else {
            newBytes[byteIdx] &= ~(1 << bitOffset);
        }
    };

    const setAllBits = (value: 1 | 0) => {
        const newBytes = bytes.map(() => value === 1 ? 0xFF : 0x00);
        setHexInput(newBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' '));
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('已复制到剪贴板');
    };

    const formatHex = (hex: string) => {
        return hex.replace(/\s+/g, '').replace(/(..)/g, '$1 ').trim().toUpperCase();
    };

    const displayBytes = useMemo(() => {
        return isLittleEndian ? bytes.map((b, i) => ({ b, i })) : [...bytes].reverse().map((b, i) => ({ b, i: bytes.length - 1 - i }));
    }, [bytes, isLittleEndian]);

    return (
        <div className="h-full flex flex-col overflow-hidden bg-base-200/30">
            {/* Header */}
            <div className="shrink-0 p-4 border-b border-base-300 bg-base-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/tools" className="btn btn-ghost btn-sm btn-circle">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <Binary className="w-6 h-6 text-primary" />
                                位操作工具
                            </h1>
                            <p className="text-xs text-base-content/60">
                                对十六进制数据进行位级别的查看、设置和清空
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Input Section */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="card bg-base-100 shadow-xl border border-base-300">
                            <div className="card-body">
                                <h2 className="card-title text-sm uppercase tracking-widest text-base-content/50">输入数据</h2>
                                <div className="form-control w-full">
                                    <textarea
                                        className="textarea textarea-bordered font-mono h-32 w-full"
                                        placeholder="输入十六进制字符串，例如: 01 02 AA BB"
                                        value={hexInput}
                                        onChange={(e) => setHexInput(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className="btn btn-outline btn-sm flex-1"
                                        onClick={() => setHexInput(formatHex(hexInput))}
                                    >
                                        格式化
                                    </button>
                                    <button
                                        className="btn btn-outline btn-error btn-sm"
                                        onClick={() => setHexInput('')}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-xl border border-base-300">
                            <div className="card-body">
                                <h2 className="card-title text-sm uppercase tracking-widest text-base-content/50">批量位操作</h2>
                                <div className="form-control w-full space-y-3">
                                    <div className="join w-full">
                                        <input
                                            type="text"
                                            className="input input-bordered join-item flex-1 min-w-0"
                                            placeholder="位范围 (如: 1,3-5,8)"
                                            value={batchBitInput}
                                            onChange={(e) => setBatchBitInput(e.target.value)}
                                        />
                                        <select 
                                            className="select select-bordered join-item w-24 px-2"
                                            value={batchBitValue}
                                            onChange={(e) => setBatchBitValue(parseInt(e.target.value) as 1 | 0)}
                                        >
                                            <option value={1}>置 1</option>
                                            <option value={0}>清 0</option>
                                        </select>
                                        <button 
                                            className="btn btn-primary join-item px-6"
                                            onClick={applyBatchManipulation}
                                        >
                                            执行
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-base-content/50 px-1">
                                        支持逗号分隔数字或范围，如 0,2-4,15
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-xl border border-base-300">
                            <div className="card-body">
                                <h2 className="card-title text-sm uppercase tracking-widest text-base-content/50">快速操作</h2>
                                <div className="flex flex-wrap gap-2">
                                    <button className="btn btn-sm btn-primary flex-1" onClick={() => setAllBits(1)}>全置 1</button>
                                    <button className="btn btn-sm btn-outline flex-1" onClick={() => setAllBits(0)}>全清 0</button>
                                </div>
                                <div className="divider"></div>
                                <div className="form-control">
                                    <label className="label cursor-pointer justify-start gap-4">
                                        <span className="label-text font-bold">小端序 (Little Endian)</span>
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary"
                                            checked={isLittleEndian}
                                            onChange={(e) => setIsLittleEndian(e.target.checked)}
                                        />
                                    </label>
                                    <p className="text-xs text-base-content/60">
                                        {isLittleEndian ? '第一个字节为低字节 (LSB)' : '第一个字节为高字节 (MSB)'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Result Section Moved to Left */}
                        {bytes.length > 0 && (
                            <div className="card bg-primary text-primary-content shadow-xl border border-primary/20">
                                <div className="card-body p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-sm uppercase tracking-widest opacity-70">最终结果</h2>
                                        <button
                                            className="btn btn-ghost btn-xs btn-circle text-primary-content"
                                            onClick={() => copyToClipboard(formatHex(hexInput))}
                                            title="复制结果"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="font-mono text-base font-bold break-all bg-black/10 p-3 rounded-lg border border-white/10">
                                        {formatHex(hexInput)}
                                    </div>
                                    <p className="text-[10px] opacity-60 mt-2">点击右上方图标可复制完整十六进制字符串</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bit Grid Section */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="card bg-base-100 shadow-xl border border-base-300 h-full">
                            <div className="card-body">
                                <h2 className="card-title text-sm uppercase tracking-widest text-base-content/50">位可视化 (点击切换)</h2>
                                {bytes.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-base-content/30 py-12">
                                        <Binary className="w-16 h-16 mb-4 opacity-20" />
                                        <p>请输入有效的十六进制数据</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {displayBytes.map(({ b: byte, i: originalIdx }, displayIdx) => (
                                                <div key={displayIdx} className="p-4 bg-base-200 rounded-xl space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-mono font-bold text-primary">Byte {originalIdx}</span>
                                                        <span className="font-mono text-sm opacity-60">0x{byte.toString(16).padStart(2, '0').toUpperCase()}</span>
                                                    </div>
                                                    <div className="grid grid-cols-8 gap-1">
                                                        {[7, 6, 5, 4, 3, 2, 1, 0].map(bitOffset => {
                                                            const isOn = (byte & (1 << bitOffset)) !== 0;
                                                            // Calculate global bit index based on endianness
                                                            // LE: Byte 0 has bits 0-7
                                                            // BE: Last byte has bits 0-7
                                                            const globalBitIdx = isLittleEndian 
                                                                ? (originalIdx * 8 + bitOffset)
                                                                : ((bytes.length - 1 - originalIdx) * 8 + bitOffset);

                                                            return (
                                                                <button
                                                                    key={bitOffset}
                                                                    onClick={() => handleBitToggle(originalIdx, bitOffset)}
                                                                    className={`btn btn-xs h-10 p-0 flex flex-col gap-0 ${isOn ? 'btn-primary' : 'btn-ghost border border-base-300'}`}
                                                                    title={`Global Bit ${globalBitIdx}`}
                                                                >
                                                                    <span className="text-[10px] opacity-60">{globalBitIdx}</span>
                                                                    <span className="font-bold">{isOn ? '1' : '0'}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BitManipulationPage;
