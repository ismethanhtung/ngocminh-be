# Ngọc Minh Medical Backend

Hệ thống backend chuyên nghiệp quản lý dữ liệu hình ảnh y tế với Node.js, Prisma và SQL Server.

## 🏥 Tính năng chính

- **Quản lý hình ảnh X-quang, CT, MRI**: Lưu trữ và xử lý các loại hình ảnh chẩn đoán y tế
- **Hệ thống PACS**: Tích hợp với Picture Archiving and Communication System
- **Upload file an toàn**: Hỗ trợ nhiều định dạng file y tế (DICOM, JPEG, PNG, PDF)
- **API RESTful**: Thiết kế API chuẩn REST với documentation đầy đủ
- **Bảo mật cao**: Rate limiting, CORS, Helmet, validation đầu vào
- **Logging chi tiết**: Winston logging với rotation và level filtering
- **Type safety**: TypeScript với strict mode
- **Database migrations**: Prisma ORM với SQL Server

## 🏗️ Kiến trúc hệ thống

```
src/
├── config/          # Cấu hình database, logging, environment
├── controllers/     # Controllers xử lý logic business
├── middleware/      # Middleware bảo mật, validation, upload
├── routes/          # Định nghĩa API endpoints
├── services/        # Business logic và data access
├── types/           # TypeScript type definitions
├── app.ts           # Express app configuration
└── index.ts         # Server entry point
```

## 🗄️ Cơ sở dữ liệu

Hệ thống quản lý 8 bảng chính cho hình ảnh y tế:

### Bảng quan trọng nhất:

- **CN_ImagingResultData**: Lưu trữ dữ liệu ảnh X-quang, CT, MRI (varbinary)
- **CN_ImagingResult**: Metadata kết quả chẩn đoán hình ảnh

### Bảng hỗ trợ:

- **CN_Graphic**: Hình ảnh đồ họa, biểu đồ y tế
- **CN_PathologyImage**: Hình ảnh xét nghiệm vi sinh, tế bào
- **CN_FILES**: File tài liệu bệnh án
- **CN_ProgressData**: Dữ liệu tiến trình điều trị
- **EXP_ClinicalFile**: File lâm sàng mở rộng
- **PACS_RequestInfo**: Thông tin hệ thống PACS

## 🚀 Cài đặt và chạy

### 1. Clone repository

```bash
git clone <repository-url>
cd ngocminh-be
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình môi trường

```bash
cp env.example .env
```

Cập nhật file `.env`:

```bash
DATABASE_URL="sqlserver://1.53.55.21,1534;database=YourDatabaseName;user=Tung_Maitech;password=MatKhau123!;encrypt=true;trustServerCertificate=true"
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-here
```

### 4. Generate Prisma client

```bash
npm run db:generate
```

### 5. Chạy ở development mode

```bash
npm run dev
```

### 6. Build cho production

```bash
npm run build
npm start
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Endpoints chính

#### Health Check

- `GET /health` - Kiểm tra tình trạng server
- `GET /health/database` - Kiểm tra kết nối database
- `GET /health/detailed` - Kiểm tra chi tiết hệ thống

#### Imaging Results (Kết quả chẩn đoán hình ảnh)

- `GET /imaging/results` - Lấy danh sách kết quả
- `GET /imaging/results/:id` - Lấy kết quả theo ID
- `POST /imaging/results` - Tạo kết quả mới
- `PUT /imaging/results/:id` - Cập nhật kết quả
- `DELETE /imaging/results/:id` - Xóa kết quả
- `POST /imaging/results/:resultId/data` - Upload dữ liệu ảnh
- `GET /imaging/results/:resultId/download/:dataType` - Download ảnh

#### Graphics (Hình ảnh đồ họa)

- `GET /graphics` - Lấy danh sách hình ảnh
- `POST /graphics` - Upload hình ảnh mới
- `PUT /graphics/:id` - Cập nhật hình ảnh
- `DELETE /graphics/:id` - Xóa hình ảnh

#### PACS System

- `GET /pacs/requests` - Lấy danh sách yêu cầu PACS
- `POST /pacs/requests` - Tạo yêu cầu PACS
- `GET /pacs/statistics` - Thống kê theo modality

### Query Parameters

#### Pagination

```
?page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

#### Search & Filter

```
?search=keyword&patientId=P001&pathologyType=1&status=1
```

## 🔧 Scripts có sẵn

```bash
# Development
npm run dev              # Chạy với hot reload
npm run build           # Build TypeScript
npm start              # Chạy production build

# Database
npm run db:generate     # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:studio      # Mở Prisma Studio

# Code quality
npm run lint           # Chạy ESLint
npm run lint:fix       # Fix ESLint errors
npm run format         # Format với Prettier
```

## 🛡️ Bảo mật

- **Rate Limiting**: 100 requests/15 phút per IP
- **CORS**: Cấu hình origin whitelist
- **Helmet**: Security headers
- **Input Validation**: Joi validation cho tất cả endpoints
- **File Upload**: Validation file type và size
- **SQL Injection**: Protection bằng Prisma ORM

## 📊 Monitoring & Logging

### Log Levels

- **ERROR**: Lỗi nghiêm trọng
- **WARN**: Cảnh báo
- **INFO**: Thông tin general
- **DEBUG**: Chi tiết debug (chỉ development)

### Log Files

- `logs/app.log` - Tất cả logs
- `logs/error.log` - Chỉ errors
- `logs/exceptions.log` - Uncaught exceptions

## 🔄 Pathology Types

1. **X-quang** (pathologyType: 1)
2. **CT** (pathologyType: 2)
3. **MRI** (pathologyType: 3)
4. **Siêu âm** (pathologyType: 4)
5. **Chụp vú** (pathologyType: 5)
6. **Nội soi** (pathologyType: 6)

## 📱 File Upload Support

### Supported Formats

- **Images**: JPEG, PNG, GIF, BMP, TIFF, WebP
- **Medical**: DICOM files
- **Documents**: PDF, DOC, DOCX

### Upload Limits

- **Max file size**: 10MB per file
- **Max files**: 5 files per request

## 🚨 Error Handling

Tất cả API responses có format:

```json
{
  "success": boolean,
  "message": string,
  "data?": any,
  "errors?": string[],
  "pagination?": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

## 🔧 Environment Variables

| Variable        | Description                  | Default         |
| --------------- | ---------------------------- | --------------- |
| `DATABASE_URL`  | SQL Server connection string | Required        |
| `PORT`          | Server port                  | 3000            |
| `NODE_ENV`      | Environment                  | development     |
| `JWT_SECRET`    | JWT secret key               | Required        |
| `LOG_LEVEL`     | Logging level                | info            |
| `MAX_FILE_SIZE` | Max upload size              | 10485760 (10MB) |

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Thanh Tung**

- Email: [your-email@example.com]
- GitHub: [your-github-username]

---

**Ngọc Minh Medical Backend** - Hệ thống quản lý hình ảnh y tế chuyên nghiệp 🏥
# ngocminh-be
