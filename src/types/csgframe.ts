export type ParamType = 'read' | 'write';

export const DataDensity = {
    1: "1分钟",
    2: "5分钟",
    3: "15分钟",
    4: "30分钟",
    5: "60分钟",
    6: "日",
    7: "月"
} as const;

export type DataDensityKey = keyof typeof DataDensity;

export type AEType = 'alarm' | 'event';

export interface FrameData {
    point: string;
    item: string;
    data?: string;
}
export interface CSGParam {
    data: FrameData[];
    type: ParamType;
}

export interface CSGCurrentDataFrame {
    data: FrameData[];
}

export interface CSGHistoryDataFrame {
    data: FrameData[];
    startTime: number;
    endTime: number;
    dataDensity: DataDensityKey;
}

export interface CSGAlarmEventFrame {
    data: FrameData[];
    startTime: number;
    endTime: number;
    type: AEType;
}

export interface NormalTaskParam {
    task_id: number; // 任务号 0xE0000300+id
    valid_flag: boolean; // 有效标识，0：无效，1-有效
    report_base_time: number; // 上报基准时间 YYMMDDhhmm
    report_unit: number; // 定时上报周期单位 0-分钟，1-小时，2-日，3-月
    report_cycle: number; // 上报周期 
    data_struct: number; // 数据结构方式：0-自描述格式组织数据 1-按任务定义数据格式 3-自定义
    read_base_time: number; // 采样基准时间 YYMMDDhhmm
    read_unit: number; // 定时采样周期单位 0-分钟，1-小时，2-日，3-月
    read_cycle: number; // 定时采样周期
    data_rate: number;//数据抽取倍率
    exec_count: number;//执行次数
    points: string;//信息点标识
    items: string;//数据标识编码
}

export interface MeterTaskParam {
    task_id: number; // 任务号 0xE0001500+id
    valid_flag: boolean; // 有效标识，0：无效，1-有效
    report_base_time: number; // 上报基准时间 YYMMDDhhmm
    report_unit: number; // 定时上报周期单位 0-分钟，1-小时，2-日，3-月
    report_cycle: number; // 上报周期 
    data_struct: number; // 数据结构方式：0-自描述格式组织数据 1-按任务定义数据格式 3-自定义
    meter_read_base_time: number; // 表端采样基准时间 YYMMDDhhmm
    meter_read_unit: number; // 表端定时采样周期单位 0-分钟，1-小时，2-日，3-月
    meter_read_cycle: number; // 表端定时采样周期
    data_rate: number;//数据抽取倍率
    read_base_time: number; // 终端采样基准时间 YYMMDDhhmm
    read_unit: number; // 终端定时查询周期单位 0-分钟，1-小时，2-日，3-月
    read_cycle: number; // 终端定时查询周期
    exec_count: number;//执行次数
    points: string;//信息点标识
    items: string;//数据标识编码
}

export interface WaveRecordParam {
    alarm_id: number;
    points: string;
    wave_type: number;
    time: string;
    start_idx?: number;
}