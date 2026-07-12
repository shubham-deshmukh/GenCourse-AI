import http from 'http';
import mongoose from 'mongoose';

// Set environment variables BEFORE importing the app to bypass hoisting constraints
process.env.NODE_ENV = 'development';

// Mock mongoose.connect to prevent real MongoDB sockets from opening
mongoose.connect = async () => ({
  connection: { host: 'mock-localhost' }
});

// Import models and app after env setup
import User from './models/User.js';
import Course from './models/Course.js';
import Lesson from './models/Lesson.js';
import LessonProgress from './models/LessonProgress.js';
import generationEvents from './services/scheduler/eventEmitter.js';

const mockCourseId = new mongoose.Types.ObjectId().toString();
const mockModuleId = new mongoose.Types.ObjectId();
const mockLessonId = new mongoose.Types.ObjectId();

// Mock User queries used in authMiddleware protect check
User.findOne = async () => {
  return {
    _id: new mongoose.Types.ObjectId('60d0fe4f5311236168e109ca'),
    name: 'Mock Developer',
    email: 'developer@example.com',
    role: 'admin',
    enrolledCourses: { push: () => {} },
    save: async () => {}
  };
};

Course.findById = () => {
  const mockCourse = {
    _id: mockCourseId,
    title: 'Load Testing Course',
    status: 'lessons_generating',
    modules: [
      {
        _id: mockModuleId,
        title: 'Load Test Module',
        toObject: function() { return this; }
      }
    ],
    toObject: function() { return this; }
  };
  const queryChain = {
    populate: () => queryChain,
    then: (resolve) => resolve(mockCourse)
  };
  return queryChain;
};

Lesson.find = (query) => {
  const mockLessons = [
    {
      _id: mockLessonId,
      moduleId: query.moduleId,
      title: 'Preset Load Test Lesson',
      content: new Map([['en', 'Initial syllabus content']]),
      order: 0,
      toObject: function() { return this; }
    }
  ];
  const queryChain = {
    sort: () => queryChain,
    then: (resolve) => resolve(mockLessons)
  };
  return queryChain;
};

LessonProgress.find = async () => [];

async function runLoadTest() {
  // Dynamically import app after environment overrides are applied
  const { default: app } = await import('./server.js');

  console.log('======================================================');
  console.log('      STARTING SSE STREAMING CONCURRENCY LOAD TEST     ');
  console.log('======================================================');

  const PORT = 5005;
  const server = app.listen(PORT);
  await new Promise(r => setTimeout(r, 500));
  
  const initialMemory = process.memoryUsage().rss;
  console.log(`[INFO] Server running on port ${PORT}`);
  console.log(`[INFO] Initial Memory (RSS): ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);

  const concurrencyTarget = 100;
  const connections = [];
  const connectionLatencies = [];
  let successfulConnections = 0;
  let packetsReceivedByClients = 0;

  console.log(`[INFO] Spawning ${concurrencyTarget} concurrent connections...`);

  const connectPromises = Array.from({ length: concurrencyTarget }).map((_, idx) => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const req = http.get(`http://localhost:${PORT}/api/courses/${mockCourseId}/stream?mockUser=true`, (res) => {
        if (res.statusCode === 200) {
          successfulConnections++;
          connectionLatencies.push(Date.now() - startTime);
        }

        res.on('data', (chunk) => {
          const chunkStr = chunk.toString();
          if (chunkStr.includes('event: progress') && chunkStr.includes('Broadcast Test Data')) {
            packetsReceivedByClients++;
          }
        });

        connections.push({ req, res });
        resolve();
      });

      req.on('error', (err) => {
        console.error(`[ERROR] Connection ${idx} failed:`, err.message);
        resolve();
      });
    });
  });

  await Promise.all(connectPromises);

  const peakMemory = process.memoryUsage().rss;
  const avgLatency = connectionLatencies.reduce((a, b) => a + b, 0) / connectionLatencies.length;

  console.log(`[SUCCESS] All connection handshakes completed.`);
  console.log(`[INFO] Active Connections  : ${successfulConnections} / ${concurrencyTarget}`);
  console.log(`[INFO] Peak Memory (RSS)    : ${(peakMemory / 1024 / 1024).toFixed(2)} MB`);
  console.log(`[INFO] Memory delta         : +${((peakMemory - initialMemory) / 1024 / 1024).toFixed(2)} MB`);
  console.log(`[INFO] Avg Handshake Latency: ${avgLatency.toFixed(1)}ms`);

  const listenerName = `course:${mockCourseId}`;
  console.log(`[INFO] Active event emitter listeners: ${generationEvents.listenerCount(listenerName)}`);
  console.log(`[INFO] Broadcasting test progress update packet...`);

  generationEvents.emit(listenerName, {
    type: 'progress',
    data: { message: 'Broadcast Test Data' }
  });

  await new Promise(r => setTimeout(r, 500));

  console.log(`[INFO] Broadcast packet received by: ${packetsReceivedByClients} / ${concurrencyTarget} client sockets`);

  console.log(`[INFO] Simulating premature client disconnects (teardown)...`);
  connections.forEach(({ req }) => {
    req.destroy();
  });

  await new Promise(r => setTimeout(r, 800));

  const postTeardownListeners = generationEvents.listenerCount(listenerName);
  const finalMemory = process.memoryUsage().rss;

  console.log('======================================================');
  console.log('             CONCURRENCY TEST RESULT REPORT           ');
  console.log('======================================================');
  console.log(`Target Clients Concurrency  : ${concurrencyTarget}`);
  console.log(`Successful Connections      : ${successfulConnections} / ${concurrencyTarget}`);
  console.log(`Handshake Avg Latency       : ${avgLatency.toFixed(1)}ms`);
  console.log(`Real-time Packets Broadcast : ${packetsReceivedByClients} / ${concurrencyTarget} clients`);
  console.log(`Clean Teardown Listeners    : ${postTeardownListeners} (expected: 0, no memory leaks!)`);
  console.log(`Final Memory Footprint (RSS): ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Memory Leak Delta           : ${((finalMemory - initialMemory) / 1024 / 1024).toFixed(2)} MB`);
  console.log('======================================================');

  server.close(() => {
    process.exit(postTeardownListeners === 0 && successfulConnections === concurrencyTarget ? 0 : 1);
  });
}

runLoadTest().catch((err) => {
  console.error('Fatal load test exception:', err);
  process.exit(1);
});
