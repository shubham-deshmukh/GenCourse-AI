import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useGenerationStore } from '../useGenerationStore';
import axios from 'axios';

// Mock Axios calls
vi.mock('axios');

// Mock localStorage for Node environment
(globalThis as any).localStorage = {
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
} as any;

// Mock EventSource class to simulate SSE streams inside Node/jsdom
class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  options: any;
  listeners: Record<string, Function> = {};
  readyState: number = 1;
  onerror: Function | null = null;

  constructor(url: string, options: any) {
    this.url = url;
    this.options = options;
    MockEventSource.instances.push(this);
  }

  addEventListener(event: string, cb: Function) {
    this.listeners[event] = cb;
  }

  emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event]({ data: JSON.stringify(data) });
    }
  }

  close() {
    this.readyState = 2;
  }
}

(globalThis as any).EventSource = MockEventSource as any;

describe('useGenerationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockEventSource.instances = [];
    useGenerationStore.getState().resetGeneration();
  });

  test('should initialize with correct default state', () => {
    const state = useGenerationStore.getState();
    expect(state.isGenerating).toBe(false);
    expect(state.progress).toBe(0);
    expect(state.logs).toEqual([]);
    expect(state.activeCourse).toBeNull();
    expect(state.eventSource).toBeNull();
  });

  test('startGeneration success flow with SSE events', async () => {
    const mockCourseId = 'course-123';
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { courseId: mockCourseId, title: 'Test Course' }
    });

    const store = useGenerationStore.getState();
    
    // Trigger generation start
    store.startGeneration('Test Course');

    // Asserts immediate states
    expect(useGenerationStore.getState().isGenerating).toBe(true);
    expect(useGenerationStore.getState().progress).toBe(0);
    expect(useGenerationStore.getState().logs[0]).toContain('Ingesting prompt');

    // Flush microtasks for Axios post promise to resolve
    await new Promise(r => setTimeout(r, 0));

    expect(useGenerationStore.getState().currentStepIndex).toBe(1);
    expect(useGenerationStore.getState().progress).toBe(15);
    expect(useGenerationStore.getState().logs).toContain('[ANALYZE] Handshake successful. Course ID: course-123');

    const sseInstance = MockEventSource.instances[0];
    expect(sseInstance).toBeDefined();

    // 1. Emit status packet
    sseInstance.emit('status', { message: 'Outline queued' });
    expect(useGenerationStore.getState().logs).toContain('[SYSTEM] Outline queued');
    expect(useGenerationStore.getState().progress).toBe(17);

    // 2. Emit outline packet
    const mockOutline = {
      title: 'Test Course',
      description: 'Course description',
      modules: [{ _id: 'mod-1', title: 'Module 1', lessons: [] }]
    };
    sseInstance.emit('outline', mockOutline);
    expect(useGenerationStore.getState().activeCourse?.title).toBe('Test Course');
    expect(useGenerationStore.getState().activeCourse?.modules[0]._id).toBe('mod-1');
    expect(useGenerationStore.getState().currentStepIndex).toBe(2);
    expect(useGenerationStore.getState().progress).toBe(35);

    // 3. Emit lesson completion packet
    const mockLesson = { _id: 'lesson-1', title: 'Lesson 1', order: 0 };
    sseInstance.emit('lesson', { moduleId: 'mod-1', lesson: mockLesson });
    expect(useGenerationStore.getState().activeCourse?.modules[0].lessons[0]._id).toBe('lesson-1');
    expect(useGenerationStore.getState().logs).toContain('[LESSON-GEN] Synthesized and saved chapter: "Lesson 1"');

    // 4. Emit complete packet
    const finalCourse = { title: 'Test Course', completed: true };
    sseInstance.emit('complete', finalCourse);
    expect(useGenerationStore.getState().isGenerating).toBe(false);
    expect(useGenerationStore.getState().progress).toBe(100);
    expect(useGenerationStore.getState().currentStepIndex).toBe(5);
    expect((useGenerationStore.getState().activeCourse as any)?.completed).toBe(true);
  });

  test('startGeneration fallback on axios error', async () => {
    vi.mocked(axios.post).mockRejectedValueOnce(new Error('Network Error'));

    const store = useGenerationStore.getState();
    store.startGeneration('Test Course');

    await new Promise(r => setTimeout(r, 0));
    expect(useGenerationStore.getState().logs).toContain('[SYSTEM] Failed to initiate course generation: Network Error');
    expect(useGenerationStore.getState().logs).toContain('[SYSTEM] Falling back to local offline preset database...');
    
    // Wait for the mock fallback timer (1.5 seconds in source code)
    await new Promise(r => setTimeout(r, 1600));

    expect(useGenerationStore.getState().isGenerating).toBe(false);
    expect(useGenerationStore.getState().progress).toBe(100);
    expect(useGenerationStore.getState().activeCourse).not.toBeNull();
    expect(useGenerationStore.getState().activeCourse?.title).toBe('Test Course');
  });
});
