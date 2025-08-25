import Redis from 'ioredis';


let redis = null;
const inMemory = new Map();
const TTL = parseInt(process.env.CACHE_TTL_SECONDS || '60', 10);


export function cacheAvailable() { return !!redis; }


export function initCache() {
if (process.env.REDIS_URL) {
redis = new Redis(process.env.REDIS_URL, { lazyConnect: true });
redis.on('error', (e) => console.warn('[Redis] error:', e.message));
redis.connect().catch(() => { redis = null; });
}
}


function memKey(key) { return `k:${key}`; }


export async function cacheGet(key) {
if (redis) {
const v = await redis.get(key);
return v ? JSON.parse(v) : null;
}
const entry = inMemory.get(memKey(key));
if (!entry) return null;
const { value, expiresAt } = entry;
if (Date.now() > expiresAt) { inMemory.delete(memKey(key)); return null; }
return value;
}


export async function cacheSet(key, value, ttlSec = TTL) {
const str = JSON.stringify(value);
if (redis) {
await redis.set(key, str, 'EX', ttlSec);
} else {
inMemory.set(memKey(key), { value, expiresAt: Date.now() + ttlSec * 1000 });
}
}


export async function cacheDel(key) {
if (redis) { await redis.del(key); }
else { inMemory.delete(memKey(key)); }
}


export async function cacheInvalidateUserLists(userId) {
await cacheDel(`debts:${userId}:all`);
await cacheDel(`debts:${userId}:pending`);
await cacheDel(`debts:${userId}:paid`);
}