import { query } from '../config/db.js';

async function migrateAddRole() {
  console.log('🔄 [MIGRATION] Starting Task 1: Adding role column to public.profiles...');

  try {
    // 1. Add role column with default 'student'
    await query(`
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS role VARCHAR(30) NOT NULL DEFAULT 'student';
    `);
    console.log('✅ Column public.profiles.role added successfully (or already exists).');

    // 2. Set Admin role for primary owner account
    const updateResult = await query(`
      UPDATE public.profiles 
      SET role = 'admin' 
      WHERE LOWER(email) = 'wopipi3442@omanarts.com'
      RETURNING id, full_name, email, role;
    `);

    if (updateResult.rows.length > 0) {
      console.log('✅ Assigned "admin" role to:', updateResult.rows[0]);
    } else {
      console.warn('⚠️ User wopipi3442@omanarts.com not found in public.profiles. Defaulted existing users to student.');
    }

    // 3. Verification query: Count by role
    const countResult = await query(`
      SELECT role, count(*)::int AS user_count 
      FROM public.profiles 
      GROUP BY role;
    `);
    console.log('📊 Role Distribution in Database:', countResult.rows);

    console.log('🎉 [MIGRATION COMPLETE] Task 1 succeeded.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateAddRole();
