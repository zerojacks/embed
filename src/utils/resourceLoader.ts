// Resource loader utility for loading XML and YML configuration files from network
export interface ConfigFile {
    name: string
    url: string
    type: 'xml' | 'yml'
    protocol: string
    description: string
    size?: string
}

// Configuration files available for network loading
export const availableConfigFiles: ConfigFile[] = [
    {
        name: 'DLT645.xml',
        url: '/config/DLT645.xml',
        type: 'xml',
        protocol: 'DLT645',
        description: 'DLT645-2007协议配置文件',
        size: '~15KB'
    },
    {
        name: 'CSG13.xml',
        url: '/config/CSG13.xml',
        type: 'xml',
        protocol: 'CSG13',
        description: 'CSG13协议配置文件',
        size: '~12KB'
    },
    {
        name: 'CSG16.xml',
        url: '/config/CSG16.xml',
        type: 'xml',
        protocol: 'CSG16',
        description: 'CSG16协议配置文件',
        size: '~18KB'
    },
    {
        name: 'MOUDLE.xml',
        url: '/config/MOUDLE.xml',
        type: 'xml',
        protocol: 'MODULE',
        description: '模块协议配置文件',
        size: '~8KB'
    },
    {
        name: 'TASK_MS.xml',
        url: '/config/TASK_MS.xml',
        type: 'xml',
        protocol: 'TASK',
        description: '任务管理协议配置文件',
        size: '~10KB'
    },
    {
        name: 'oad_list.yml',
        url: '/config/oad_list.yml',
        type: 'yml',
        protocol: 'TASK',
        description: 'OAD列表配置文件',
        size: '~2KB'
    },
    {
        name: '50020200_list.yml',
        url: '/config/50020200_list.yml',
        type: 'yml',
        protocol: 'TASK',
        description: '50020200任务列表配置',
        size: '~5KB'
    },
    {
        name: '50040200_list.yml',
        url: '/config/50040200_list.yml',
        type: 'yml',
        protocol: 'TASK',
        description: '50040200任务列表配置',
        size: '~4KB'
    },
    {
        name: '50060200_list.yml',
        url: '/config/50060200_list.yml',
        type: 'yml',
        protocol: 'TASK',
        description: '50060200任务列表配置',
        size: '~3KB'
    }
]

// Cache for loaded configurations
const configCache = new Map<string, string>()

/**
 * Load configuration file from network
 */
export const loadConfigFromNetwork = async (configFile: ConfigFile): Promise<string> => {
    // Check cache first
    if (configCache.has(configFile.url)) {
        return configCache.get(configFile.url)!
    }

    try {
        const response = await fetch(configFile.url)
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const content = await response.text()

        // Cache the content
        configCache.set(configFile.url, content)

        return content
    } catch (error) {
        console.error(`Failed to load config from ${configFile.url}:`, error)
        throw new Error(`无法加载配置文件 ${configFile.name}: ${error instanceof Error ? error.message : '网络错误'}`)
    }
}

/**
 * Load configuration file from local resources (fallback)
 */
export const loadConfigFromResources = async (fileName: string): Promise<string> => {
    try {
        // Try to load from src/resources as fallback
        const resourcePath = fileName.endsWith('.xml')
            ? `/src/resources/protocolconfig/${fileName}`
            : `/src/resources/taskoadconfig/${fileName}`

        const response = await fetch(resourcePath)
        if (!response.ok) {
            throw new Error(`Resource not found: ${fileName}`)
        }

        return await response.text()
    } catch (error) {
        throw new Error(`无法从本地资源加载 ${fileName}`)
    }
}

/**
 * Load configuration with fallback strategy
 */
export const loadConfig = async (configFile: ConfigFile): Promise<string> => {
    try {
        // First try network loading
        return await loadConfigFromNetwork(configFile)
    } catch (networkError) {
        console.warn('Network loading failed, trying local resources:', networkError)

        try {
            // Fallback to local resources
            return await loadConfigFromResources(configFile.name)
        } catch (localError) {
            console.error('Both network and local loading failed:', localError)
            throw new Error(`配置加载失败: ${configFile.name}`)
        }
    }
}

export const getConfigByName = (name: string): ConfigFile | undefined => {
    return availableConfigFiles.find(config => config.name === name)
}

export const getConfigsByProtocol = (protocol: string): ConfigFile[] => {
    if (protocol === 'auto') return availableConfigFiles
    if (protocol === 'CSG') return availableConfigFiles.filter(config => config.protocol.startsWith('CSG'))
    return availableConfigFiles.filter(config => config.protocol === protocol)
}

export const parseXmlConfig = (xmlContent: string) => {
    // Basic XML parsing for configuration items
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlContent, 'text/xml')

    const dataItems: Array<{
        id: string
        name: string
        description: string
        protocol: string
        region: string
    }> = []

    const items = doc.querySelectorAll('dataItem[id]')
    items.forEach(item => {
        const id = item.getAttribute('id') || ''
        const protocol = item.getAttribute('protocol') || ''
        const region = item.getAttribute('region') || ''
        const nameElement = item.querySelector('name')
        const name = nameElement?.textContent || id

        dataItems.push({
            id,
            name,
            description: `${protocol} - ${region}`,
            protocol,
            region
        })
    })

    return dataItems
}

export const parseYmlConfig = (ymlContent: string) => {
    // Basic YML parsing for configuration items
    const lines = ymlContent.split('\n')
    const items: Array<{
        id: string
        name: string
        description: string
        protocol: string
        region: string
    }> = []

    lines.forEach(line => {
        const match = line.match(/v_oad:\s*"([^"]+)".*#(.+)/)
        if (match) {
            const [, id, description] = match
            items.push({
                id,
                name: description.trim(),
                description: `任务配置项 - ${id}`,
                protocol: 'TASK',
                region: '通用'
            })
        }
    })

    return items
}