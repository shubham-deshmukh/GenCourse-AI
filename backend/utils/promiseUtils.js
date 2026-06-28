import pLimit from 'p-limit';

/**
 * Runs a mapping function over items with a concurrency limit.
 * This wrapper decouples the concurrency control implementation (p-limit)
 * from the callers, allowing future migration to queues (e.g. Bull/Redis) or other libraries.
 * 
 * @param {Array<any>} items - The items to map over.
 * @param {number} limit - The concurrency limit.
 * @param {Function} mapperFn - The mapping function, takes an item and returns a Promise.
 * @returns {Promise<Array<any>>}
 */
export const mapLimit = async (items, limit, mapperFn) => {
  const limitInstance = pLimit(limit);
  const tasks = items.map((item) => limitInstance(() => mapperFn(item)));
  return Promise.all(tasks);
};
