# Queue Scheduler Test Scenarios

This suite validates the core task scheduling logic, worker orchestration, crash recovery, and rate limit throttling of the `LessonScheduler` queue.

---

## Test Cases Documented

### Test 1: Concurrency and Unique Execution (10 Jobs, 3 Workers)
* **Objective:** Ensure the scheduler restricts active jobs to the combined maximum capacity of available workers and handles multiple concurrent items without duplicate executions.
* **Setup:**
  * Mock 3 workers, each with a concurrency limit of 1 (total capacity = 3).
  * Push 10 distinct `LessonJob` instances to the scheduler queue.
  * Run the scheduler execution loop ticks.
* **Assertions:**
  * At any moment, the sum of active jobs across all workers does not exceed 3.
  * Every job finishes exactly once.
  * No duplicate job runs are registered in the worker logs.

### Test 2: Worker Crash Recovery (Fail and Retry)
* **Objective:** Ensure that if a worker crashes (throws an exception during execution), the job is retained in the queue, marked for retry, and successfully processed on subsequent attempts.
* **Setup:**
  * Mock a worker to fail/crash on its first run of a specific job.
  * Configure subsequent runs of that job to succeed.
  * Trigger scheduler ticks.
* **Assertions:**
  * The first run fails and increments the job's retry counter.
  * The second run succeeds.
  * The job status eventually transitions to `completed`.

### Test 3: Rate Limiting & Cooldown (Wait and Run Later)
* **Objective:** Verify that when a worker hits a rate limit (simulated by a temporary cooldown state), the queue scheduler does not crash or discard the job. Instead, the job is deferred and successfully processed once the cooldown expires.
* **Setup:**
  * Enqueue a job.
  * Mock the worker to return a rate-limit exception on the first call, setting a cooldown period (e.g. 100ms in the test mock).
  * Run scheduler ticks during the cooldown period and verify the job remains pending.
  * Advance time or wait out the cooldown, run the tick again, and verify success.
* **Assertions:**
  * During the cooldown period, the job is skipped by the scheduling algorithm.
  * After the cooldown expires, the worker accepts and completes the job.
