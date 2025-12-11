/**
 * 图片下载Hook - 封装图片下载相关逻辑
 */
import { useState, useCallback } from 'react';
import { GeneratedImageResult } from '../types';
import { downloadFile, downloadFilesAsZip } from '../utils/file';
import { formatDateTime } from '../utils/format';

export const useImageDownload = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  /**
   * 下载单张图片
   */
  const downloadSingle = useCallback((result: GeneratedImageResult) => {
    if (!result.imageUrl) return;
    
    const filename = `amazongen-${result.definitionName}-${result.id.slice(0, 4)}.png`;
    downloadFile(result.imageUrl, filename);
  }, []);

  /**
   * 批量下载图片
   */
  const downloadBatch = useCallback(async (results: GeneratedImageResult[]) => {
    const validResults = results.filter(r => r.imageUrl);
    
    if (validResults.length === 0) return;
    
    setIsDownloading(true);
    
    try {
      if (validResults.length === 1) {
        // 单张直接下载
        downloadSingle(validResults[0]);
      } else {
        // 多张打包下载
        const files = validResults.map(result => ({
          url: result.imageUrl!,
          filename: `amazongen-${result.definitionName}-${result.id.slice(0, 4)}.png`,
        }));
        
        const zipFilename = `amazongen-batch-${formatDateTime(Date.now()).replace(/[\/\s:]/g, '-')}.zip`;
        await downloadFilesAsZip(files, zipFilename);
      }
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    } finally {
      setIsDownloading(false);
    }
  }, [downloadSingle]);

  return {
    isDownloading,
    downloadSingle,
    downloadBatch,
  };
};

