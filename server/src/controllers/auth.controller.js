import { query } from '../config/db.js';
import { createSessionToken } from '../utils/token.js';

/**
 * Log in student user directly against Supabase PostgreSQL auth.users
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Both email and password are required.'
        }
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Authenticate user against auth.users using pgcrypto's crypt()
    const userResult = await query(
      `SELECT id, email, raw_user_meta_data, raw_app_meta_data, role, created_at
       FROM auth.users
       WHERE LOWER(email) = $1
         AND encrypted_password = crypt($2, encrypted_password)
       LIMIT 1;`,
      [normalizedEmail, password]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.'
        }
      });
    }

    const user = userResult.rows[0];

    // Fetch user profile from public.profiles
    const profileResult = await query(
      `SELECT * FROM public.profiles WHERE id = $1 LIMIT 1;`,
      [user.id]
    );
    const profile = profileResult.rows[0] || null;

    const userRole = profile?.role || 'student';

    // Generate signed session token
    const token = createSessionToken({
      id: user.id,
      email: user.email,
      role: userRole,
      user_metadata: {
        ...(user.raw_user_meta_data || {}),
        role: userRole
      }
    });

    const userPayload = {
      id: user.id,
      email: user.email,
      role: userRole,
      user_metadata: {
        ...(user.raw_user_meta_data || {}),
        role: userRole
      },
      profile
    };

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      session: {
        access_token: token,
        token_type: 'bearer',
        expires_in: 604800,
        user: userPayload
      },
      user: userPayload
    });
  } catch (error) {
    console.error('Auth login error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'An error occurred during authentication.'
      }
    });
  }
};

/**
 * Register a new student directly into Supabase PostgreSQL
 */
export const register = async (req, res) => {
  try {
    const { email, password, full_name, branch, semester, target_cgpa } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required.'
        }
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingResult = await query(
      `SELECT id FROM auth.users WHERE LOWER(email) = $1 LIMIT 1;`,
      [normalizedEmail]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'An account with this email address already exists.'
        }
      });
    }

    const metaData = {
      full_name: full_name || 'Student User'
    };

    // Create user in auth.users
    const userInsertResult = await query(
      `INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        $1,
        crypt($2, gen_salt('bf', 10)),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        $3::jsonb,
        NOW(),
        NOW()
      ) RETURNING id, email, raw_user_meta_data;`,
      [normalizedEmail, password, JSON.stringify(metaData)]
    );

    const newUser = userInsertResult.rows[0];

    // Create auth identity
    await query(
      `INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        $1::uuid,
        $2::jsonb,
        'email',
        $1::text,
        NOW(),
        NOW(),
        NOW()
      );`,
      [
        newUser.id,
        JSON.stringify({ sub: newUser.id, email: normalizedEmail })
      ]
    );

    // Upsert profile (handles cases where a Supabase trigger already generated the initial profile row)
    const profileInsert = await query(
      `INSERT INTO public.profiles (
        id,
        full_name,
        email,
        branch,
        semester,
        target_cgpa,
        daily_available_hours,
        timezone,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        branch = EXCLUDED.branch,
        semester = EXCLUDED.semester,
        target_cgpa = EXCLUDED.target_cgpa,
        updated_at = NOW()
      RETURNING *;`,
      [
        newUser.id,
        full_name || 'Student User',
        normalizedEmail,
        branch || 'Computer Science & Engineering',
        Number(semester) || 1,
        Number(target_cgpa) || 8.0,
        3.0,
        'Asia/Kolkata'
      ]
    );

    const profile = profileInsert.rows[0];
    const userRole = profile?.role || 'student';

    const token = createSessionToken({
      id: newUser.id,
      email: newUser.email,
      role: userRole,
      user_metadata: {
        ...(newUser.raw_user_meta_data || {}),
        role: userRole
      }
    });

    const userPayload = {
      id: newUser.id,
      email: newUser.email,
      role: userRole,
      user_metadata: {
        ...(newUser.raw_user_meta_data || {}),
        role: userRole
      },
      profile
    };

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      session: {
        access_token: token,
        token_type: 'bearer',
        expires_in: 604800,
        user: userPayload
      },
      user: userPayload
    });
  } catch (error) {
    console.error('Auth register error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_ERROR',
        message: error.message || 'Failed to create student account.',
        detail: error.detail || null
      }
    });
  }
};

/**
 * Get current authenticated user profile
 */
export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const profileResult = await query(
      `SELECT * FROM public.profiles WHERE id = $1 LIMIT 1;`,
      [userId]
    );

    const profile = profileResult.rows[0] || null;
    const userRole = profile?.role || req.user.role || 'student';

    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: userRole,
        user_metadata: {
          ...(req.user.user_metadata || {}),
          role: userRole
        },
        profile
      }
    });
  } catch (error) {
    console.error('Auth getMe error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Failed to retrieve user profile.'
      }
    });
  }
};
