/**
 * 文件处理工具函数
 */

/**
 * 读取文件为Base64
 */
export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 下载文件
 */
export const downloadFile = (url: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 批量下载文件为ZIP
 */
export const downloadFilesAsZip = async (
  files: Array<{ url: string; filename: string }>,
  zipFilename: string = 'download.zip'
): Promise<void> => {
  const JSZip = (await import('jszip')).default;
  const { saveAs } = await import('file-saver');
  
  const zip = new JSZip();
  const folder = zip.folder('amazongen-images');
  
  let processedCount = 0;
  
  for (const file of files) {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      folder?.file(file.filename, blob);
      processedCount++;
    } catch (error) {
      console.error(`Failed to add file ${file.filename} to zip:`, error);
    }
  }
  
  if (processedCount > 0) {
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, zipFilename);
  }
};

/**
 * 获取文件扩展名
 */
export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

/**
 * 验证文件类型
 */
export const checkFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

