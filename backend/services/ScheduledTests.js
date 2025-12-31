const cron = require('node-cron');
const db = require('../database').default;
const axios = require('axios');
const ProcessMonitor = require('./ProcessMonitor');
const ActivityLogger = require('./ActivityLogger');

class ScheduledTests {
  static jobs = [];

  static async runScheduledTests(frequency) {
    console.log(`🕐 Running ${frequency} scheduled tests...`);

    try {
      // Get websites with the specified frequency
      const websites = db.prepare(`
        SELECT * FROM websites WHERE test_frequency = ? AND status = 'Active'
      `).all(frequency);

      if (websites.length === 0) {
        console.log(`   No websites configured for ${frequency} tests`);
        return;
      }

      console.log(`   Found ${websites.length} websites for ${frequency} tests`);

      // Run smoke test for each website
      for (const website of websites) {
        try {
          const processId = ProcessMonitor.start({
            process_type: 'scheduled_smoke_test',
            metadata: {
              website_id: website.id,
              website_name: website.name,
              url: website.url,
              frequency
            }
          });

          ActivityLogger.log({
            user: 'system',
            action: 'scheduled_test',
            resource: 'smoke_test',
            status: 'running',
            metadata: {
              website_id: website.id,
              frequency,
              process_id: processId
            }
          });

          console.log(`   ✓ Queued smoke test for ${website.name}`);

          // Run test asynchronously (don't await - fire and forget)
          this.executeSmokeTest(website, processId).catch(err => {
            console.error(`   ✗ Failed test for ${website.name}:`, err.message);
          });

        } catch (error) {
          console.error(`   ✗ Error queuing test for ${website.name}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Error running scheduled tests:', error.message);
    }
  }

  static async executeSmokeTest(website, processId) {
    const TEST_API_URL = process.env.TEST_API_URL || 'http://38.97.60.181:3003';

    try {
      ProcessMonitor.updateProgress(processId, 10);

      const response = await axios.post(`${TEST_API_URL}/api/test/smoke`, {
        target_url: website.url
      }, { timeout: 60000 });

      ProcessMonitor.updateProgress(processId, 80);

      const testData = response.data;
      const runId = `${Date.now()}-smoke-${website.id}`;

      // Store test run
      const runResult = db.prepare(`
        INSERT INTO test_runs (run_id, website_id, test_type, status, total_tests, passed, failed, duration_ms)
        VALUES (?, ?, 'Smoke', ?, ?, ?, ?, ?)
      `).run(
        runId,
        website.id,
        testData.success ? 'Pass' : 'Fail',
        testData.summary?.total || 0,
        testData.summary?.passed || 0,
        testData.summary?.failed || 0,
        testData.duration_ms || 0
      );

      const testRunId = runResult.lastInsertRowid;

      // Store results
      if (testData.results) {
        const insertResult = db.prepare(`
          INSERT INTO test_results (test_run_id, test_name, category, status, duration_ms, error_message, screenshot_url)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        for (const result of testData.results) {
          insertResult.run(
            testRunId,
            result.name,
            'UI',
            result.status === 'pass' ? 'Pass' : 'Fail',
            result.duration_ms || 0,
            result.message || null,
            result.screenshot || null
          );
        }
      }

      // Update website
      db.prepare(`
        UPDATE websites
        SET last_result = ?, last_tested_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(testData.success ? 'Pass' : 'Fail', website.id);

      ProcessMonitor.complete(processId, 'completed');

      ActivityLogger.log({
        user: 'system',
        action: 'scheduled_test',
        resource: 'smoke_test',
        status: testData.success ? 'success' : 'fail',
        metadata: {
          website_id: website.id,
          test_run_id: testRunId,
          passed: testData.summary?.passed,
          failed: testData.summary?.failed
        }
      });

    } catch (error) {
      ProcessMonitor.fail(processId, error.message);

      ActivityLogger.log({
        user: 'system',
        action: 'scheduled_test',
        resource: 'smoke_test',
        status: 'error',
        metadata: { website_id: website.id, error: error.message }
      });
    }
  }

  static start() {
    console.log('📅 Starting scheduled test jobs...');

    // Daily tests at 2:00 AM
    const dailyJob = cron.schedule('0 2 * * *', () => {
      this.runScheduledTests('Daily');
    });
    this.jobs.push({ frequency: 'Daily', schedule: '0 2 * * *', job: dailyJob });
    console.log('   ✓ Daily tests scheduled for 2:00 AM');

    // Weekly tests on Monday at 3:00 AM
    const weeklyJob = cron.schedule('0 3 * * 1', () => {
      this.runScheduledTests('Weekly');
    });
    this.jobs.push({ frequency: 'Weekly', schedule: '0 3 * * 1', job: weeklyJob });
    console.log('   ✓ Weekly tests scheduled for Monday 3:00 AM');

    console.log('✅ Scheduled test jobs started');
  }

  static stop() {
    console.log('Stopping scheduled test jobs...');
    this.jobs.forEach(({ frequency, job }) => {
      job.stop();
      console.log(`   ✓ Stopped ${frequency} job`);
    });
    this.jobs = [];
  }

  static getStatus() {
    return this.jobs.map(({ frequency, schedule }) => ({
      frequency,
      schedule,
      running: true
    }));
  }
}

module.exports = ScheduledTests;
