/**
 * 用户列表组件
 */
import React from 'react';
import { User } from '../../types';
import { Users, Trash2 } from 'lucide-react';
import { formatDateTime } from '../../utils/date';

interface UserListProps {
  users: User[];
  onDelete: (userId: string) => void;
}

export const UserList: React.FC<UserListProps> = ({ users, onDelete }) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">暂无员工账号</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {users.map(user => (
        <div
          key={user.id}
          className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-2xl">
              {user.avatar || '👤'}
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{user.name}</h4>
              <p className="text-xs text-gray-400 mt-0.5">
                创建于 {formatDateTime(user.createdAt)}
              </p>
            </div>
          </div>
          <button
            onClick={() => onDelete(user.id)}
            className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded transition-colors"
            title="删除账号"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
};

