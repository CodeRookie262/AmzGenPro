import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import fs from 'fs';

// 数据库文件路径（放在项目根目录的 data 文件夹中）
const dbDir = path.join(__dirname, '../../data');
const dbPath = path.join(dbDir, 'amazongen.json');

// 确保 data 目录存在
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 数据库结构
interface DatabaseSchema {
  users: any[];
  product_masks: any[];
  image_definitions: any[];
  user_masks: any[];
  generation_history: any[];
  api_keys: any[];
}

// 默认数据
const defaultData: DatabaseSchema = {
  users: [],
  product_masks: [],
  image_definitions: [],
  user_masks: [],
  generation_history: [],
  api_keys: []
};

// 创建适配器
const adapter = new JSONFile<DatabaseSchema>(dbPath);
const db = new Low(adapter, defaultData);

// 初始化数据库
export async function initDatabase() {
  await db.read();
  if (!db.data || Object.keys(db.data).length === 0) {
    db.data = defaultData;
    await db.write();
  }
  console.log('✅ JSON database initialized');
  console.log(`📁 Database file: ${dbPath}`);
}

// 测试数据库连接
export async function testConnection() {
  try {
    await initDatabase();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// 简单的 SQL 解析和转换
function parseSelect(sql: string, params: any[] = []): { table: keyof DatabaseSchema; where?: any; orderBy?: string; limit?: number; offset?: number; isCount?: boolean; countAlias?: string } {
  const tableMatch = sql.match(/FROM\s+`?(\w+)`?/i);
  const whereMatch = sql.match(/WHERE\s+`?(\w+)`?\s*=\s*\?/i);
  const orderMatch = sql.match(/ORDER BY\s+`?(\w+)`?\s+(DESC|ASC)/i);
  const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
  const offsetMatch = sql.match(/OFFSET\s+(\d+)/i);
  
  // Check for COUNT(*) queries
  const countMatch = sql.match(/SELECT\s+COUNT\(\s*\*\s*\)\s+as\s+(\w+)/i);
  const isCount = sql.includes('COUNT(*)') || sql.includes('COUNT( * )');
  
  return {
    table: tableMatch?.[1] as keyof DatabaseSchema,
    where: whereMatch ? { column: whereMatch[1], value: params[0] } : undefined,
    orderBy: orderMatch ? `${orderMatch[1]} ${orderMatch[2]}` : undefined,
    limit: limitMatch ? parseInt(limitMatch[1]) : undefined,
    offset: offsetMatch ? parseInt(offsetMatch[1]) : undefined,
    isCount: isCount,
    countAlias: countMatch?.[1]
  };
}

// 数据库操作包装器（兼容 SQL 风格）
class DatabaseWrapper {
  private async ensureInit() {
    if (!db.data) {
      await initDatabase();
    }
  }
  
  // Direct update by ID - more robust than SQL parsing
  async updateById(table: keyof DatabaseSchema, id: string, updates: any) {
    await this.ensureInit();
    await db.read(); // Reload from file to get latest data
    
    const rows = db.data![table] as any[];
    const row = rows.find((r: any) => r.id === id);
    
    if (!row) {
      console.warn(`UPDATE: No row found with id = ${id} in table ${table}`);
      return false;
    }
    
    const beforeUpdate = { ...row };
    Object.assign(row, updates);
    
    console.log(`UPDATE: Updated row in ${table}:`);
    console.log(`  Before:`, beforeUpdate);
    console.log(`  After:`, row);
    
    await db.write();
    console.log(`UPDATE: Data written to file successfully`);
    
    return true;
  }
  
  // Direct delete by ID
  async deleteById(table: keyof DatabaseSchema, id: string) {
    await this.ensureInit();
    await db.read();
    
    const beforeLength = (db.data![table] as any[]).length;
    db.data![table] = (db.data![table] as any[]).filter((row: any) => row.id !== id) as any;
    const afterLength = (db.data![table] as any[]).length;
    
    if (beforeLength === afterLength) {
      console.warn(`DELETE: No row found with id = ${id} in table ${table}`);
      return false;
    }
    
    await db.write();
    console.log(`DELETE: Deleted row with id = ${id} from ${table}`);
    
    return true;
  }
  
  // Direct insert
  async insert(table: keyof DatabaseSchema, data: any) {
    await this.ensureInit();
    await db.read();
    
    (db.data![table] as any[]).push(data);
    
    await db.write();
    console.log(`INSERT: Added row to ${table}:`, data);
    
    return true;
  }
  
  prepare(sql: string) {
    return {
      get: async (...params: any[]) => {
        await this.ensureInit();
        // Reload data from file to ensure we have the latest data
        await db.read();
        const parsed = parseSelect(sql, params);
        if (!parsed.table) return null;
        
        // Handle COUNT(*) queries
        if (parsed.isCount) {
          let results = [...(db.data![parsed.table] as any[])];
          
          if (parsed.where) {
            results = results.filter((row: any) => row[parsed.where!.column] === parsed.where!.value);
          }
          
          const count = results.length;
          const alias = parsed.countAlias || 'total';
          return { [alias]: count };
        }
        
        let results = [...(db.data![parsed.table] as any[])];
        
        if (parsed.where) {
          results = results.filter((row: any) => row[parsed.where!.column] === parsed.where!.value);
        }
        
        return results[0] || null;
      },
      
      all: async (...params: any[]) => {
        await this.ensureInit();
        // Reload data from file to ensure we have the latest data
        await db.read();
        const parsed = parseSelect(sql, params);
        if (!parsed.table) return [];
        
        let results = [...(db.data![parsed.table] as any[])];
        
        if (parsed.where) {
          results = results.filter((row: any) => row[parsed.where!.column] === parsed.where!.value);
        }
        
        if (parsed.orderBy) {
          const [col, dir] = parsed.orderBy.split(' ');
          results.sort((a: any, b: any) => {
            const aVal = a[col] || 0;
            const bVal = b[col] || 0;
            return dir === 'DESC' ? bVal - aVal : aVal - bVal;
          });
        }
        
        if (parsed.offset !== undefined) {
          results = results.slice(parsed.offset);
        }
        if (parsed.limit !== undefined) {
          results = results.slice(0, parsed.limit);
        }
        
        return results;
      },
      
      run: async (...params: any[]) => {
        await this.ensureInit();
        // Reload data from file before any write operation to ensure we have the latest data
        await db.read();
        
        // INSERT INTO
        if (sql.includes('INSERT INTO')) {
          const tableMatch = sql.match(/INSERT INTO\s+`?(\w+)`?/i);
          const columnsMatch = sql.match(/\(([^)]+)\)/);
          const valuesMatch = sql.match(/VALUES\s*\(([^)]+)\)/);
          
          if (tableMatch && columnsMatch && valuesMatch) {
            const table = tableMatch[1] as keyof DatabaseSchema;
            const columns = columnsMatch[1].split(',').map(c => c.trim().replace(/`/g, ''));
            const placeholders = valuesMatch[1].split(',').map(v => v.trim());
            
            const row: any = {};
            let paramIndex = 0;
            columns.forEach((col, i) => {
              if (!col) return; // Skip empty columns
              const placeholder = placeholders[i];
              if (!placeholder) {
                row[col] = null;
                return;
              }
              if (placeholder === '?') {
                row[col] = params[paramIndex++];
              } else if (placeholder.includes && placeholder.includes('strftime')) {
                row[col] = Math.floor(Date.now() / 1000);
              } else {
                row[col] = placeholder.replace(/['"]/g, '');
              }
            });
            
            (db.data![table] as any[]).push(row);
            await db.write();
          }
        }
        // UPDATE
        else if (sql.includes('UPDATE')) {
          const tableMatch = sql.match(/UPDATE\s+`?(\w+)`?/i);
          const setMatch = sql.match(/SET\s+(.*?)\s+WHERE/i);
          const whereMatch = sql.match(/WHERE\s+`?(\w+)`?\s*=\s*\?/i);
          
          if (tableMatch && setMatch) {
            const table = tableMatch[1] as keyof DatabaseSchema;
            const updates: any = {};
            let setParamCount = 0;
            
            console.log(`UPDATE: Raw SET clause: "${setMatch[1]}"`);
            
            // Parse SET clause more carefully (handle functions with commas)
            const setClause = setMatch[1].trim();
            const setParts: string[] = [];
            let depth = 0;
            let inString = false;
            let stringChar = '';
            let currentPart = '';
            
            for (let i = 0; i < setClause.length; i++) {
              const char = setClause[i];
              
              // Handle string literals
              if ((char === '"' || char === "'") && (i === 0 || setClause[i-1] !== '\\')) {
                if (!inString) {
                  inString = true;
                  stringChar = char;
                } else if (char === stringChar) {
                  inString = false;
                }
              }
              
              if (!inString) {
                if (char === '(') depth++;
                if (char === ')') depth--;
                
                if (char === ',' && depth === 0) {
                  if (currentPart.trim()) {
                    setParts.push(currentPart.trim());
                  }
                  currentPart = '';
                  continue;
                }
              }
              
              currentPart += char;
            }
            
            // Don't forget the last part
            if (currentPart.trim()) {
              setParts.push(currentPart.trim());
            }
            
            console.log(`UPDATE: Parsed SET parts:`, setParts);
            
            // Process each SET part
            setParts.forEach(part => {
              const equalIndex = part.indexOf('=');
              if (equalIndex === -1) {
                console.warn(`UPDATE: Skipping invalid SET part: "${part}"`);
                return;
              }
              
              const key = part.substring(0, equalIndex).trim().replace(/`/g, '');
              const value = part.substring(equalIndex + 1).trim();
              
              if (!key || !value) {
                console.warn(`UPDATE: Skipping empty key or value: key="${key}", value="${value}"`);
                return;
              }
              
              if (value === '?') {
                updates[key] = params[setParamCount++];
                console.log(`UPDATE: Set ${key} = params[${setParamCount-1}] = ${updates[key]}`);
              } else if (value.includes('strftime')) {
                updates[key] = Math.floor(Date.now() / 1000);
                console.log(`UPDATE: Set ${key} = ${updates[key]} (current timestamp)`);
              } else {
                updates[key] = value.replace(/['"]/g, '');
                console.log(`UPDATE: Set ${key} = ${updates[key]} (literal)`);
              }
            });
            
            const rows = db.data![table] as any[];
            if (whereMatch) {
              const column = whereMatch[1];
              // WHERE clause parameter comes after all SET parameters
              const whereParamIndex = setParamCount;
              
              console.log(`UPDATE: SQL=${sql.substring(0, 100)}...`);
              console.log(`UPDATE: Table=${table}, Column=${column}, WhereParamIndex=${whereParamIndex}, TotalParams=${params.length}`);
              console.log(`UPDATE: Params=`, params);
              console.log(`UPDATE: Updates=`, updates);
              
              if (params.length > whereParamIndex) {
                const whereValue = params[whereParamIndex];
                
                console.log(`UPDATE: Looking for ${column} = ${whereValue} in table ${table}`);
                console.log(`UPDATE: Available rows:`, rows.map((r: any) => ({ id: r.id, [column]: r[column] })));
                
                // Find and update matching rows
                let found = false;
              rows.forEach((row: any) => {
                  if (row[column] === whereValue) {
                    const beforeUpdate = { ...row };
                  Object.assign(row, updates);
                    found = true;
                    console.log(`UPDATE: Found and updated row:`);
                    console.log(`  Before:`, beforeUpdate);
                    console.log(`  After:`, row);
                }
              });
                
                if (!found) {
                  console.warn(`UPDATE: No row found with ${column} = ${whereValue} in table ${table}`);
                  console.warn(`UPDATE: Available rows:`, rows.map((r: any) => ({ id: r.id, [column]: r[column] })));
                } else {
                  // Write to file after successful update
                  console.log(`UPDATE: About to write to file...`);
                  await db.write();
                  console.log(`UPDATE: Data written to file successfully at ${dbPath}`);
                  
                  // Verify the write by re-reading
                  await db.read();
                  const verifyRow = (db.data![table] as any[]).find((r: any) => r[column] === whereValue);
                  console.log(`UPDATE: Verification after write:`, verifyRow);
                }
              } else {
                console.error(`UPDATE: Insufficient parameters. Need ${whereParamIndex + 1}, got ${params.length}`);
              }
            } else {
              // No WHERE clause - update all rows (shouldn't happen in production)
              console.warn('UPDATE: No WHERE clause matched, updating all rows');
              rows.forEach((row: any) => {
                Object.assign(row, updates);
              });
              await db.write();
            }
          } else {
            console.error('UPDATE: Failed to parse SQL:', sql);
          }
        }
        // DELETE FROM
        else if (sql.includes('DELETE FROM')) {
          const tableMatch = sql.match(/DELETE FROM\s+`?(\w+)`?/i);
          const whereMatch = sql.match(/WHERE\s+`?(\w+)`?\s*=\s*\?/i);
          
          if (tableMatch) {
            const table = tableMatch[1] as keyof DatabaseSchema;
            if (whereMatch && params.length > 0) {
              const column = whereMatch[1];
              const value = params[0];
              db.data![table] = (db.data![table] as any[]).filter((row: any) => row[column] !== value) as any;
            } else {
              db.data![table] = [] as any;
            }
            await db.write();
          }
        }
      },
      
      exec: async (sql: string) => {
        await this.ensureInit();
        // CREATE TABLE 等语句在这里不需要实际操作，因为数据结构已定义
        await db.write();
      }
    };
  }
  
  async exec(sql: string) {
    await this.ensureInit();
    await db.write();
  }
}

const dbWrapper = new DatabaseWrapper();

// 初始化
initDatabase().catch(console.error);

export { dbWrapper as db };
export default dbWrapper;
