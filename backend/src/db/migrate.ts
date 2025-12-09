import bcrypt from 'bcryptjs';
import { db, initDatabase } from '../config/database';

async function migrate() {
  try {
    console.log('🔄 Starting database migration...');
    
    // 初始化数据库
    await initDatabase();
    
    // 创建默认管理员用户
    const adminPasswordHash = await bcrypt.hash('admin', 10);
    
    // 检查管理员是否已存在
    const existingAdmin = await db.prepare('SELECT id FROM users WHERE name = ?').get('admin');
    
    if (!existingAdmin) {
      await db.prepare(
        `INSERT INTO users (id, name, password_hash, role, avatar) 
         VALUES (?, ?, ?, ?, ?)`
      ).run('admin-001', 'admin', adminPasswordHash, 'admin', '👑');
      console.log('✅ Default admin user created');
    } else {
      console.log('ℹ️  Admin user already exists');
    }
    
    console.log('✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
