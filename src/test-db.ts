console.log('🔍 Bắt đầu test kết nối database...');

import { config } from './config/env';
import { logger } from './config/logger';

console.log('📋 Thông tin cấu hình database:');
console.log('- DATABASE_URL:', config.databaseUrl ? 'Đã có' : 'Chưa có');
console.log('- URL chi tiết:', config.databaseUrl?.replace(/password=[^;]+/g, 'password=***'));

// Import Prisma client
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'info' },
  ],
});

// Log các sự kiện database
prisma.$on('query', e => {
  console.log('🔍 Query:', e.query);
  console.log('🔍 Params:', e.params);
  console.log('🔍 Duration:', e.duration + 'ms');
});

prisma.$on('error', e => {
  console.error('❌ Database Error:', e);
});

prisma.$on('warn', e => {
  console.warn('⚠️  Database Warning:', e);
});

prisma.$on('info', e => {
  console.log('ℹ️  Database Info:', e);
});

// Test kết nối database
const testDatabaseConnection = async () => {
  try {
    // console.log('\n🔄 Đang kiểm tra kết nối database...');

    // // Test 1: Kết nối cơ bản
    // console.log('📋 Test 1: Kiểm tra kết nối cơ bản');
    // await prisma.$connect();
    // console.log('✅ Kết nối database thành công!');

    // // Test 2: Chạy query đơn giản
    // console.log('\n📋 Test 2: Chạy query đơn giản');
    // const result = await prisma.$queryRaw`SELECT 1 as test_connection`;
    // console.log('✅ Query test thành công:', result);

    // // Test 3: Kiểm tra version SQL Server
    // console.log('\n📋 Test 3: Kiểm tra version SQL Server');
    // const version = await prisma.$queryRaw`SELECT @@VERSION as server_version`;
    // console.log('✅ SQL Server version:', version);

    // Test 4: Liệt kê các bảng trong database

    // console.log(
    //   '\n📋 Test 4: Liệt kê các bảng có chứa cột có ký tự "eye" trong tên cột trong database'
    // );
    // const tablesWithEyeColumn = await prisma.$queryRaw`
    //   SELECT DISTINCT TABLE_NAME
    //   FROM INFORMATION_SCHEMA.COLUMNS
    //   WHERE COLUMN_NAME LIKE '%Extgro%'
    //   ORDER BY TABLE_NAME
    // `;
    // console.log('✅ Danh sách các bảng có cột chứa "eye" trong tên cột:');
    // console.table(tablesWithEyeColumn);

    console.log(
      '\n📋 Test 4: Liệt kê các bảng có chứa cột có ký tự "eye" trong tên cột trong database'
    );
    const tablesWithEyeColumn = await prisma.$queryRaw`
      SELECT DISTINCT TABLE_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE COLUMN_NAME LIKE '%SubSessionId%'
      ORDER BY TABLE_NAME
    `;
    console.log('✅ Danh sách các bảng có cột chứa "eye" trong tên cột:');
    console.table(tablesWithEyeColumn);
  } catch (error) {
    console.error('❌ Lỗi khi test database:', error);
    console.error('Chi tiết lỗi:', (error as Error).message);

    if ((error as any).code) {
      console.error('Mã lỗi:', (error as any).code);
    }
  } finally {
    // Đóng kết nối
    console.log('\n🔌 Đóng kết nối database...');
    await prisma.$disconnect();
    console.log('✅ Đã đóng kết nối database!');
  }
};

// Chạy test
testDatabaseConnection();
