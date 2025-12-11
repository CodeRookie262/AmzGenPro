/**
 * 用户导入Hook
 */
import { useState, useCallback } from 'react';
import { User, UserRole } from '../types';
import { backendUsers } from '../services/backendService';

export const useUserImport = (existingUsers: User[]) => {
  const [isImporting, setIsImporting] = useState(false);

  const downloadTemplate = useCallback(() => {
    const csvContent = '姓名,密码\n张三,123456\n李四,abcdef';
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '员工导入模板.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const importUsers = useCallback(
    async (file: File): Promise<{ successCount: number; newUsers: User[] }> => {
      setIsImporting(true);
      const newUsers: User[] = [];

      try {
        const text = await file.text();
        const lines = text.split(/\r\n|\n/);
        const startIndex = lines[0].includes('姓名') || lines[0].includes('name') ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const parts = line.split(/,|，/);
          if (parts.length >= 2) {
            const name = parts[0].trim();
            const password = parts[1].trim();

            if (name && password) {
              const exists = existingUsers.some(u => u.name === name);
              if (!exists) {
                try {
                  const newUser = await backendUsers.createUser(name, password, UserRole.USER);
                  newUsers.push(newUser);
                } catch (error) {
                  console.error('Failed to create user:', name, error);
                }
              }
            }
          }
        }

        return { successCount: newUsers.length, newUsers };
      } finally {
        setIsImporting(false);
      }
    },
    [existingUsers]
  );

  return {
    isImporting,
    downloadTemplate,
    importUsers,
  };
};

