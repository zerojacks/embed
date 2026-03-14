import React, { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Settings, RefreshCw } from 'lucide-react';
import { useWasm } from '../../../contexts/WasmContext';

interface AutoConfigFrameProps {
    onFrameGenerator: (frame: number[], params?: any) => void;
    initialParams?: any;
}

interface ConfigField {
    name: string;
    type: 'input' | 'select' | 'number' | 'datetime' | 'textarea' | 'time' | 'custom-select' | 'bitfield';
    label: string;
    value: string;
    options?: string[];
    required?: boolean;
    placeholder?: string;
    min?: number;
    max?: number;
    timeFormat?: string; // 用于time类型，指定时间格式
    allowCustom?: boolean; // 用于custom-select类型，允许自定义输入
    bitCount?: number; // 用于bitfield类型，指定bit位数量
    bitLabels?: string[]; // 用于bitfield类型，每个bit的标签
}

interface DataItem {
    id: string;
    point: string;
    item: string;
    config?: any;
    fields: ConfigField[];
}

const AutoConfigFrame: React.FC<AutoConfigFrameProps> = ({ onFrameGenerator, initialParams }) => {
    const { getItemConfig } = useWasm();
    const [dataItems, setDataItems] = useState<DataItem[]>(() => {
        if (initialParams?.dataItems && initialParams.dataItems.length > 0) {
            return initialParams.dataItems;
        }
        return [{
            id: '1',
            point: '',
            item: '',
            config: null,
            fields: []
        }];
    });

    const [protocol, setProtocol] = useState<string>(initialParams?.protocol || 'CSG13');
    const [region, setRegion] = useState<string>(initialParams?.region || '南网');
    const [loading, setLoading] = useState<string>(''); // 存储正在加载的item id

    // 解析时间格式，根据value字段确定时间组件
    const parseTimeFormat = useCallback((value: string): string => {
        if (!value) return '';

        // 检查value字段包含的时间格式部分
        const formatParts = [];

        // 对于'ssmmhhDDMMYY'这样的格式，需要按位置解析
        if (value.includes('YY') || value.includes('YYYY') || value.includes('CC')) {
            formatParts.push('年');
        }
        if (value.includes('MM')) {
            formatParts.push('月');
        }
        if (value.includes('DD')) {
            formatParts.push('日');
        }
        if (value.includes('hh') || value.includes('HH')) {
            formatParts.push('时');
        }
        if (value.includes('mm')) {
            formatParts.push('分');
        }
        if (value.includes('ss')) {
            formatParts.push('秒');
        }

        return formatParts.join('');
    }, []);

    // 根据时间格式生成对应的输入类型
    const getTimeInputType = useCallback((timeFormat: string): string => {
        if (timeFormat.includes('年') && timeFormat.includes('月') && timeFormat.includes('日')) {
            if (timeFormat.includes('时') && timeFormat.includes('分')) {
                return 'datetime-local';
            } else {
                return 'date';
            }
        } else if (timeFormat.includes('时') && timeFormat.includes('分')) {
            return 'time';
        }
        return 'text';
    }, []);

    // 重新设计的递归解析系统
    const parseXmlConfig = useCallback((xmlConfig: any): ConfigField[] => {
        const fields: ConfigField[] = [];

        if (!xmlConfig) {
            return fields;
        }

        // 定义每种XML节点类型对应的控件处理器
        const nodeProcessors = {
            // 处理splitbit节点 - 生成bit位控件
            splitbit: (element: any, path: string) => {
                const nameElement = element.children?.find((child: any) => child.name === 'name');
                const label = nameElement?.value || 'Bit字段';
                
                const bitElements = element.children?.filter((child: any) => child.name === 'bit') || [];
                const bitLabels: string[] = [];
                
                bitElements.forEach((bitElement: any, index: number) => {
                    const bitNameElement = bitElement.children?.find((child: any) => child.name === 'name');
                    const bitLabel = bitNameElement?.value || `Bit ${index}`;
                    const bitDescElement = bitElement.children?.find((child: any) => child.name === 'desc');
                    const bitDesc = bitDescElement?.value || '';
                    bitLabels.push(`${bitLabel}${bitDesc ? ` (${bitDesc})` : ''}`);
                });

                fields.push({
                    name: `${path}_splitbit`,
                    type: 'bitfield',
                    label: label,
                    value: '0'.repeat(bitElements.length),
                    bitCount: bitElements.length,
                    bitLabels: bitLabels,
                    required: false
                });
            },

            // 处理splitByLength节点 - 生成动态字段控件
            splitByLength: (element: any, path: string) => {
                const nameElement = element.children?.find((child: any) => child.name === 'name');
                const label = nameElement?.value || '动态字段';
                
                const lengthElement = element.children?.find((child: any) => child.name === 'length');
                const typeElement = element.children?.find((child: any) => child.name === 'type');
                const timeElement = element.children?.find((child: any) => child.name === 'time');
                const valueElements = element.children?.filter((child: any) => child.name === 'value') || [];

                // 时间类型
                if (timeElement && timeElement.value) {
                    const timeFormat = parseTimeFormat(timeElement.value);
                    fields.push({
                        name: `${path}_time`,
                        type: 'time',
                        label: label,
                        value: '',
                        timeFormat: timeFormat,
                        placeholder: '请选择时间',
                        required: true
                    });
                }
                // 选择类型
                else if (valueElements.length > 0) {
                    const options = valueElements.map((valueEl: any) => valueEl.attributes?.key || valueEl.value).filter(Boolean);
                    fields.push({
                        name: `${path}_select`,
                        type: 'custom-select',
                        label: label,
                        value: '',
                        options: options,
                        allowCustom: true,
                        placeholder: '请选择或输入自定义值',
                        required: true
                    });
                }
                // 数值类型
                else {
                    const type = typeElement?.value || 'BIN';
                    const length = lengthElement?.value;
                    
                    if (type === 'PN' || type === 'ITEM') {
                        fields.push({
                            name: `${path}_textarea`,
                            type: 'textarea',
                            label: label,
                            value: '',
                            placeholder: type === 'PN' ? '使用英文\',\'或\'-\'分隔，如1,3,5-6' : '使用英文\',\'分割，如E0000130,E0000131',
                            required: true
                        });
                    } else if (length && ['1', '2'].includes(length)) {
                        fields.push({
                            name: `${path}_number`,
                            type: 'number',
                            label: label,
                            value: '',
                            min: 0,
                            max: length === '1' ? 255 : 65535,
                            placeholder: '请输入数值',
                            required: true
                        });
                    } else {
                        fields.push({
                            name: `${path}_input`,
                            type: 'input',
                            label: label,
                            value: '',
                            placeholder: '请输入值',
                            required: true
                        });
                    }
                }
            },

            // 处理基本dataItem节点 - 生成基础控件
            dataItem: (element: any, path: string) => {
                const nameElement = element.children?.find((child: any) => child.name === 'name');
                const label = nameElement?.value || '数据项';
                
                const lengthElement = element.children?.find((child: any) => child.name === 'length');
                const unitElement = element.children?.find((child: any) => child.name === 'unit');
                const decimalElement = element.children?.find((child: any) => child.name === 'decimal');
                const timeElement = element.children?.find((child: any) => child.name === 'time');

                // 时间类型 - 优先处理
                if (timeElement && timeElement.value) {
                    const timeFormat = parseTimeFormat(timeElement.value);
                    fields.push({
                        name: `${path}_time`,
                        type: 'time',
                        label: label,
                        value: '',
                        timeFormat: timeFormat,
                        placeholder: '请选择时间',
                        required: true
                    });
                    return; // 时间类型处理完毕，不再处理其他属性
                }

                // 数值类型
                const length = lengthElement?.value;
                const unit = unitElement?.value;
                const decimal = decimalElement?.value;
                
                let placeholder = '请输入值';
                if (unit) placeholder += ` (单位: ${unit})`;
                if (decimal) placeholder += ` (小数位: ${decimal})`;

                if (length) {
                    const lengthNum = parseInt(length);
                    if (lengthNum <= 2) {
                        fields.push({
                            name: `${path}_number`,
                            type: 'number',
                            label: label,
                            value: '',
                            min: 0,
                            max: lengthNum === 1 ? 255 : 65535,
                            placeholder: placeholder,
                            required: true
                        });
                    } else {
                        fields.push({
                            name: `${path}_input`,
                            type: 'input',
                            label: label,
                            value: '',
                            placeholder: placeholder,
                            required: true
                        });
                    }
                } else {
                    fields.push({
                        name: `${path}_input`,
                        type: 'input',
                        label: label,
                        value: '',
                        placeholder: placeholder,
                        required: true
                    });
                }
            }
        };

        // 递归处理XML节点
        const processElement = (element: any, path: string = 'root') => {
            if (!element) return;

            // 根据节点名称选择对应的处理器
            const processor = nodeProcessors[element.name as keyof typeof nodeProcessors];
            if (processor) {
                processor(element, path);
            }

            // 递归处理子节点
            if (element.children && Array.isArray(element.children)) {
                element.children.forEach((child: any, index: number) => {
                    const childPath = `${path}_${child.name || 'item'}_${index}`;
                    processElement(child, childPath);
                });
            }
        };

        // 开始递归处理
        processElement(xmlConfig);

        return fields;
    }, [parseTimeFormat]);

    // 获取数据项配置
    const fetchItemConfig = useCallback(async (itemId: string, dataItemId: string) => {
        if (!itemId.trim()) {
            return;
        }

        setLoading(dataItemId);
        try {
            const configJson = await getItemConfig(itemId, protocol, region);
            const config = JSON.parse(configJson);

            console.log('配置数据:', config);
            // 解析配置生成表单字段
            const fields = parseXmlConfig(config);

            setDataItems(prev => prev.map(item =>
                item.id === dataItemId
                    ? { ...item, config, fields }
                    : item
            ));
            console.log('生成的字段:', fields);
            toast.success(`数据项 ${itemId} 配置加载成功`);
        } catch (error) {
            console.error('获取配置失败:', error);
            toast.error(`获取配置失败: ${error instanceof Error ? error.message : '未知错误'}`);

            // 清空配置
            setDataItems(prev => prev.map(item =>
                item.id === dataItemId
                    ? { ...item, config: null, fields: [] }
                    : item
            ));
        } finally {
            setLoading('');
        }
    }, [getItemConfig, protocol, region, parseXmlConfig]);

    // 其他函数保持不变...
    const addDataItem = useCallback(() => {
        const newId = (dataItems.length + 1).toString();
        setDataItems(prev => [...prev, {
            id: newId,
            point: '',
            item: '',
            config: null,
            fields: []
        }]);
    }, [dataItems.length]);

    const removeDataItem = useCallback((id: string) => {
        if (dataItems.length > 1) {
            setDataItems(prev => prev.filter(item => item.id !== id));
        }
    }, [dataItems.length]);

    const updateDataItem = useCallback((id: string, field: 'point' | 'item', value: string) => {
        setDataItems(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));

        if (field === 'item' && value.trim()) {
            fetchItemConfig(value, id);
        }
    }, [fetchItemConfig]);

    const updateConfigField = useCallback((itemId: string, fieldName: string, value: string) => {
        setDataItems(prev => prev.map(item =>
            item.id === itemId
                ? {
                    ...item,
                    fields: item.fields.map(field =>
                        field.name === fieldName ? { ...field, value } : field
                    )
                }
                : item
        ));
    }, []);

    const generateFrame = useCallback(async () => {
        try {
            const hasEmptyRequired = dataItems.some(item =>
                !item.point.trim() || !item.item.trim() ||
                item.fields.some(field => field.required && !field.value.trim())
            );

            if (hasEmptyRequired) {
                toast.error('请填写所有必填字段');
                return;
            }

            const params = {
                protocol,
                region,
                dataItems: dataItems.map(item => ({
                    point: item.point,
                    item: item.item,
                    config: item.config,
                    fieldValues: item.fields.reduce((acc, field) => {
                        acc[field.name] = field.value;
                        return acc;
                    }, {} as Record<string, string>)
                }))
            };

            const mockFrame = [0x68, 0x01, 0x02, 0x03, 0x16];
            onFrameGenerator(mockFrame, params);
            toast.success('自动配置报文生成成功');

        } catch (error) {
            console.error('生成报文失败:', error);
            toast.error(`生成报文失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }, [dataItems, protocol, region, onFrameGenerator]);

    // 渲染配置字段
    const renderConfigField = useCallback((field: ConfigField, itemId: string) => {
        const commonProps = {
            className: "input input-bordered input-primary w-full",
            value: field.value,
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                updateConfigField(itemId, field.name, e.target.value)
        };

        switch (field.type) {
            case 'time':
                return (
                    <div className="space-y-2">
                        {field.timeFormat?.includes('秒') ? (
                            <div className="space-y-2">
                                <input
                                    type="datetime-local"
                                    className="input input-bordered input-primary w-full"
                                    value={field.value.split(':')[0] || ''}
                                    onChange={(e) => {
                                        const seconds = field.value.split(':')[1] || '00';
                                        updateConfigField(itemId, field.name, `${e.target.value}:${seconds}`);
                                    }}
                                    placeholder="选择日期和时间"
                                />
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">秒:</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="59"
                                        className="input input-bordered input-primary w-20"
                                        value={field.value.split(':')[1] || ''}
                                        onChange={(e) => {
                                            const datetime = field.value.split(':')[0] || '';
                                            const seconds = e.target.value.padStart(2, '0');
                                            updateConfigField(itemId, field.name, `${datetime}:${seconds}`);
                                        }}
                                        placeholder="00"
                                    />
                                </div>
                            </div>
                        ) : (
                            <input
                                {...commonProps}
                                type={getTimeInputType(field.timeFormat || '')}
                                placeholder={field.placeholder}
                            />
                        )}
                        {field.timeFormat && (
                            <div className="text-xs text-base-content/60">
                                格式: {field.timeFormat}
                            </div>
                        )}
                    </div>
                );

            case 'bitfield':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <button
                                type="button"
                                className="btn btn-xs btn-outline"
                                onClick={() => {
                                    const allZeros = '0'.repeat(field.bitCount || 0);
                                    updateConfigField(itemId, field.name, allZeros);
                                }}
                            >
                                全部清零
                            </button>
                            <button
                                type="button"
                                className="btn btn-xs btn-outline"
                                onClick={() => {
                                    const allOnes = '1'.repeat(field.bitCount || 0);
                                    updateConfigField(itemId, field.name, allOnes);
                                }}
                            >
                                全部置一
                            </button>
                            <span className="text-xs text-base-content/60">
                                共 {field.bitCount} 位
                            </span>
                        </div>
                        
                        <div className="max-h-60 overflow-y-auto border border-base-300 rounded-lg p-3">
                            <div className="grid grid-cols-1 gap-2">
                                {field.bitLabels?.map((label, index) => {
                                    const bitValue = field.value[index] || '0';
                                    return (
                                        <div key={index} className="flex items-center justify-between p-2 hover:bg-base-200 rounded">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-base-content/60 w-8">
                                                    {index}:
                                                </span>
                                                <span className="text-sm flex-1">
                                                    {label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    className="toggle toggle-primary toggle-sm"
                                                    checked={bitValue === '1'}
                                                    onChange={(e) => {
                                                        const newValue = field.value.split('');
                                                        newValue[index] = e.target.checked ? '1' : '0';
                                                        updateConfigField(itemId, field.name, newValue.join(''));
                                                    }}
                                                />
                                                <span className="text-xs font-mono w-4">
                                                    {bitValue}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        
                        <div className="text-xs text-base-content/60">
                            <div>当前值: {field.value}</div>
                            <div>十六进制: {parseInt(field.value, 2).toString(16).toUpperCase().padStart(Math.ceil((field.bitCount || 0) / 4), '0')}</div>
                        </div>
                    </div>
                );

            // 其他控件类型...
            default:
                return (
                    <input
                        {...commonProps}
                        type="text"
                        placeholder={field.placeholder}
                    />
                );
        }
    }, [updateConfigField, getTimeInputType]);

    return (
        <div className="h-full flex flex-col">
            <div className="card bg-base-100 shadow-xl h-full flex flex-col">
                <div className="card-body flex flex-col h-full">
                    <h2 className="card-title text-primary mb-4">自动配置报文生成器 (新版)</h2>

                    {/* 协议和区域选择 */}
                    <div className="shrink-0 mb-6 space-y-4 px-2">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="form-control flex flex-col w-full">
                                <label className="label label-text text-xs">
                                    <span className="label-text font-semibold">协议类型</span>
                                </label>
                                <select
                                    className="select select-bordered select-primary w-full"
                                    value={protocol}
                                    onChange={(e) => setProtocol(e.target.value)}
                                >
                                    <option value="CSG13">CSG13</option>
                                    <option value="CSG16">CSG16</option>
                                    <option value="DLT/645-2007">DLT/645-2007</option>
                                </select>
                            </div>

                            <div className="form-control flex flex-col w-full">
                                <label className="label label-text text-xs">
                                    <span className="label-text font-semibold">区域</span>
                                </label>
                                <select
                                    className="select select-bordered select-primary w-full"
                                    value={region}
                                    onChange={(e) => setRegion(e.target.value)}
                                >
                                    <option value="南网">南网</option>
                                    <option value="国网">国网</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 数据项列表 */}
                    <div className="flex-1 overflow-auto mb-6">
                        <div className="space-y-6 pr-2">
                            {dataItems.map((dataItem, index) => (
                                <div key={dataItem.id} className="card bg-base-200 shadow-sm">
                                    <div className="card-body p-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-semibold text-base-content text-sm">
                                                数据项 {index + 1}
                                            </h3>
                                            {dataItems.length > 1 && (
                                                <button
                                                    className="btn btn-xs btn-circle btn-error"
                                                    onClick={() => removeDataItem(dataItem.id)}
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>

                                        {/* 基本信息 */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                                            <div className="form-control flex flex-col w-full">
                                                <label className="label label-text text-xs">
                                                    <span className="label-text font-semibold">测量点</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="使用英文','或'-'分隔，如1,3,5-6"
                                                    className="input input-bordered input-primary w-full"
                                                    value={dataItem.point}
                                                    onChange={(e) => updateDataItem(dataItem.id, 'point', e.target.value)}
                                                />
                                            </div>

                                            <div className="form-control flex flex-col w-full">
                                                <label className="label label-text text-xs">
                                                    <span className="label-text font-semibold">数据标识</span>
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="如E0000130"
                                                        className="input input-bordered input-primary w-full"
                                                        value={dataItem.item}
                                                        onChange={(e) => updateDataItem(dataItem.id, 'item', e.target.value)}
                                                    />
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => fetchItemConfig(dataItem.item, dataItem.id)}
                                                        disabled={!dataItem.item.trim() || loading === dataItem.id}
                                                    >
                                                        {loading === dataItem.id ? (
                                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Settings className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 动态配置字段 */}
                                        {dataItem.fields.length > 0 && (
                                            <div className="border-t border-base-300 pt-4">
                                                <h4 className="font-medium text-sm mb-3 text-base-content/80">
                                                    配置参数
                                                </h4>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {dataItem.fields.map((field) => (
                                                        <div key={field.name} className="form-control flex flex-col w-full">
                                                            <label className="label label-text text-xs">
                                                                <span className="label-text font-semibold">
                                                                    {field.label}
                                                                    {field.required && <span className="text-error ml-1">*</span>}
                                                                </span>
                                                            </label>
                                                            {renderConfigField(field, dataItem.id)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 配置状态提示 */}
                                        {dataItem.item && !dataItem.config && loading !== dataItem.id && (
                                            <div className="alert alert-warning mt-4">
                                                <span className="text-sm">
                                                    请点击设置按钮获取 {dataItem.item} 的配置信息
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="shrink-0 space-y-3">
                        <button
                            className="btn btn-outline btn-primary w-full"
                            onClick={addDataItem}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            添加数据项
                        </button>

                        <button
                            className="btn btn-primary w-full"
                            onClick={generateFrame}
                            disabled={dataItems.some(item =>
                                !item.point.trim() || !item.item.trim() ||
                                item.fields.some(field => field.required && !field.value.trim())
                            )}
                        >
                            生成自动配置报文
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AutoConfigFrame;