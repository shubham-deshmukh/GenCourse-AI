import { EventEmitter } from 'events';

/**
 * Global singleton Event Emitter for streaming generation progress to SSE connections.
 */
class GenerationEventEmitter extends EventEmitter {}

export const generationEvents = new GenerationEventEmitter();
export default generationEvents;
