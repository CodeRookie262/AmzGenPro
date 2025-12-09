// Script to initialize local JSON database
import { initDatabase } from '../config/database';

async function createDatabase() {
  try {
    console.log('🔄 Initializing local JSON database...');
    
    // Initialize the local JSON database
    await initDatabase();
    
    console.log('✅ Local JSON database initialized successfully');
    console.log('📁 Database file: backend/data/amazongen.json');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Failed to initialize database:', error.message);
    process.exit(1);
  }
}

createDatabase();

