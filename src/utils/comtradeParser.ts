export interface ComtradeConfig {
  stationName: string;
  recordingDeviceId: string;
  revYear: string;
  totalChannels: number;
  analogChannelsCount: number;
  digitalChannelsCount: number;
  analogChannels: AnalogChannel[];
  digitalChannels: DigitalChannel[];
  lineFrequency: number;
  rates: SampleRate[];
  startTime: string;
  triggerTime: string;
  startTimeDate: Date | null;
  triggerTimeDate: Date | null;
  fileType: 'ASCII' | 'BINARY' | 'BINARY32' | 'FLOAT32';
  timeMultiplier: number;
}

export interface AnalogChannel {
  index: number;
  name: string;
  phase: string;
  component: string;
  unit: string;
  a: number; // multiplier
  b: number; // offset
  skew: number;
  min: number;
  max: number;
  primary: number;
  secondary: number;
  ps: string; // primary/secondary scaling
}

export interface DigitalChannel {
  index: number;
  name: string;
  phase: string;
  component: string;
  normalState: number;
}

export interface SampleRate {
  rate: number;
  endSample: number;
}

export interface ComtradeData {
  sampleNumber: number;
  timestamp: number; // in microseconds usually
  timestampStr?: string; // formatted timestamp if startTime is available
  analogValues: number[]; // real values (a*x + b)
  digitalValues: number[]; // 0 or 1
}

export function parseComtradeCfg(content: string): ComtradeConfig {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length < 3) throw new Error("无效的 .cfg 文件内容");

  const [stationName, recordingDeviceId, revYear = "1991"] = lines[0].split(',').map(s => s.trim());
  
  const counts = lines[1].split(',').map(s => s.trim());
  const totalChannels = parseInt(counts[0], 10);
  const analogChannelsCount = parseInt(counts[1].replace(/A/i, ''), 10);
  const digitalChannelsCount = parseInt(counts[2].replace(/D/i, ''), 10);

  let currentLine = 2;
  const analogChannels: AnalogChannel[] = [];
  for (let i = 0; i < analogChannelsCount; i++) {
    const parts = lines[currentLine++].split(',').map(s => s.trim());
    analogChannels.push({
      index: parseInt(parts[0], 10),
      name: parts[1] || `A${i+1}`,
      phase: parts[2] || '',
      component: parts[3] || '',
      unit: parts[4] || '',
      a: parseFloat(parts[5] || '1'),
      b: parseFloat(parts[6] || '0'),
      skew: parseFloat(parts[7] || '0'),
      min: parseInt(parts[8] || '-32767', 10),
      max: parseInt(parts[9] || '32767', 10),
      primary: parseFloat(parts[10] || '1'),
      secondary: parseFloat(parts[11] || '1'),
      ps: parts[12] || 'P'
    });
  }

  const digitalChannels: DigitalChannel[] = [];
  for (let i = 0; i < digitalChannelsCount; i++) {
    const parts = lines[currentLine++].split(',').map(s => s.trim());
    digitalChannels.push({
      index: parseInt(parts[0], 10),
      name: parts[1] || `D${i+1}`,
      phase: parts[2] || '',
      component: parts[3] || '',
      normalState: parseInt(parts[4] || '0', 10)
    });
  }

  const lineFrequency = parseFloat(lines[currentLine++] || '50');
  
  const nrates = parseInt(lines[currentLine++] || '1', 10);
  const rates: SampleRate[] = [];
  for (let i = 0; i < nrates; i++) {
    const parts = lines[currentLine++].split(',').map(s => s.trim());
    rates.push({
      rate: parseFloat(parts[0]),
      endSample: parseInt(parts[1], 10)
    });
  }

  const startTime = lines[currentLine++] || '';
  const triggerTime = lines[currentLine++] || '';

  // 解析时间字符串为 Date 对象 (格式通常为 dd/mm/yyyy,HH:MM:SS.ssssss 或 mm/dd/yyyy)
  // 为了安全起见，尝试解析标准格式，如果失败则返回 null
  const parseComtradeTime = (timeStr: string): Date | null => {
    try {
      if (!timeStr) return null;
      const [datePart, timePart] = timeStr.split(',');
      if (!datePart || !timePart) return null;
      const dateParts = datePart.split('/');
      // 假设格式为 dd/mm/yyyy
      let year, month, day;
      if (dateParts.length === 3) {
         if (dateParts[2].length === 4) {
             day = parseInt(dateParts[0], 10);
             month = parseInt(dateParts[1], 10) - 1;
             year = parseInt(dateParts[2], 10);
         } else {
             // 可能是 yyyy/mm/dd (非标准)
             year = parseInt(dateParts[0], 10);
             month = parseInt(dateParts[1], 10) - 1;
             day = parseInt(dateParts[2], 10);
         }
      } else {
          return null;
      }
      
      const [hms, us] = timePart.split('.');
      const [hour, min, sec] = hms.split(':').map(Number);
      
      return new Date(Date.UTC(year, month, day, hour, min, sec, us ? parseInt(us.substring(0, 3), 10) : 0));
    } catch {
      return null;
    }
  };

  const startTimeDate = parseComtradeTime(startTime);
  const triggerTimeDate = parseComtradeTime(triggerTime);
  
  const fileTypeStr = (lines[currentLine++] || 'ASCII').toUpperCase();
  let fileType: ComtradeConfig['fileType'] = 'ASCII';
  if (fileTypeStr.includes('BINARY32')) fileType = 'BINARY32';
  else if (fileTypeStr.includes('FLOAT32')) fileType = 'FLOAT32';
  else if (fileTypeStr.includes('BINARY')) fileType = 'BINARY';
  
  const timeMultiplier = parseFloat(lines[currentLine] || '1');

  return {
    stationName,
    recordingDeviceId,
    revYear,
    totalChannels,
    analogChannelsCount,
    digitalChannelsCount,
    analogChannels,
    digitalChannels,
    lineFrequency,
    rates,
    startTime,
    triggerTime,
    startTimeDate,
    triggerTimeDate,
    fileType,
    timeMultiplier
  };
}

export function parseComtradeDatAscii(content: string, config: ComtradeConfig): ComtradeData[] {
  if (config.fileType !== 'ASCII') {
    throw new Error(`当前解析器仅支持 ASCII 格式数据，检测到格式: ${config.fileType}`);
  }

  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const data: ComtradeData[] = [];
  
  const limit = lines.length;

  for (let i = 0; i < limit; i++) {
    const parts = lines[i].split(',').map(s => s.trim());
    if (parts.length < 2 + config.analogChannelsCount + config.digitalChannelsCount) {
      continue; // 跳过无效行
    }

    const sampleNumber = parseInt(parts[0], 10);
    const timestamp = parseFloat(parts[1]) * config.timeMultiplier;
    
    let timestampStr;
    if (config.startTimeDate) {
        const d = new Date(config.startTimeDate.getTime() + timestamp / 1000);
        // 保留毫秒和微秒
        const ms = String(d.getUTCMilliseconds()).padStart(3, '0');
        const us = String(Math.floor(timestamp % 1000)).padStart(3, '0');
        timestampStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}.${ms}${us}`;
    }

    let currentIndex = 2;
    const analogValues: number[] = [];
    for (let j = 0; j < config.analogChannelsCount; j++) {
      const rawValue = parseFloat(parts[currentIndex++]);
      const channel = config.analogChannels[j];
      const realValue = rawValue * channel.a + channel.b;
      analogValues.push(realValue);
    }

    const digitalValues: number[] = [];
    for (let j = 0; j < config.digitalChannelsCount; j++) {
      digitalValues.push(parseInt(parts[currentIndex++], 10));
    }

    data.push({
      sampleNumber,
      timestamp,
      timestampStr,
      analogValues,
      digitalValues
    });
  }

  return data;
}

export async function parseComtradeDatBinary(buffer: ArrayBuffer, config: ComtradeConfig): Promise<ComtradeData[]> {
    // 简易二进制解析 (只支持标准的 16位 BINARY)
    if (config.fileType !== 'BINARY') {
        throw new Error(`目前不支持此二进制格式: ${config.fileType}`);
    }

    const dataView = new DataView(buffer);
    const data: ComtradeData[] = [];
    
    // BINARY 格式每行字节数：
    // n (4字节) + timestamp (4字节) + A (2字节 * analogChannelsCount) + D (2字节 * Math.ceil(digitalChannelsCount / 16))
    const digitalGroups = Math.ceil(config.digitalChannelsCount / 16);
    const bytesPerRecord = 4 + 4 + (config.analogChannelsCount * 2) + (digitalGroups * 2);
    
    const totalRecords = Math.floor(buffer.byteLength / bytesPerRecord);
    const limit = totalRecords;
    
    let offset = 0;
    
    for (let i = 0; i < limit; i++) {
        const sampleNumber = dataView.getUint32(offset, true); // little-endian
        offset += 4;
        
        const timestamp = dataView.getUint32(offset, true) * config.timeMultiplier;
        offset += 4;
        
        let timestampStr;
        if (config.startTimeDate) {
            const d = new Date(config.startTimeDate.getTime() + timestamp / 1000);
            const ms = String(d.getUTCMilliseconds()).padStart(3, '0');
            const us = String(Math.floor(timestamp % 1000)).padStart(3, '0');
            timestampStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}.${ms}${us}`;
        }

        const analogValues: number[] = [];
        for (let j = 0; j < config.analogChannelsCount; j++) {
            const rawValue = dataView.getInt16(offset, true);
            offset += 2;
            const channel = config.analogChannels[j];
            analogValues.push(rawValue * channel.a + channel.b);
        }
        
        const digitalValues: number[] = [];
        let dCount = 0;
        for (let g = 0; g < digitalGroups; g++) {
            const groupValue = dataView.getUint16(offset, true);
            offset += 2;
            for (let bit = 0; bit < 16; bit++) {
                if (dCount < config.digitalChannelsCount) {
                    digitalValues.push((groupValue >> bit) & 1);
                    dCount++;
                }
            }
        }
        
        data.push({
            sampleNumber,
            timestamp,
            timestampStr,
            analogValues,
            digitalValues
        });
    }
    
    return data;
}
