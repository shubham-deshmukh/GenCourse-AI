import { create } from 'zustand'
import axios from 'axios'
import { COURSES_DATABASE, type CourseData } from '../components/PremiumInteractiveSimulator'

interface GenerationState {
  isGenerating: boolean
  progress: number
  logs: string[]
  currentStepIndex: number
  activeCourse: CourseData | null
  eventSource: EventSource | null
  startGeneration: (topic: string, onComplete?: () => void) => void
  resetGeneration: () => void
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  isGenerating: false,
  progress: 0,
  logs: [],
  currentStepIndex: -1,
  activeCourse: null,
  eventSource: null,

  startGeneration: (topic: string, onComplete?: () => void) => {
    // Close previous EventSource if exists
    const currentEventSource = get().eventSource
    if (currentEventSource) {
      currentEventSource.close()
    }

    set({
      isGenerating: true,
      progress: 0,
      logs: [
        `[ANALYZE] Ingesting prompt: "${topic}"`,
        `[ANALYZE] Initializing course creation handshake...`
      ],
      currentStepIndex: 0,
      activeCourse: null,
      eventSource: null,
    })

    axios.post('/api/courses', { title: topic })
      .then((res) => {
        const courseId = res.data.courseId
        if (!courseId) {
          throw new Error('No courseId returned from server')
        }

        set((state) => ({
          logs: [...state.logs, `[ANALYZE] Handshake successful. Course ID: ${courseId}`],
          currentStepIndex: 1,
          progress: 15,
        }))

        // Establish Server-Sent Events stream
        const isMock = localStorage.getItem('gencourse_mock_mode') === 'true';
        const token = localStorage.getItem('gencourse_token');
        const queryParams = [];
        if (isMock) {
          queryParams.push('mockUser=true');
        }
        if (token) {
          queryParams.push(`token=${token}`);
        }
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const streamUrl = `${apiBase}/api/courses/${courseId}/stream` + 
          (queryParams.length > 0 ? `?${queryParams.join('&')}` : '');
        const eventSource = new EventSource(streamUrl)
        set({ eventSource })

        eventSource.addEventListener('status', (event: any) => {
          try {
            const data = JSON.parse(event.data)
            const msg = data.message || ''
            
            // Format log message depending on content
            let formattedMsg = msg
            if (!msg.startsWith('[')) {
              if (msg.includes('Generating lesson') || msg.includes('lessons for module')) {
                formattedMsg = `[LESSON-GEN] ${msg}`
              } else if (msg.includes('outline') || msg.includes('Modules')) {
                formattedMsg = `[PLANNER] ${msg}`
              } else if (msg.includes('started')) {
                formattedMsg = `[ANALYZE] ${msg}`
              } else {
                formattedMsg = `[SYSTEM] ${msg}`
              }
            }
            
            set((state) => ({
              logs: [...state.logs, formattedMsg],
              progress: state.progress < 90 ? state.progress + 2 : state.progress
            }))
          } catch (err) {
            console.error('Error parsing SSE status:', err)
          }
        })

        eventSource.addEventListener('outline', (event: any) => {
          try {
            const data = JSON.parse(event.data)
            const outlineCourse = {
              ...data,
              modules: (data.modules || []).map((m: any) => ({
                ...m,
                lessons: m.lessons || []
              }))
            }
            
            set((state) => {
              // Avoid duplicate outline logs on catch-up
              const hasOutlineLog = state.logs.some(log => log.includes('Course curriculum structure generated'));
              const newLogs = hasOutlineLog 
                ? state.logs 
                : [...state.logs, `[PLANNER] Course curriculum structure generated and saved.`];

              return {
                logs: newLogs,
                activeCourse: outlineCourse,
                currentStepIndex: 2,
                progress: Math.max(state.progress, 35),
              }
            })
          } catch (err) {
            console.error('Error parsing SSE outline:', err)
          }
        })

        eventSource.addEventListener('lesson', (event: any) => {
          try {
            const data = JSON.parse(event.data)
            const { moduleId, lesson } = data

            set((state) => {
              const prevCourse = state.activeCourse
              if (!prevCourse) {
                return { 
                  logs: [...state.logs, `[LESSON-GEN] Synthesized and saved chapter: "${lesson.title}"`] 
                }
              }
              
              // Only log and advance progress if this lesson is newly completed (not previously loaded on catch-up)
              let isNewLesson = true;
              const module = (prevCourse.modules || []).find((m: any) => m._id === moduleId || m.title === moduleId);
              if (module) {
                const existing = (module.lessons || []).find((l: any) => l._id === lesson._id || l.title === lesson.title);
                if (existing && !existing.isPlaceholder) {
                  isNewLesson = false;
                }
              }

              const updatedModules = (prevCourse.modules || []).map((m: any) => {
                if (m._id === moduleId || m.title === moduleId) {
                  const lessonExists = (m.lessons || []).some((l: any) => l._id === lesson._id || l.title === lesson.title)
                  const newLessons = lessonExists
                    ? m.lessons.map((l: any) => (l._id === lesson._id || l.title === lesson.title) ? lesson : l)
                    : [...(m.lessons || []), lesson]
                  return { ...m, lessons: newLessons }
                }
                return m
              })

              const newLogs = isNewLesson 
                ? [...state.logs, `[LESSON-GEN] Synthesized and saved chapter: "${lesson.title}"`]
                : state.logs;

              const progressIncrement = isNewLesson ? 8 : 0;

              return {
                logs: newLogs,
                activeCourse: { ...prevCourse, modules: updatedModules },
                currentStepIndex: 3,
                progress: state.progress < 95 ? state.progress + progressIncrement : state.progress
              }
            })
          } catch (err) {
            console.error('Error parsing SSE lesson:', err)
          }
        })

        eventSource.addEventListener('complete', (event: any) => {
          try {
            const finalCourse = JSON.parse(event.data)
            eventSource.close()

            set((state) => ({
              logs: [...state.logs, `[SYSTEM] Generation complete. Launching student workspace portal...`],
              activeCourse: finalCourse,
              progress: 100,
              currentStepIndex: 5,
              isGenerating: false,
              eventSource: null,
            }))

            if (onComplete) {
              onComplete()
            }
          } catch (err) {
            console.error('Error parsing SSE complete:', err)
            eventSource.close()
            set({ isGenerating: false, eventSource: null })
          }
        })

        eventSource.addEventListener('error', (event: any) => {
          let errMsg = 'Unknown error'
          try {
            const data = JSON.parse(event.data)
            errMsg = data.message || 'Unknown error'
          } catch (_err) {}
          
          eventSource.close()
          set((state) => ({
            logs: [...state.logs, `[SYSTEM] Generation error: ${errMsg}`],
            isGenerating: false,
            eventSource: null,
          }))
        })

        eventSource.onerror = (err) => {
          console.error('SSE connection error:', err)
          
          // If browser is attempting auto-reconnect, keep generating state active
          if (eventSource.readyState === EventSource.CONNECTING) {
            set((state) => ({
              logs: [...state.logs, `[SYSTEM] Connection lost. Reconnecting in background...`],
            }))
          } else {
            eventSource.close()
            set((state) => ({
              logs: [...state.logs, `[SYSTEM] Connection closed or timed out.`],
              isGenerating: false,
              eventSource: null,
            }))
          }
        }
      })
      .catch((err) => {
        console.error('Error initiating course generation:', err)
        
        set((state) => ({
          logs: [
            ...state.logs,
            `[SYSTEM] Failed to initiate course generation: ${err.message}`,
            `[SYSTEM] Falling back to local offline preset database...`
          ]
        }))

        setTimeout(() => {
          set(() => {
            const matchingCourse = COURSES_DATABASE[topic] || COURSES_DATABASE['Intro to React Hooks']
            
            if (onComplete) {
              onComplete()
            }

            return {
              activeCourse: {
                ...matchingCourse,
                title: topic
              },
              progress: 100,
              currentStepIndex: 5,
              isGenerating: false
            }
          })
        }, 1500)
      })
  },

  resetGeneration: () => {
    const eventSource = get().eventSource
    if (eventSource) {
      eventSource.close()
    }
    set({
      isGenerating: false,
      progress: 0,
      logs: [],
      currentStepIndex: -1,
      activeCourse: null,
      eventSource: null,
    })
  }
}))
