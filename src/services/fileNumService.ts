import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

export interface PatientInfo {
  fileNum: string;
  crPatient?: any;
  patientSearch?: any;
  personFull?: any;
  person?: any;
  haResults?: any[];
  moResults?: any[];
  pathologyResults?: any[];
  pathologyResultValues?: any[];
}

export class FileNumService {
  /**
   * Tìm kiếm thông tin bệnh nhân theo FileNum
   */
  async searchByFileNum(fileNum: string): Promise<PatientInfo> {
    try {
      const result: PatientInfo = {
        fileNum,
        haResults: [],
        moResults: [],
        pathologyResults: [],
        pathologyResultValues: [],
      };

      // Tìm trong CR_Patient
      try {
        const crPatientResult = await prisma.$queryRawUnsafe(`
          SELECT BloodType, Smoking, Alcohol, Guardian, GuardianCMND, CCCD, CCCDDate, CCCDIssuedBy
          FROM CR_Patient 
          WHERE FileNum = '${fileNum}'
        `);
        if ((crPatientResult as any[]).length > 0) {
          result.crPatient = (crPatientResult as any[])[0];
        }
      } catch (error) {
        console.error('Lỗi khi tìm trong CR_Patient:', error);
      }

      // Tìm trong PatientSearchView
      try {
        const patientSearchResult = await prisma.$queryRawUnsafe(`
          SELECT Dob, DobAccuracyCode, Sex, FullName, AddressNo, Street, CityId, DistrictId, WardId, Department, Mobile, Phone, CCCD, Guardian
          FROM PatientSearchView 
          WHERE FileNum = '${fileNum}'
        `);
        if ((patientSearchResult as any[]).length > 0) {
          result.patientSearch = (patientSearchResult as any[])[0];
        }
      } catch (error) {
        console.error('Lỗi khi tìm trong PatientSearchView:', error);
      }

      // Tìm trong PersonFullView
      try {
        const personFullResult = await prisma.$queryRawUnsafe(`
          SELECT *
          FROM PersonFullView 
          WHERE FileNum = '${fileNum}'
        `);
        if ((personFullResult as any[]).length > 0) {
          result.personFull = (personFullResult as any[])[0];
        }
      } catch (error) {
        console.error('Lỗi khi tìm trong PersonFullView:', error);
      }

      // Tìm trong PersonView
      try {
        const personResult = await prisma.$queryRawUnsafe(`
          SELECT *
          FROM PersonView 
          WHERE FileNum = '${fileNum}'
        `);
        if ((personResult as any[]).length > 0) {
          result.person = (personResult as any[])[0];
        }
      } catch (error) {
        console.error('Lỗi khi tìm trong PersonView:', error);
      }

      // Tìm trong ViewHAResult
      try {
        const haResults = await prisma.$queryRawUnsafe(`
          SELECT *
          FROM ViewHAResult 
          WHERE FileNum = '${fileNum}'
          ORDER BY CreatedDate DESC
        `);
        result.haResults = haResults as any[];
      } catch (error) {
        console.error('Lỗi khi tìm trong ViewHAResult:', error);
      }

      // Tìm trong ViewMO
      try {
        const moResults = await prisma.$queryRawUnsafe(`
          SELECT *
          FROM ViewMO 
          WHERE FileNum = '${fileNum}'
          ORDER BY CreatedDate DESC
        `);
        result.moResults = moResults as any[];
      } catch (error) {
        console.error('Lỗi khi tìm trong ViewMO:', error);
      }

      // Tìm trong ViewPathologyResult và lấy ResultId
      let pathologyResultIds: Array<string | number> = [];
      try {
        const pathologyResults = await prisma.$queryRawUnsafe(`
          SELECT *
          FROM ViewPathologyResult 
          WHERE FileNum = '${fileNum}'
          ORDER BY CreatedDate DESC
        `);
        result.pathologyResults = pathologyResults as any[];

        // Thu thập ResultId (có thể là cột ResultId hoặc Id)
        const ids: Array<string | number> = [];
        (pathologyResults as any[]).forEach(r => {
          if (r && r.ResultId !== undefined && r.ResultId !== null) ids.push(r.ResultId);
          else if (r && r.Id !== undefined && r.Id !== null) ids.push(r.Id);
        });
        pathologyResultIds = ids;
      } catch (error) {
        console.error('Lỗi khi tìm trong ViewPathologyResult:', error);
      }

      // Lấy tất cả dữ liệu từ CN_PathologyResultValue theo ResultId
      try {
        if (pathologyResultIds.length > 0) {
          // Chuẩn bị danh sách IN an toàn (giả định ResultId là numeric nếu parse được)
          const normalizedIds = pathologyResultIds
            .filter(v => v !== null && v !== undefined)
            .map(v => {
              const n = Number(v);
              return Number.isFinite(n) ? n : `'${String(v).replace(/'/g, "''")}'`;
            })
            .join(',');

          const values = await prisma.$queryRawUnsafe(`
            SELECT *
            FROM CN_PathologyResultValue
            WHERE ResultId IN (${normalizedIds})
            ORDER BY ResultId DESC
          `);
          result.pathologyResultValues = values as any[];
        }
      } catch (error) {
        console.error('Lỗi khi lấy CN_PathologyResultValue:', error);
      }

      return result;
    } catch (error) {
      console.error('Lỗi khi tìm kiếm FileNum:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra xem FileNum có tồn tại trong bất kỳ bảng nào không
   */
  async checkFileNumExists(fileNum: string): Promise<boolean> {
    try {
      const tables = [
        'CR_Patient',
        'PatientSearchView',
        'PersonFullView',
        'PersonView',
        'ViewHAResult',
        'ViewMO',
        'ViewPathologyResult',
      ];

      for (const table of tables) {
        try {
          const result = await prisma.$queryRawUnsafe(`
            SELECT TOP 1 1 FROM ${table} WHERE FileNum = '${fileNum}'
          `);
          if ((result as any[]).length > 0) {
            return true;
          }
        } catch (error) {
          // Bỏ qua lỗi nếu bảng không tồn tại
          console.warn(`Bảng ${table} không tồn tại hoặc có lỗi:`, error);
        }
      }

      return false;
    } catch (error) {
      console.error('Lỗi khi kiểm tra FileNum:', error);
      return false;
    }
  }
}
