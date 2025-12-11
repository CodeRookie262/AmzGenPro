import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';

// 数据库文件路径
const dbPath = path.join(__dirname, '../../data/amazongen.json');

interface DatabaseSchema {
  users: any[];
  product_masks: any[];
  image_definitions: any[];
  user_masks: any[];
  generation_history: any[];
  api_keys: any[];
}

async function fixUserTimestamps() {
  console.log('🔧 开始修复用户时间戳...');
  
  const adapter = new JSONFile<DatabaseSchema>(dbPath);
  const db = new Low(adapter, { users: [], product_masks: [], image_definitions: [], user_masks: [], generation_history: [], api_keys: [] });
  
  await db.read();
  
  if (!db.data) {
    console.error('❌ 无法读取数据库');
    return;
  }
  
  let fixedCount = 0;
  const now = Math.floor(Date.now() / 1000);
  
  db.data.users.forEach((user: any) => {
    if (!user.created_at || user.created_at === 0) {
      user.created_at = now;
      user.updated_at = now;
      fixedCount++;
      console.log(`✅ 修复用户: ${user.name} (ID: ${user.id})`);
    }
  });
  
  if (fixedCount > 0) {
    await db.write();
    console.log(`\n✅ 成功修复 ${fixedCount} 个用户的时间戳`);
  } else {
    console.log('\n✅ 所有用户时间戳都正常，无需修复');
  }
}

fixUserTimestamps().catch(console.error);



