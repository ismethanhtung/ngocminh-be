# Sửa lỗi UTF-8 cho dữ liệu tiếng Việt

## Vấn đề

Khi cập nhật dữ liệu có dấu tiếng Việt qua API `PUT /ha/result-detail/:id`, dữ liệu bị lưu sai:

- `NGUYỄN THỊ MỸ DUNG` → `NGUY?N TH? M? DUNG`
- `sức khỏe ổn định` → `sức kh?e ?n d?nh`

## Nguyên nhân

1. **Connection string thiếu charset**: SQL Server connection không chỉ định charset UTF-8
2. **Cách xử lý dữ liệu**: Sử dụng string concatenation thay vì parameterized query với N prefix

## Giải pháp đã áp dụng

### 1. Cập nhật Database Connection

- Thêm `charset=utf8` vào connection string
- Cập nhật Prisma client configuration

### 2. Sửa Service Layer

- Thay thế string concatenation bằng parameterized query
- Sử dụng `N@param` prefix cho Unicode strings
- Đảm bảo tất cả text fields được xử lý đúng UTF-8

### 3. Thêm Middleware UTF-8

- Thêm middleware xử lý request body để đảm bảo UTF-8 encoding
- Xử lý recursive cho nested objects và arrays

## Cách test

### 1. Chạy test script

```bash
node test-utf8-fix.js
```

### 2. Test API trực tiếp

```bash
curl -X PUT http://localhost:3000/api/v1/ha/result-detail/1 \
  -H "Content-Type: application/json" \
  -d '{
    "ConclusionDoctor": "NGUYỄN THỊ MỸ DUNG",
    "Conclusion": "Sức khỏe ổn định, không có dấu hiệu bất thường"
  }'
```

### 3. Kiểm tra database

```sql
SELECT ConclusionDoctor, Conclusion
FROM HA_ResultDetail
WHERE Id = 1
```

## Files đã thay đổi

1. `src/services/haService.ts` - Sửa method `updateHAResultDetail`
2. `src/config/database.ts` - Thêm charset vào connection string
3. `src/app.ts` - Thêm middleware xử lý UTF-8
4. `env.example` - Cập nhật hướng dẫn connection string

## Lưu ý quan trọng

1. **Cập nhật .env file**: Thêm `charset=utf8` vào cuối DATABASE_URL
2. **Restart server**: Cần restart server sau khi thay đổi cấu hình
3. **Database collation**: Đảm bảo database sử dụng collation hỗ trợ Unicode (SQL_Latin1_General_CP1_CI_AS hoặc tương tự)

## Kiểm tra kết quả

Sau khi áp dụng fix, dữ liệu tiếng Việt sẽ được lưu đúng:

- ✅ `NGUYỄN THỊ MỸ DUNG` (thay vì `NGUY?N TH? M? DUNG`)
- ✅ `sức khỏe ổn định` (thay vì `sức kh?e ?n d?nh`)
