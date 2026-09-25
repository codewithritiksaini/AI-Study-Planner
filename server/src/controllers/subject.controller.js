import { subjectService } from '../services/subject.service.js';
import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const createSubjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Subject name is required' })
    .max(100, { message: 'Subject name cannot exceed 100 characters' }),
  description: z
    .string()
    .trim()
    .max(500, { message: 'Description cannot exceed 500 characters' })
    .optional()
    .nullable(),
  exam_date: z
    .string()
    .regex(dateRegex, { message: 'Exam date must be in YYYY-MM-DD format' })
    .optional()
    .nullable(),
  target_score: z
    .number()
    .min(0, { message: 'Target score cannot be negative' })
    .max(100, { message: 'Target score cannot exceed 100%' })
    .optional()
    .nullable(),
  color: z
    .string()
    .max(30)
    .optional()
    .nullable(),
  icon: z
    .string()
    .max(50)
    .optional()
    .nullable()
});

const updateSubjectSchema = createSubjectSchema.partial();

export const getSubjects = async (req, res, next) => {
  try {
    const subjects = await subjectService.getSubjectsByUserId(req.user.id);
    return res.status(200).json({
      success: true,
      data: {
        subjects
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getSubjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = await subjectService.getSubjectById(id, req.user.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SUBJECT_NOT_FOUND',
          message: 'Subject not found or you do not have permission to view it.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        subject
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (payload.target_score !== undefined && payload.target_score !== null && payload.target_score !== '') {
      payload.target_score = parseFloat(payload.target_score);
    }

    const validation = createSubjectSchema.safeParse(payload);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid subject data',
          details: validation.error.format()
        }
      });
    }

    try {
      const created = await subjectService.createSubject(req.user.id, validation.data);
      return res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data: {
          subject: created
        }
      });
    } catch (dbErr) {
      if (dbErr.code === '23505') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_SUBJECT_NAME',
            message: `A subject with the name "${validation.data.name}" already exists in your curriculum.`
          }
        });
      }
      throw dbErr;
    }
  } catch (error) {
    next(error);
  }
};

export const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Disallow mutating user_id or id
    if (req.body.id || req.body.user_id || req.body.created_at) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FORBIDDEN_FIELD_MUTATION',
          message: 'Directly modifying id, user_id, or created_at is not permitted.'
        }
      });
    }

    const payload = { ...req.body };
    if (payload.target_score !== undefined && payload.target_score !== null && payload.target_score !== '') {
      payload.target_score = parseFloat(payload.target_score);
    }

    const validation = updateSubjectSchema.safeParse(payload);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid subject data'
        }
      });
    }

    try {
      const updated = await subjectService.updateSubject(id, req.user.id, validation.data);

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SUBJECT_NOT_FOUND',
            message: 'Subject not found or you do not have permission to edit it.'
          }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Subject updated successfully',
        data: {
          subject: updated
        }
      });
    } catch (dbErr) {
      if (dbErr.code === '23505') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_SUBJECT_NAME',
            message: `A subject with the name "${validation.data.name}" already exists in your curriculum.`
          }
        });
      }
      throw dbErr;
    }
  } catch (error) {
    next(error);
  }
};

export const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await subjectService.deleteSubject(id, req.user.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SUBJECT_NOT_FOUND',
          message: 'Subject not found or you do not have permission to delete it.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: `Subject "${deleted.name}" and all its syllabus topics were deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const summary = await subjectService.getDashboardSummary(req.user.id);
    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};
