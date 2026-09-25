import { profileService } from '../services/profile.service.js';
import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

const updateProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, { message: 'Full name must be at least 2 characters long' })
    .max(100, { message: 'Full name cannot exceed 100 characters' })
    .optional(),
  branch: z
    .string()
    .trim()
    .max(50, { message: 'Branch cannot exceed 50 characters' })
    .optional(),
  semester: z
    .number()
    .int({ message: 'Semester must be an integer' })
    .min(1, { message: 'Semester must be between 1 and 8' })
    .max(8, { message: 'Semester must be between 1 and 8' })
    .optional(),
  target_cgpa: z
    .number()
    .min(0.00, { message: 'CGPA cannot be negative' })
    .max(10.00, { message: 'CGPA cannot exceed 10.00' })
    .optional(),
  daily_available_hours: z
    .number()
    .min(0.00, { message: 'Available study hours cannot be negative' })
    .max(24.00, { message: 'Available study hours cannot exceed 24 hours' })
    .optional(),
  preferred_study_start_time: z
    .string()
    .regex(timeRegex, { message: 'Preferred start time must be a valid time (HH:MM or HH:MM:SS)' })
    .nullable()
    .optional(),
  preferred_study_end_time: z
    .string()
    .regex(timeRegex, { message: 'Preferred end time must be a valid time (HH:MM or HH:MM:SS)' })
    .nullable()
    .optional(),
  timezone: z
    .string()
    .min(2, { message: 'Timezone is required' })
    .max(60)
    .optional()
});

export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const email = req.user.email;
    const fullName = req.user.user_metadata?.full_name || null;

    // Gracefully fetch or initialize profile so the user never encounters a blank screen
    const profile = await profileService.getOrCreateProfile(userId, email, fullName);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Profile not found for authenticated user.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        profile
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Prevent prohibited updates
    if (req.body.id || req.body.email || req.body.created_at) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FORBIDDEN_FIELD_MUTATION',
          message: 'Modifying id, email, or created_at directly is not permitted.'
        }
      });
    }

    // Coerce numeric strings if submitted from forms
    const payload = { ...req.body };
    if (typeof payload.semester === 'string' && payload.semester !== '') {
      payload.semester = parseInt(payload.semester, 10);
    }
    if (typeof payload.target_cgpa === 'string' && payload.target_cgpa !== '') {
      payload.target_cgpa = parseFloat(payload.target_cgpa);
    }
    if (typeof payload.daily_available_hours === 'string' && payload.daily_available_hours !== '') {
      payload.daily_available_hours = parseFloat(payload.daily_available_hours);
    }

    const validation = updateProfileSchema.safeParse(payload);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid profile data',
          details: validation.error.format()
        }
      });
    }

    const updatedProfile = await profileService.updateProfile(userId, validation.data);

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Could not update profile because it was not found.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile: updatedProfile
      }
    });
  } catch (error) {
    next(error);
  }
};
