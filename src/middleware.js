import { verifyToken } from './auth.js';

export function requireAuth(req, res, next) {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Token requerido' });

    try {
        const payload = verifyToken(token);
        req.user = { id: payload.sub, email: payload.email };
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}

export function validateAmount(req, res, next) {
    const { amount } = req.body;
    if (amount !== undefined && Number(amount) <= 0) {
        return res.status(400).json({ error: 'El monto debe ser mayor que 0' });
    }
    next();
}