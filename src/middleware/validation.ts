import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './error';

// Validation middleware factory
export const validate = (schema: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationErrors: string[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        validationErrors.push(`Body: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        validationErrors.push(`Query: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate route parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        validationErrors.push(`Params: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // If there are validation errors, throw an error
    if (validationErrors.length > 0) {
      throw new AppError(
        `Validation failed: ${validationErrors.join('; ')}`,
        400,
        'VALIDATION_ERROR'
      );
    }

    next();
  };
};

// Common validation schemas
export const commonSchemas = {
  // Pagination schema
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
    search: Joi.string().optional(),
  }),

  // ID parameter schema
  id: Joi.object({
    id: Joi.number().integer().positive().required().messages({
      'number.base': 'ID phải là số',
      'number.positive': 'ID phải là số dương',
      'any.required': 'ID là bắt buộc',
    }),
  }),

  // Patient ID schema
  patientId: Joi.object({
    patientId: Joi.string().max(20).required().messages({
      'string.base': 'Mã bệnh nhân phải là chuỗi',
      'string.max': 'Mã bệnh nhân không được quá 20 ký tự',
      'any.required': 'Mã bệnh nhân là bắt buộc',
    }),
  }),

  // File upload schema
  fileUpload: Joi.object({
    fileName: Joi.string().max(255).optional(),
    description: Joi.string().max(500).optional(),
    fileType: Joi.number().integer().min(1).max(4).optional(),
  }),
};

// Medical imaging specific schemas
export const imagingSchemas = {
  // Imaging result creation
  createImagingResult: Joi.object({
    patientId: Joi.string().max(20).required().messages({
      'any.required': 'Mã bệnh nhân là bắt buộc',
    }),
    fileName: Joi.string().max(255).optional(),
    pathologyType: Joi.number().integer().min(1).max(6).required().messages({
      'any.required': 'Loại hình ảnh là bắt buộc',
      'number.min': 'Loại hình ảnh không hợp lệ',
      'number.max': 'Loại hình ảnh không hợp lệ',
    }),
    examDate: Joi.date().optional(),
    resultContent: Joi.string().optional(),
    doctorId: Joi.string().max(20).optional(),
  }),

  // Update imaging result
  updateImagingResult: Joi.object({
    fileName: Joi.string().max(255).optional(),
    pathologyType: Joi.number().integer().min(1).max(6).optional(),
    examDate: Joi.date().optional(),
    resultContent: Joi.string().optional(),
    doctorId: Joi.string().max(20).optional(),
    status: Joi.number().integer().min(1).max(2).optional(),
  }),

  // Graphic creation
  createGraphic: Joi.object({
    patientId: Joi.string().max(20).optional(),
    fileName: Joi.string().max(255).optional(),
    graphicType: Joi.string().max(50).optional(),
    description: Joi.string().max(500).optional(),
  }),

  // Pathology image creation
  createPathologyImage: Joi.object({
    resultId: Joi.number().integer().positive().optional(),
    filename: Joi.string().max(255).optional(),
    imageType: Joi.string().max(50).optional(),
    description: Joi.string().max(500).optional(),
  }),

  // PACS request creation
  createPACSRequest: Joi.object({
    patientId: Joi.string().max(20).required().messages({
      'any.required': 'Mã bệnh nhân là bắt buộc',
    }),
    studyId: Joi.string().max(100).optional(),
    seriesId: Joi.string().max(100).optional(),
    fileResultURL: Joi.string().max(500).optional(),
    viewURL: Joi.string().max(500).optional(),
    modality: Joi.string().max(10).optional(),
    studyDate: Joi.date().optional(),
    description: Joi.string().max(500).optional(),
  }),
};

// Patient and doctor schemas
export const userSchemas = {
  // Patient creation
  createPatient: Joi.object({
    id: Joi.string().max(20).required().messages({
      'any.required': 'Mã bệnh nhân là bắt buộc',
    }),
    fullName: Joi.string().max(100).required().messages({
      'any.required': 'Họ tên là bắt buộc',
    }),
    birthDate: Joi.date().optional(),
    gender: Joi.number().integer().min(1).max(2).optional(),
    phone: Joi.string().max(20).optional(),
    address: Joi.string().max(300).optional(),
    email: Joi.string().email().max(100).optional().messages({
      'string.email': 'Email không hợp lệ',
    }),
  }),

  // Update patient
  updatePatient: Joi.object({
    fullName: Joi.string().max(100).optional(),
    birthDate: Joi.date().optional(),
    gender: Joi.number().integer().min(1).max(2).optional(),
    phone: Joi.string().max(20).optional(),
    address: Joi.string().max(300).optional(),
    email: Joi.string().email().max(100).optional().messages({
      'string.email': 'Email không hợp lệ',
    }),
  }),

  // Doctor creation
  createDoctor: Joi.object({
    id: Joi.string().max(20).required().messages({
      'any.required': 'Mã bác sĩ là bắt buộc',
    }),
    fullName: Joi.string().max(100).required().messages({
      'any.required': 'Họ tên là bắt buộc',
    }),
    speciality: Joi.string().max(100).optional(),
    phone: Joi.string().max(20).optional(),
    email: Joi.string().email().max(100).optional().messages({
      'string.email': 'Email không hợp lệ',
    }),
    department: Joi.string().max(100).optional(),
  }),
};
