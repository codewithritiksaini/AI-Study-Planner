import { query } from '../config/db.js';

async function seedStudent() {
  const email = 'student@gmail.com';
  const password = 'Student@123';
  const fullName = 'Student User';

  console.log('Seeding student user directly into Supabase PostgreSQL...');

  // 1. Check if user already exists in auth.users
  const existingUserRes = await query(
    `SELECT id, email, encrypted_password FROM auth.users WHERE email = $1;`,
    [email]
  );

  let userId;
  if (existingUserRes.rows.length > 0) {
    userId = existingUserRes.rows[0].id;
    console.log(`User already exists with ID: ${userId}. Updating password...`);
    await query(
      `UPDATE auth.users
       SET encrypted_password = crypt($1, gen_salt('bf', 10)),
           email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
           raw_app_meta_data = '{"provider": "email", "providers": ["email"]}'::jsonb,
           raw_user_meta_data = jsonb_build_object('full_name', $2::text),
           updated_at = NOW()
       WHERE id = $3;`,
      [password, fullName, userId]
    );
  } else {
    console.log('Inserting new user into auth.users...');
    const insertRes = await query(
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
        is_sso_user,
        is_anonymous,
        created_at,
        updated_at
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        $1,
        crypt($2, gen_salt('bf', 10)),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object('full_name', $3::text),
        false,
        false,
        NOW(),
        NOW()
      )
      RETURNING id;`,
      [email, password, fullName]
    );
    userId = insertRes.rows[0].id;
    console.log(`Created new auth.users record: ${userId}`);
  }

  // 2. Also ensure auth.identities has email identity
  const existingIdent = await query(
    `SELECT id FROM auth.identities WHERE user_id = $1 AND provider = 'email';`,
    [userId]
  );

  if (existingIdent.rows.length === 0) {
    await query(
      `INSERT INTO auth.identities (
        id,
        provider_id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        $1::text,
        $1::uuid,
        jsonb_build_object('sub', $1::text, 'email', $2::text),
        'email',
        NOW(),
        NOW(),
        NOW()
      );`,
      [userId, email]
    );
    console.log('Created auth.identities record.');
  }

  // 3. Ensure profile in public.profiles exists and is complete
  await query(
    `INSERT INTO public.profiles (
      id, full_name, email, branch, semester, target_cgpa, daily_available_hours,
      preferred_study_start_time, preferred_study_end_time, timezone, created_at, updated_at
    )
    VALUES (
      $1, $2, $3, 'Computer Science & Engineering', 6, 8.5, 3.5,
      '09:00:00', '21:00:00', 'Asia/Kolkata', NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      branch = COALESCE(public.profiles.branch, EXCLUDED.branch),
      semester = COALESCE(public.profiles.semester, EXCLUDED.semester),
      target_cgpa = COALESCE(public.profiles.target_cgpa, EXCLUDED.target_cgpa),
      daily_available_hours = COALESCE(public.profiles.daily_available_hours, EXCLUDED.daily_available_hours),
      timezone = COALESCE(public.profiles.timezone, EXCLUDED.timezone),
      updated_at = NOW();`,
    [userId, fullName, email]
  );
  console.log('Synchronized public.profiles record.');

  // 4. Verify password with Postgres crypt()
  const verifyRes = await query(
    `SELECT (encrypted_password = crypt($1, encrypted_password)) AS valid
     FROM auth.users
     WHERE id = $2;`,
    [password, userId]
  );

  console.log('Password validation result:', verifyRes.rows[0]);

  // 5. Enroll starter curriculum if none exists
  const subRes = await query(`SELECT COUNT(*) as count FROM public.subjects WHERE user_id = $1;`, [userId]);
  const subCount = parseInt(subRes.rows[0]?.count || 0, 10);
  if (subCount === 0) {
    console.log('Enrolling starter curriculum for student@gmail.com...');
    const sub1 = await query(
      `INSERT INTO public.subjects (user_id, name, color, target_score, exam_date)
       VALUES ($1, 'Database Management Systems', '#4f46e5', 85, (CURRENT_DATE + INTERVAL '12 days')::date)
       RETURNING id;`,
      [userId]
    );
    await query(
      `INSERT INTO public.topics (subject_id, name, difficulty, estimated_minutes, completion_percentage, status)
       VALUES 
         ($1, 'Relational Model & Normalization (1NF, 2NF, 3NF, BCNF)', 'HARD', 120, 100, 'COMPLETED'),
         ($1, 'SQL Joins, Aggregations & Nested Subqueries', 'MEDIUM', 90, 60, 'IN_PROGRESS'),
         ($1, 'ACID Properties & Transaction Schedules', 'MEDIUM', 90, 0, 'NOT_STARTED');`,
      [sub1.rows[0].id]
    );

    const sub2 = await query(
      `INSERT INTO public.subjects (user_id, name, color, target_score, exam_date)
       VALUES ($1, 'Operating Systems', '#059669', 90, (CURRENT_DATE + INTERVAL '5 days')::date)
       RETURNING id;`,
      [userId]
    );
    await query(
      `INSERT INTO public.topics (subject_id, name, difficulty, estimated_minutes, completion_percentage, status)
       VALUES 
         ($1, 'CPU Scheduling Algorithms (FCFS, SJF, Round Robin)', 'MEDIUM', 90, 100, 'COMPLETED'),
         ($1, 'Deadlock Detection, Prevention & Banker Algorithm', 'HARD', 110, 50, 'IN_PROGRESS');`,
      [sub2.rows[0].id]
    );
    console.log('Enrolled starter courses and syllabus topics.');
  }

  console.log('\n======================================================');
  console.log('✅ STUDENT USER RECORD IN SUPABASE POSTGRESQL READY');
  console.log(`🆔 User ID:  ${userId}`);
  console.log(`📧 Email:    ${email}`);
  console.log(`🔑 Password: ${password}`);
  console.log('======================================================\n');
  process.exit(0);
}

seedStudent().catch(err => {
  console.error('Error seeding student:', err);
  process.exit(1);
});
