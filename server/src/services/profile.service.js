import { query } from '../config/db.js';

export class ProfileService {
  /**
   * Retrieves profile by authenticated user ID.
   * Scoped strictly by user ID.
   */
  async getProfileByUserId(userId) {
    const text = `
      SELECT
        id,
        full_name,
        email,
        branch,
        semester,
        target_cgpa,
        daily_available_hours,
        preferred_study_start_time,
        preferred_study_end_time,
        timezone,
        created_at,
        updated_at
      FROM public.profiles
      WHERE id = $1
      LIMIT 1;
    `;
    const res = await query(text, [userId]);
    return res.rows[0] || null;
  }

  /**
   * Initializes a minimal profile if one doesn't exist for the authenticated user.
   * Idempotent: does not overwrite existing customized profile data.
   */
  async getOrCreateProfile(userId, email, fullName = null) {
    let profile = await this.getProfileByUserId(userId);
    if (profile) {
      return profile;
    }

    const defaultName = fullName || (email ? email.split('@')[0] : 'Student');
    const text = `
      INSERT INTO public.profiles (
        id,
        full_name,
        email,
        branch,
        semester,
        target_cgpa,
        daily_available_hours,
        preferred_study_start_time,
        preferred_study_end_time,
        timezone
      )
      VALUES ($1, $2, $3, 'CSE', 1, 8.50, 3.00, '18:00:00', '22:00:00', 'Asia/Kolkata')
      ON CONFLICT (id) DO NOTHING
      RETURNING *;
    `;

    const res = await query(text, [userId, defaultName, email]);
    if (res.rows.length > 0) {
      return res.rows[0];
    }

    // In case of conflict, retrieve the existing profile
    return this.getProfileByUserId(userId);
  }

  /**
   * Updates an existing profile.
   * Only allows updating student-customizable fields.
   * Never permits updating id, email, created_at, or transferring ownership.
   */
  async updateProfile(userId, data) {
    const allowedFields = [
      'full_name',
      'branch',
      'semester',
      'target_cgpa',
      'daily_available_hours',
      'preferred_study_start_time',
      'preferred_study_end_time',
      'timezone'
    ];

    const updates = [];
    const values = [userId];
    let paramIndex = 2;

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(data[field]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return this.getProfileByUserId(userId);
    }

    // Always update updated_at timestamp
    updates.push(`updated_at = timezone('utc'::text, now())`);

    const text = `
      UPDATE public.profiles
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING
        id,
        full_name,
        email,
        branch,
        semester,
        target_cgpa,
        daily_available_hours,
        preferred_study_start_time,
        preferred_study_end_time,
        timezone,
        created_at,
        updated_at;
    `;

    const res = await query(text, values);
    return res.rows[0] || null;
  }
}

export const profileService = new ProfileService();
