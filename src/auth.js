import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export async function hashPassword(password) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

export function signToken(user) {
    return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn:'7d' });
}

export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

