/**
 * 常用文件幻数 (Magic Number) 映射
 */
const MAGIC_NUMBERS: Record<string, string[]> = {
  'image/jpeg': ['FFD8FF'],
  'image/png': ['89504E47'],
  'image/gif': ['47494638'],
  'application/pdf': ['25504446'],
  'application/zip': ['504B0304', '504B0506', '504B0708'],
  'application/x-rar-compressed': ['526172211A07'],
  'text/markdown': ['2320'], // '# '
}

/**
 * 文件校验选项
 */
export interface ValidationOptions {
  maxSizeMB?: number
  allowedExtensions?: string[]
  allowedMimeTypes?: string[]
  checkMagicNumber?: boolean
}

/**
 * 获取文件的十六进制幻数
 */
async function getFileHeader(file: File, length = 8): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = (e) => {
      if (!e.target?.result) return resolve('')
      const arr = new Uint8Array(e.target.result as ArrayBuffer)
      let header = ''
      for (let i = 0; i < arr.length; i++) {
        header += arr[i]?.toString(16).padStart(2, '0').toUpperCase()
      }
      resolve(header)
    }
    reader.readAsArrayBuffer(file.slice(0, length))
  })
}

/**
 * 校验文件
 */
export async function validateFile(file: File, options: ValidationOptions = {}): Promise<{ valid: boolean; message?: string }> {
  const { maxSizeMB = 10, allowedExtensions, allowedMimeTypes, checkMagicNumber = true } = options

  // 1. 校验大小
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return { valid: false, message: `文件大小不能超过 ${maxSizeMB}MB` }
  }

  // 2. 校验后缀名
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (allowedExtensions && ext && !allowedExtensions.includes(ext)) {
    return { valid: false, message: `不支持的文件后缀: .${ext}` }
  }

  // 3. 校验 MIME 类型 (基础校验)
  if (allowedMimeTypes && !allowedMimeTypes.includes(file.type)) {
    // 某些情况下 MIME 可能为空或不准确，如果是 md 等纯文本可以放宽
    if (ext !== 'md' || file.type !== '') {
       return { valid: false, message: `不支持的文件类型: ${file.type || 'unknown'}` }
    }
  }

  // 4. 校验幻数 (Magic Number) - 防篡改
  if (checkMagicNumber) {
    const header = await getFileHeader(file)
    // 针对已知 MIME 进行深度校验
    for (const [mime, magics] of Object.entries(MAGIC_NUMBERS)) {
      if (allowedMimeTypes?.includes(mime)) {
        const isMatch = magics.some(magic => header.startsWith(magic))
        // 如果文件声称是某种类型但幻数不符
        if (file.type === mime && !isMatch) {
          return { valid: false, message: '文件内容与后缀不符，疑似伪造文件' }
        }
      }
    }
  }

  return { valid: true }
}
