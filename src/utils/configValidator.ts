export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface ConfigFileInfo {
  name: string
  type: 'xml' | 'json' | 'ini' | 'conf'
  size: number
  lastModified: Date
}

export class ConfigValidator {
  static validateXmlConfig(content: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    try {
      // Basic XML validation
      const parser = new DOMParser()
      const doc = parser.parseFromString(content, 'text/xml')
      
      // Check for parsing errors
      const parseError = doc.querySelector('parsererror')
      if (parseError) {
        result.isValid = false
        result.errors.push('XML格式错误: ' + parseError.textContent)
        return result
      }

      // Check for required elements (protocol configuration specific)
      const root = doc.documentElement
      if (!root) {
        result.isValid = false
        result.errors.push('XML文件缺少根元素')
        return result
      }

      // Validate protocol-specific structure
      if (root.tagName === 'protocol' || root.tagName === 'config') {
        const items = root.querySelectorAll('item')
        if (items.length === 0) {
          result.warnings.push('未找到配置项目')
        }

        // Check for required attributes
        items.forEach((item, index) => {
          const id = item.getAttribute('id')
          if (!id) {
            result.warnings.push(`第${index + 1}个配置项缺少id属性`)
          }
        })
      }

    } catch (error) {
      result.isValid = false
      result.errors.push('XML解析失败: ' + (error as Error).message)
    }

    return result
  }

  static validateJsonConfig(content: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    try {
      const data = JSON.parse(content)
      
      // Check if it's an object
      if (typeof data !== 'object' || data === null) {
        result.warnings.push('JSON根元素应该是一个对象')
      }

      // Check for common configuration patterns
      if (Array.isArray(data)) {
        result.warnings.push('配置文件通常应该是对象而不是数组')
      }

      // Validate nested structure depth
      const checkDepth = (obj: any, depth = 0): number => {
        if (depth > 10) {
          result.warnings.push('配置嵌套层级过深，可能影响性能')
          return depth
        }

        if (typeof obj === 'object' && obj !== null) {
          let maxDepth = depth
          for (const value of Object.values(obj)) {
            maxDepth = Math.max(maxDepth, checkDepth(value, depth + 1))
          }
          return maxDepth
        }
        return depth
      }

      checkDepth(data)

    } catch (error) {
      result.isValid = false
      result.errors.push('JSON格式错误: ' + (error as Error).message)
    }

    return result
  }

  static validateIniConfig(content: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    }

    const lines = content.split('\n')
    let currentSection = ''
    let sectionCount = 0
    let keyCount = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      const lineNumber = i + 1

      // Skip empty lines and comments
      if (!line || line.startsWith('#') || line.startsWith(';')) {
        continue
      }

      // Section header
      if (line.startsWith('[') && line.endsWith(']')) {
        currentSection = line.slice(1, -1)
        sectionCount++
        
        if (!currentSection) {
          result.warnings.push(`第${lineNumber}行: 空的配置段名`)
        }
        continue
      }

      // Key-value pair
      if (line.includes('=')) {
        keyCount++
        const [key, ...valueParts] = line.split('=')
        
        if (!key.trim()) {
          result.warnings.push(`第${lineNumber}行: 空的配置键名`)
        }
        
        if (valueParts.length === 0) {
          result.warnings.push(`第${lineNumber}行: 配置值为空`)
        }
        continue
      }

      // Invalid line format
      if (line && !currentSection) {
        result.warnings.push(`第${lineNumber}行: 配置项不在任何段中`)
      } else if (line) {
        result.warnings.push(`第${lineNumber}行: 无效的配置格式`)
      }
    }

    if (sectionCount === 0) {
      result.warnings.push('配置文件中没有找到任何配置段')
    }

    if (keyCount === 0) {
      result.warnings.push('配置文件中没有找到任何配置项')
    }

    return result
  }

  static validateConfigFile(file: File): Promise<ValidationResult> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const content = e.target?.result as string
        const extension = file.name.split('.').pop()?.toLowerCase()
        
        let result: ValidationResult
        
        switch (extension) {
          case 'xml':
            result = this.validateXmlConfig(content)
            break
          case 'json':
            result = this.validateJsonConfig(content)
            break
          case 'ini':
          case 'conf':
            result = this.validateIniConfig(content)
            break
          default:
            result = {
              isValid: false,
              errors: [`不支持的文件类型: ${extension}`],
              warnings: []
            }
        }
        
        resolve(result)
      }
      
      reader.onerror = () => {
        resolve({
          isValid: false,
          errors: ['文件读取失败'],
          warnings: []
        })
      }
      
      reader.readAsText(file)
    })
  }

  static getFileInfo(file: File): ConfigFileInfo {
    const extension = file.name.split('.').pop()?.toLowerCase()
    
    return {
      name: file.name,
      type: (extension === 'xml' || extension === 'json' || extension === 'ini' || extension === 'conf') 
        ? extension as 'xml' | 'json' | 'ini' | 'conf'
        : 'json', // default fallback
      size: file.size,
      lastModified: new Date(file.lastModified)
    }
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}