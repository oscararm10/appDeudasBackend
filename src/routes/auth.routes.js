import express from 'express';
import { createUser, findUserByEmail } from '../db.js';
import { hashPassword, comparePassword, signToken } from '../auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) return res.status(400).json({ error: 'email y password son requeridos' });
        
        const existing = await findUserByEmail(email);
        
        if (existing) return res.status(409).json({ error: 'Email ya registrado' });
        
        const passwordHash = await hashPassword(password);
        const user = await createUser({ email, passwordHash });
        const token = signToken(user);
        
        res.status(201).json({ user, token });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error registrando usuario' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await findUserByEmail(email || '');
        
        if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
        
        const ok = await comparePassword(password || '', user.password_hash);
        
        if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });
        
        const token = signToken(user);
        
        res.json({ token, user: { id: user.id, email: user.email } });
    
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error en login' });
    }
});

export default router;