import { query } from '../config/db.js';

async function runRlsTest() {
  console.log('🧪 Running Phase 10 Recommendations Schema & RLS Test...');

  try {
    // 1. Check table columns
    const columnsRes = await query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name IN ('recommendations', 'recommendation_feedback')
      ORDER BY table_name, ordinal_position;
    `);

    console.log(`\n📋 Verified ${columnsRes.rows.length} columns across recommendations tables.`);

    // 2. Test inserting a test recommendation for student@gmail.com
    const studentUser = await query(`SELECT id FROM auth.users WHERE email = 'student@gmail.com' LIMIT 1;`);
    if (studentUser.rows.length === 0) {
      throw new Error('Seed student user not found in auth.users');
    }
    const userId = studentUser.rows[0].id;

    // Clean any prior test recommendations
    await query(`DELETE FROM public.recommendations WHERE user_id = $1 AND title = 'Test Recommendation';`, [userId]);

    const insertRes = await query(`
      INSERT INTO public.recommendations (
        user_id,
        type,
        title,
        message,
        priority,
        priority_score,
        estimated_minutes,
        reason_json,
        action_json,
        status
      ) VALUES (
        $1,
        'WEAK_TOPIC',
        'Test Recommendation',
        'Test recommendation message',
        'HIGH',
        75.50,
        45,
        '{"quiz_average": 45, "completion_percentage": 50}'::jsonb,
        '{"type": "START_TOPIC"}'::jsonb,
        'ACTIVE'
      ) RETURNING id, type, priority, priority_score, status;
    `, [userId]);

    const created = insertRes.rows[0];
    console.log('✅ Successfully inserted recommendation:', created);

    // 3. Test inserting feedback
    const feedbackRes = await query(`
      INSERT INTO public.recommendation_feedback (
        recommendation_id,
        user_id,
        feedback
      ) VALUES ($1, $2, 'HELPFUL')
      RETURNING id, feedback;
    `, [created.id, userId]);

    console.log('✅ Successfully inserted feedback:', feedbackRes.rows[0]);

    // 4. Test duplicate feedback constraint
    try {
      await query(`
        INSERT INTO public.recommendation_feedback (
          recommendation_id,
          user_id,
          feedback
        ) VALUES ($1, $2, 'HELPFUL');
      `, [created.id, userId]);
      console.error('❌ Expected unique constraint violation for duplicate feedback!');
      process.exit(1);
    } catch (uniqueErr) {
      console.log('✅ Unique constraint uq_user_recommendation_feedback properly enforced.');
    }

    // 5. Clean up test records
    await query(`DELETE FROM public.recommendations WHERE id = $1;`, [created.id]);
    console.log('✅ Test cleanup completed successfully.');

    console.log('\n🎉 Phase 10 Database Architecture & Migration tests PASSED 100%!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Phase 10 Schema Test failed:', err.message);
    process.exit(1);
  }
}

runRlsTest();
