/**
 * seed_demo_data.js
 *
 * Populates realistic, high-fidelity demo data for the AI Study Planner:
 * 1. Verified demo student (student@gmail.com / Student@123).
 * 2. 4 Core B.Tech CSE subjects with distinct color tokens and exam dates.
 * 3. 16 Syllabus topics spanning EASY, MEDIUM, and HARD difficulties.
 * 4. Topic prerequisite dependencies for curriculum sequencing.
 * 5. 14 days of realistic completed study sessions.
 * 6. Quizzes and topic performance mastery records (WEAK, NEEDS_PRACTICE, STRONG).
 * 7. Weekly study availability windows (Mon-Sun).
 * 8. Blocked blackout periods for realistic schedule conflicts.
 * 9. Active high-priority Phase 10 recommendations.
 * 10. Multi-day study plans with locked and unlocked sessions.
 */

import { query } from '../config/db.js';

async function seedDemoData() {
  console.log('🌱 Starting Comprehensive Demo Data Seeding for AI Study Planner...\n');

  try {
    const email = 'student@gmail.com';
    const password = 'Student@123';
    const fullName = 'Student User';

    // --------------------------------------------------------------------------
    // 1. Ensure Student User Exists in auth.users and public.profiles
    // --------------------------------------------------------------------------
    console.log('1. Checking student user credentials...');
    let userRes = await query(`SELECT id FROM auth.users WHERE email = $1;`, [email]);
    let userId;

    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id;
      console.log(`   Found existing student user: ${userId}`);
      await query(
        `UPDATE auth.users
         SET encrypted_password = crypt($1, gen_salt('bf', 10)),
             email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
             raw_user_meta_data = jsonb_build_object('full_name', $2::text),
             updated_at = NOW()
         WHERE id = $3;`,
        [password, fullName, userId]
      );
    } else {
      console.log('   Creating new student user in auth.users...');
      const insertUserRes = await query(
        `INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous, created_at, updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          $1, crypt($2, gen_salt('bf', 10)), NOW(),
          '{"provider": "email", "providers": ["email"]}'::jsonb,
          jsonb_build_object('full_name', $3::text), false, false, NOW(), NOW()
        ) RETURNING id;`,
        [email, password, fullName]
      );
      userId = insertUserRes.rows[0].id;
    }

    // Ensure public.profiles record
    await query(
      `INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE
       SET full_name = EXCLUDED.full_name, updated_at = NOW();`,
      [userId, email, fullName]
    );
    console.log('   ✅ Profile synchronized successfully.');

    // --------------------------------------------------------------------------
    // 2. Clean Existing Data (Idempotent Cascade)
    // --------------------------------------------------------------------------
    console.log('\n2. Cleaning existing student workspace data...');
    await query(`DELETE FROM public.study_plans WHERE user_id = $1;`, [userId]);
    await query(`DELETE FROM public.plan_generations WHERE user_id = $1;`, [userId]);
    await query(`DELETE FROM public.blocked_periods WHERE user_id = $1;`, [userId]);
    await query(`DELETE FROM public.study_availability WHERE user_id = $1;`, [userId]);
    await query(`DELETE FROM public.recommendation_feedback WHERE user_id = $1;`, [userId]);
    await query(`DELETE FROM public.recommendations WHERE user_id = $1;`, [userId]);
    await query(`DELETE FROM public.topic_performance WHERE user_id = $1;`, [userId]);
    await query(`DELETE FROM public.study_sessions WHERE user_id = $1;`, [userId]);
    await query(`DELETE FROM public.quizzes WHERE user_id = $1;`, [userId]);
    // Delete subjects cascades to topics and topic_prerequisites
    await query(`DELETE FROM public.subjects WHERE user_id = $1;`, [userId]);
    console.log('   ✅ Workspace cleaned.');

    // --------------------------------------------------------------------------
    // 3. Populate 4 Core B.Tech CSE Subjects
    // --------------------------------------------------------------------------
    console.log('\n3. Creating 4 Core B.Tech CSE Subjects...');
    const today = new Date();
    const addDays = (n) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return d.toISOString().split('T')[0];
    };

    const subjectsData = [
      { name: 'Operating Systems', code: 'CS301', color: '#4f46e5', targetScore: 85.00, examDate: addDays(14) },
      { name: 'Database Management Systems', code: 'CS302', color: '#059669', targetScore: 90.00, examDate: addDays(21) },
      { name: 'Computer Networks', code: 'CS303', color: '#0284c7', targetScore: 88.00, examDate: addDays(28) },
      { name: 'Data Structures & Algorithms', code: 'CS304', color: '#7c3aed', targetScore: 95.00, examDate: addDays(35) }
    ];

    const subjectsMap = {};
    for (const sub of subjectsData) {
      const res = await query(
        `INSERT INTO public.subjects (user_id, name, color, exam_date, target_score, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id, name;`,
        [userId, sub.name, sub.color, sub.examDate, sub.targetScore]
      );
      subjectsMap[sub.name] = res.rows[0].id;
      console.log(`   ✅ Subject: ${sub.name} (Exam: ${sub.examDate})`);
    }

    // --------------------------------------------------------------------------
    // 4. Populate 16 Topics (4 per subject)
    // --------------------------------------------------------------------------
    console.log('\n4. Creating 16 Detailed Syllabus Topics...');
    const topicsData = [
      // Operating Systems
      { subject: 'Operating Systems', name: 'Process Synchronization & Semaphores', diff: 'HARD', mins: 75, status: 'IN_PROGRESS', progress: 75 },
      { subject: 'Operating Systems', name: 'Deadlock Detection & Banker Algorithm', diff: 'HARD', mins: 60, status: 'IN_PROGRESS', progress: 50 },
      { subject: 'Operating Systems', name: 'CPU Scheduling & Multi-Level Queues', diff: 'MEDIUM', mins: 50, status: 'COMPLETED', progress: 100 },
      { subject: 'Operating Systems', name: 'Virtual Memory & Page Replacement', diff: 'HARD', mins: 70, status: 'NOT_STARTED', progress: 0 },

      // Database Management Systems
      { subject: 'Database Management Systems', name: 'Relational Algebra & Normalization', diff: 'HARD', mins: 75, status: 'IN_PROGRESS', progress: 85 },
      { subject: 'Database Management Systems', name: 'ACID Properties & Transaction Schedules', diff: 'MEDIUM', mins: 60, status: 'IN_PROGRESS', progress: 50 },
      { subject: 'Database Management Systems', name: 'B+ Tree Indexing & Query Execution', diff: 'HARD', mins: 65, status: 'NOT_STARTED', progress: 0 },
      { subject: 'Database Management Systems', name: 'SQL Joins, Aggregations & Subqueries', diff: 'EASY', mins: 45, status: 'COMPLETED', progress: 100 },

      // Computer Networks
      { subject: 'Computer Networks', name: 'OSI vs TCP/IP Layer Architecture', diff: 'EASY', mins: 45, status: 'COMPLETED', progress: 100 },
      { subject: 'Computer Networks', name: 'IP Addressing, Subnetting & CIDR', diff: 'MEDIUM', mins: 60, status: 'IN_PROGRESS', progress: 70 },
      { subject: 'Computer Networks', name: 'TCP Congestion Control & Sliding Windows', diff: 'HARD', mins: 75, status: 'IN_PROGRESS', progress: 30 },
      { subject: 'Computer Networks', name: 'DNS, HTTP/2 & TLS Handshake Protocols', diff: 'MEDIUM', mins: 55, status: 'NOT_STARTED', progress: 0 },

      // Data Structures & Algorithms
      { subject: 'Data Structures & Algorithms', name: 'Dynamic Programming: Knapsack & LCS', diff: 'HARD', mins: 90, status: 'IN_PROGRESS', progress: 40 },
      { subject: 'Data Structures & Algorithms', name: 'Graph Algorithms: Dijkstra & TopoSort', diff: 'HARD', mins: 80, status: 'IN_PROGRESS', progress: 85 },
      { subject: 'Data Structures & Algorithms', name: 'Binary Search Trees & AVL Balancing', diff: 'MEDIUM', mins: 60, status: 'COMPLETED', progress: 100 },
      { subject: 'Data Structures & Algorithms', name: 'Hash Tables & Collision Resolution', diff: 'EASY', mins: 45, status: 'COMPLETED', progress: 100 }
    ];

    const topicsMap = {};
    for (const t of topicsData) {
      const subjectId = subjectsMap[t.subject];
      const res = await query(
        `INSERT INTO public.topics (
          subject_id, name, difficulty, estimated_minutes, status, completion_percentage, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, name;`,
        [subjectId, t.name, t.diff, t.mins, t.status, t.progress]
      );
      topicsMap[t.name] = res.rows[0].id;
    }
    console.log(`   ✅ 16 Topics created across 4 subjects.`);

    // --------------------------------------------------------------------------
    // 5. Populate Topic Prerequisites
    // --------------------------------------------------------------------------
    console.log('\n5. Creating Topic Dependency Graph (Prerequisites)...');
    const prerequisites = [
      { topic: 'Virtual Memory & Page Replacement', prereq: 'Process Synchronization & Semaphores' },
      { topic: 'B+ Tree Indexing & Query Execution', prereq: 'Relational Algebra & Normalization' },
      { topic: 'TCP Congestion Control & Sliding Windows', prereq: 'IP Addressing, Subnetting & CIDR' },
      { topic: 'Graph Algorithms: Dijkstra & TopoSort', prereq: 'Binary Search Trees & AVL Balancing' }
    ];

    for (const p of prerequisites) {
      const topicId = topicsMap[p.topic];
      const prereqId = topicsMap[p.prereq];
      await query(
        `INSERT INTO public.topic_prerequisites (topic_id, prerequisite_topic_id, created_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT DO NOTHING;`,
        [topicId, prereqId]
      );
      console.log(`   ✅ Dependency: "${p.topic}" requires "${p.prereq}"`);
    }

    // --------------------------------------------------------------------------
    // 6. Populate Topic Performance Mastery Records
    // --------------------------------------------------------------------------
    console.log('\n6. Creating Topic Performance & Mastery Metrics...');
    const performanceRecords = [
      { topic: 'TCP Congestion Control & Sliding Windows', subject: 'Computer Networks', count: 3, avg: 42, level: 'WEAK' },
      { topic: 'Deadlock Detection & Banker Algorithm', subject: 'Operating Systems', count: 4, avg: 62, level: 'NEEDS_PRACTICE' },
      { topic: 'Relational Algebra & Normalization', subject: 'Database Management Systems', count: 5, avg: 88, level: 'STRONG' },
      { topic: 'Graph Algorithms: Dijkstra & TopoSort', subject: 'Data Structures & Algorithms', count: 6, avg: 84, level: 'STRONG' },
      { topic: 'Process Synchronization & Semaphores', subject: 'Operating Systems', count: 4, avg: 58, level: 'NEEDS_PRACTICE' }
    ];

    for (const p of performanceRecords) {
      const topicId = topicsMap[p.topic];
      const subjectId = subjectsMap[p.subject];
      await query(
        `INSERT INTO public.topic_performance (
          user_id, subject_id, topic_id, attempt_count, total_questions, correct_answers,
          average_percentage, recent_percentage, performance_level, confidence_score, last_attempted_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, 20, 14, $5, $5, $6, $5, NOW() - INTERVAL '1 day', NOW()
        ) ON CONFLICT (user_id, topic_id) DO UPDATE
        SET average_percentage = EXCLUDED.average_percentage, performance_level = EXCLUDED.performance_level;`,
        [userId, subjectId, topicId, p.count, p.avg, p.level]
      );
      console.log(`   ✅ Mastery: ${p.topic} -> ${p.level} (${p.avg}%)`);
    }

    // --------------------------------------------------------------------------
    // 7. Populate Historical Study Sessions (Past 14 Days)
    // --------------------------------------------------------------------------
    console.log('\n7. Creating Realistic Completed Study Sessions...');
    const historicalSessions = [
      { topic: 'CPU Scheduling & Multi-Level Queues', subject: 'Operating Systems', daysAgo: 12, mins: 50, rating: 5, notes: 'Mastered Round Robin quantum calculations.' },
      { topic: 'SQL Joins, Aggregations & Subqueries', subject: 'Database Management Systems', daysAgo: 10, mins: 45, rating: 4, notes: 'Solved nested grouping queries.' },
      { topic: 'OSI vs TCP/IP Layer Architecture', subject: 'Computer Networks', daysAgo: 8, mins: 45, rating: 5, notes: 'Reviewed header encapsulations.' },
      { topic: 'Binary Search Trees & AVL Balancing', subject: 'Data Structures & Algorithms', daysAgo: 6, mins: 60, rating: 4, notes: 'Implemented left-right rotation cases.' },
      { topic: 'Hash Tables & Collision Resolution', subject: 'Data Structures & Algorithms', daysAgo: 4, mins: 45, rating: 5, notes: 'Open addressing vs chaining analysis.' },
      { topic: 'Relational Algebra & Normalization', subject: 'Database Management Systems', daysAgo: 2, mins: 60, rating: 4, notes: 'Practiced 3NF vs BCNF decompositions.' },
      { topic: 'Process Synchronization & Semaphores', subject: 'Operating Systems', daysAgo: 1, mins: 55, rating: 3, notes: 'Classic dining philosophers problem.' }
    ];

    for (const s of historicalSessions) {
      const topicId = topicsMap[s.topic];
      const subjectId = subjectsMap[s.subject];
      const sessionDate = new Date(today);
      sessionDate.setDate(sessionDate.getDate() - s.daysAgo);
      const startTime = new Date(sessionDate);
      startTime.setHours(18, 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + s.mins);

      await query(
        `INSERT INTO public.study_sessions (
          user_id, subject_id, topic_id, started_at, ended_at, duration_minutes,
          status, notes, confidence_level, difficulty_feedback, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'COMPLETED', $7, $8, 'MEDIUM', $4, $4);`,
        [userId, subjectId, topicId, startTime.toISOString(), endTime.toISOString(), s.mins, s.notes, s.rating]
      );
    }
    console.log(`   ✅ Created ${historicalSessions.length} historical study sessions.`);

    // --------------------------------------------------------------------------
    // 8. Populate Weekly Study Availability
    // --------------------------------------------------------------------------
    console.log('\n8. Setting Up Weekly Availability Windows...');
    // Weekdays (Mon-Fri = 1 to 5): 18:00 - 21:30
    for (let day = 1; day <= 5; day++) {
      await query(
        `INSERT INTO public.study_availability (user_id, day_of_week, start_time, end_time, is_active)
         VALUES ($1, $2, '18:00:00', '21:30:00', true);`,
        [userId, day]
      );
    }
    // Weekends (Sat = 6, Sun = 0): 10:00 - 13:00 and 15:00 - 18:00
    for (const day of [0, 6]) {
      await query(
        `INSERT INTO public.study_availability (user_id, day_of_week, start_time, end_time, is_active)
         VALUES ($1, $2, '10:00:00', '13:00:00', true),
                ($1, $2, '15:00:00', '18:00:00', true);`,
        [userId, day]
      );
    }
    console.log('   ✅ Monday-Sunday availability windows configured (3.5h weekdays, 6h weekends).');

    // --------------------------------------------------------------------------
    // 9. Populate Blocked Periods (Blackout Commitments)
    // --------------------------------------------------------------------------
    console.log('\n9. Setting Up Blocked Blackout Periods...');
    await query(
      `INSERT INTO public.blocked_periods (user_id, day_of_week, start_time, end_time, reason)
       VALUES 
        ($1, 2, '19:30:00', '20:15:00', 'College OS Systems Lab'),
        ($1, 4, '19:00:00', '19:45:00', 'Weekly Coding Contest'),
        ($1, 6, '12:00:00', '13:00:00', 'Lunch & Campus Walk');`,
      [userId]
    );
    console.log('   ✅ 3 Recurring blackout periods added.');

    // --------------------------------------------------------------------------
    // 10. Populate Active High-Priority Phase 10 Recommendations
    // --------------------------------------------------------------------------
    console.log('\n10. Generating Active Recommendations...');
    const rec1Topic = topicsMap['TCP Congestion Control & Sliding Windows'];
    const rec1Sub = subjectsMap['Computer Networks'];
    const rec2Topic = topicsMap['Process Synchronization & Semaphores'];
    const rec2Sub = subjectsMap['Operating Systems'];

    await query(
      `INSERT INTO public.recommendations (
        user_id, subject_id, topic_id, type, priority, priority_score, title,
        message, estimated_minutes, status, reason_json, action_json, created_at, updated_at
      ) VALUES 
      (
        $1, $2, $3, 'WEAK_TOPIC', 'HIGH', 95.00, 'High Priority: Remediate TCP Congestion Control',
        'Recent quiz mastery is at 42%. Practice sliding window calculations and congestion window state transitions.',
        45, 'ACTIVE', '{"reason": "Low mastery tier identified from performance analytics"}'::jsonb,
        '{"action": "STUDY_TOPIC"}'::jsonb, NOW(), NOW()
      ),
      (
        $1, $4, $5, 'EXAM_PREPARATION', 'HIGH', 88.00, 'Exam Urgent: Process Synchronization & Mutex Semaphores',
        'Operating Systems final examination is scheduled in 14 days. Review classical IPC synchronization problems.',
        60, 'ACTIVE', '{"reason": "High exam urgency and incomplete topic curriculum"}'::jsonb,
        '{"action": "STUDY_TOPIC"}'::jsonb, NOW(), NOW()
      );`,
      [userId, rec1Sub, rec1Topic, rec2Sub, rec2Topic]
    );
    console.log('   ✅ 2 High-priority Phase 10 recommendations created.');

    // --------------------------------------------------------------------------
    // 11. Populate Study Plans for Today & Tomorrow (With Locked Session)
    // --------------------------------------------------------------------------
    console.log('\n11. Generating Active Study Timetable Sessions...');
    const todayStr = addDays(0);
    const tomorrowStr = addDays(1);

    const plansToInsert = [
      {
        subId: subjectsMap['Operating Systems'],
        topId: topicsMap['Process Synchronization & Semaphores'],
        date: todayStr,
        mins: 60,
        score: 95,
        reason: 'High priority exam revision',
        start: `${todayStr}T18:00:00Z`,
        end: `${todayStr}T19:00:00Z`,
        locked: true,
        title: 'Critical: Mutex & Semaphore Review',
        source: 'RECOMMENDATION'
      },
      {
        subId: subjectsMap['Database Management Systems'],
        topId: topicsMap['ACID Properties & Transaction Schedules'],
        date: todayStr,
        mins: 45,
        score: 75,
        reason: 'Regular curriculum coverage',
        start: `${todayStr}T19:15:00Z`,
        end: `${todayStr}T20:00:00Z`,
        locked: false,
        title: null,
        source: 'SYLLABUS'
      },
      {
        subId: subjectsMap['Computer Networks'],
        topId: topicsMap['TCP Congestion Control & Sliding Windows'],
        date: tomorrowStr,
        mins: 60,
        score: 90,
        reason: 'Weak topic practice',
        start: `${tomorrowStr}T18:00:00Z`,
        end: `${tomorrowStr}T19:00:00Z`,
        locked: false,
        title: null,
        source: 'RECOMMENDATION'
      }
    ];

    for (const p of plansToInsert) {
      await query(
        `INSERT INTO public.study_plans (
          user_id, subject_id, topic_id, plan_date, planned_minutes, priority_score, reason, status,
          start_time, end_time, is_locked, custom_title, task_source, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8, $9, $10, $11, $12, NOW(), NOW());`,
        [userId, p.subId, p.topId, p.date, p.mins, p.score, p.reason, p.start, p.end, p.locked, p.title, p.source]
      );
    }
    console.log('   ✅ 3 Active study sessions scheduled (including 1 locked session).');

    console.log('\n🎉 Comprehensive Demo Data Seeding COMPLETED SUCCESSFULLY!');
    console.log(`   Student: ${email} | Password: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seeding Failed:', err);
    process.exit(1);
  }
}

seedDemoData();
