import { getSupabaseAdmin } from '../config/supabase.js';
import { query } from '../config/db.js';

async function createStudentUser() {
  const email = 'student@gmail.com';
  const password = 'Student@123';
  const fullName = 'Student User';

  console.log(`\n======================================================`);
  console.log(`🔐 Creating/Updating Supabase User: ${email}`);
  console.log(`======================================================\n`);

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin client not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  // 1. Check if user already exists in auth.users via admin API
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
  }

  let user = listData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (user) {
    console.log(`Found existing user with ID: ${user.id}`);
    console.log('Updating password and confirming email...');
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        password: password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      }
    );

    if (updateError) {
      throw updateError;
    }
    user = updateData.user;
    console.log('✅ User credentials successfully updated.');
  } else {
    console.log('User does not exist. Creating new user in Supabase Auth...');
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (createError) {
      throw createError;
    }
    user = createData.user;
    console.log(`✅ User successfully created in Supabase Auth (ID: ${user.id}).`);
  }

  // 2. Ensure public.profiles record exists and is complete
  console.log('Syncing academic profile in public.profiles...');
  await query(
    `INSERT INTO public.profiles (
      id, full_name, email, branch, semester, target_cgpa, daily_available_hours,
      preferred_study_start_time, preferred_study_end_time, timezone, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      branch = COALESCE(public.profiles.branch, EXCLUDED.branch),
      semester = COALESCE(public.profiles.semester, EXCLUDED.semester),
      target_cgpa = COALESCE(public.profiles.target_cgpa, EXCLUDED.target_cgpa),
      daily_available_hours = COALESCE(public.profiles.daily_available_hours, EXCLUDED.daily_available_hours),
      preferred_study_start_time = COALESCE(public.profiles.preferred_study_start_time, EXCLUDED.preferred_study_start_time),
      preferred_study_end_time = COALESCE(public.profiles.preferred_study_end_time, EXCLUDED.preferred_study_end_time),
      timezone = COALESCE(public.profiles.timezone, EXCLUDED.timezone),
      updated_at = NOW();`,
    [
      user.id,
      fullName,
      email,
      'Computer Science & Engineering',
      6,
      8.5,
      3.5,
      '09:00:00',
      '21:00:00',
      'Asia/Kolkata'
    ]
  );

  const profRes = await query(`SELECT * FROM public.profiles WHERE id = $1;`, [user.id]);
  console.log('✅ Academic profile verified in database:', {
    id: profRes.rows[0]?.id,
    email: profRes.rows[0]?.email,
    full_name: profRes.rows[0]?.full_name,
    branch: profRes.rows[0]?.branch,
    semester: profRes.rows[0]?.semester,
    target_cgpa: profRes.rows[0]?.target_cgpa,
    daily_available_hours: profRes.rows[0]?.daily_available_hours
  });

  // 3. Check if user already has subjects or needs starter subjects
  const subRes = await query(`SELECT COUNT(*) as count FROM public.subjects WHERE user_id = $1;`, [user.id]);
  const subjectCount = parseInt(subRes.rows[0]?.count || 0, 10);
  console.log(`Student currently has ${subjectCount} subjects enrolled.`);

  if (subjectCount === 0) {
    console.log('Enrolling standard B.Tech CSE subjects & topics for student...');

    // Subject 1: Database Management Systems
    const sub1 = await query(
      `INSERT INTO public.subjects (user_id, name, code, color, target_score, exam_date)
       VALUES ($1, 'Database Management Systems', 'CS501', '#4f46e5', 85, (CURRENT_DATE + INTERVAL '12 days')::date)
       RETURNING id;`,
      [user.id]
    );
    const sub1Id = sub1.rows[0].id;

    // Topics for Subject 1
    await query(
      `INSERT INTO public.topics (subject_id, name, difficulty, estimated_minutes, completion_percentage, status)
       VALUES 
         ($1, 'Relational Model & Normalization (1NF, 2NF, 3NF, BCNF)', 'HARD', 120, 100, 'COMPLETED'),
         ($1, 'SQL Joins, Aggregations & Nested Subqueries', 'MEDIUM', 90, 60, 'IN_PROGRESS'),
         ($1, 'ACID Properties & Transaction Schedules', 'MEDIUM', 90, 0, 'NOT_STARTED'),
         ($1, 'Concurrency Control (2PL, Timestamp Ordering)', 'HARD', 100, 0, 'NOT_STARTED');`,
      [sub1Id]
    );

    // Subject 2: Operating Systems
    const sub2 = await query(
      `INSERT INTO public.subjects (user_id, name, code, color, target_score, exam_date)
       VALUES ($1, 'Operating Systems', 'CS502', '#059669', 90, (CURRENT_DATE + INTERVAL '5 days')::date)
       RETURNING id;`,
      [user.id]
    );
    const sub2Id = sub2.rows[0].id;

    // Topics for Subject 2
    await query(
      `INSERT INTO public.topics (subject_id, name, difficulty, estimated_minutes, completion_percentage, status)
       VALUES 
         ($1, 'CPU Scheduling Algorithms (FCFS, SJF, Round Robin)', 'MEDIUM', 90, 100, 'COMPLETED'),
         ($1, 'Deadlock Detection, Prevention & Banker Algorithm', 'HARD', 110, 50, 'IN_PROGRESS'),
         ($1, 'Virtual Memory, Paging & Page Replacement (FIFO, LRU)', 'HARD', 120, 0, 'NOT_STARTED');`,
      [sub2Id]
    );

    // Subject 3: Computer Networks
    const sub3 = await query(
      `INSERT INTO public.subjects (user_id, name, code, color, target_score, exam_date)
       VALUES ($1, 'Computer Networks', 'CS503', '#d97706', 80, (CURRENT_DATE + INTERVAL '24 days')::date)
       RETURNING id;`,
      [user.id]
    );
    const sub3Id = sub3.rows[0].id;

    // Topics for Subject 3
    await query(
      `INSERT INTO public.topics (subject_id, name, difficulty, estimated_minutes, completion_percentage, status)
       VALUES 
         ($1, 'OSI & TCP/IP Protocol Architecture', 'EASY', 60, 100, 'COMPLETED'),
         ($1, 'Subnetting, CIDR & IPv4/IPv6 Addressing', 'HARD', 100, 30, 'IN_PROGRESS'),
         ($1, 'TCP Congestion Control & Sliding Window', 'MEDIUM', 90, 0, 'NOT_STARTED');`,
      [sub3Id]
    );

    console.log('✅ 3 Courses and syllabus topics enrolled successfully.');
  }

  console.log(`\n======================================================`);
  console.log(`🎉 READY FOR LOGIN!`);
  console.log(`📧 Email:    ${email}`);
  console.log(`🔑 Password: ${password}`);
  console.log(`======================================================\n`);

  process.exit(0);
}

createStudentUser().catch(err => {
  console.error('Fatal error setting up user:', err);
  process.exit(1);
});
