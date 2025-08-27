tôi đã có đầy đủ quy trình lấy data, tiếp theo tôi muốn bạn viết api cho backend này của tôi. để liên kết db, tham khảo,... hãy đọc full codebase

nói sơ lược như sau:

1. thông tin chung: View ViewHAResult. Nhập vào Filenum(đây là số ví dụ như 25003245) -> Hiển thị ra tất cả các đợt khám sức khỏe của bệnh nhân đó, xếp theo StartDate. từ filenum lấy tất cả thông tin trong view này.(trong đó sẽ có id,ItemNum sẽ được sử dụng bên dưới)
2. Khám lâm sàn: đầu vào là id từ [ViewHAResult] trước đó(number), Lấy các data ở trong bảng [ViewHAResultItem] tương ứng là cột ResultId = id

3. Xét nghiệm huyết học, sinh hóa
   -đầu vào là Id(id của ViewHAResult), Lấy trong [ViewHAPathologyResult], lọc theo cột ResultId là Id của [ViewHAResult] ban đầu.
4. Chẩn đoán hình ảnh

- đầu vào là ItemNum(đã lấy từ ViewHAResult bên trên). Lấy SessionId bằng ItemNum trong bảng ViewHAResult (chỉ cần lấy cái mới nhất)
- từ SessionId trên, Vào bảng [ViewImagingResult] lọc theo SessionId, có được Id(1 hoặc nhiều) tiếp theo Vào [CN_ImagingResultData] lọc theo ImageRessultId là Id trên lấy ra các kết quả.
