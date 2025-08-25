import express from 'express';
import { createDebt, getDebtById, listDebts, updateDebt, deleteDebt,
markDebtPaid } from '../db.js';
import { cacheGet, cacheSet, cacheInvalidateUserLists } from '../cache.js';
import { validateAmount } from '../middleware.js';

const router = express.Router();

// Crear deuda
router.post('/', validateAmount, async (req, res) => {
    try {
        const { title, amount, due_date } = req.body;
        
        if (!title || amount === undefined) return res.status(400).json({ error:'title y amount son requeridos' });
        
        const debt = await createDebt(req.user.id, { title, amount, due_date });
        await cacheInvalidateUserLists(req.user.id);
        res.status(201).json(debt);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error creando deuda' });
    }
});

// Listar deudas (todas/paid/pending)
router.get('/', async (req, res) => {
    try {
        const status = (req.query.status || 'all').toString();
        const key = `debts:${req.user.id}:${status}`;
        const cached = await cacheGet(key);
        
        if (cached) return res.json({ fromCache: true, data: cached });
        
        const data = await listDebts(req.user.id, { status });
        
        await cacheSet(key, data);
        
        res.json({ fromCache: false, data });
    
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error listando deudas' });
    }
});

// Obtener una deuda
router.get('/:id', async (req, res) => {
    try {
        const debt = await getDebtById(req.params.id, req.user.id);
        
        if (!debt) return res.status(404).json({ error: 'No encontrada' });
        
        res.json(debt);
    
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error obteniendo deuda' });
    }
});

// Editar deuda (no permite modificar una deuda ya pagada)
router.patch('/:id', validateAmount, async (req, res) => {
    try {
        const current = await getDebtById(req.params.id, req.user.id);
        
        if (!current) return res.status(404).json({ error: 'No encontrada' });
        if (current.paid) return res.status(400).json({ error: 'Una deuda pagada no puede ser modificada' });
        
        const allowed = {};
        
        if (req.body.title !== undefined) allowed.title = req.body.title;
        if (req.body.amount !== undefined) allowed.amount = req.body.amount;
        if (req.body.due_date !== undefined) allowed.due_date = req.body.due_date;
        if (Object.keys(allowed).length === 0) return res.status(400).json({ error:'Nada para actualizar' });
        
        const updated = await updateDebt(req.params.id, req.user.id, allowed);
        
        await cacheInvalidateUserLists(req.user.id);
        
        res.json(updated);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error actualizando deuda' });
    }
});

// Marcar como pagada
router.post('/:id/pay', async (req, res) => {
    try {
        const updated = await markDebtPaid(req.params.id, req.user.id);
        
        if (!updated) return res.status(400).json({ error: 'No se pudo marcar como pagada (¿ya estaba pagada?)' });
        
        await cacheInvalidateUserLists(req.user.id);
        
        res.json(updated);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error marcando como pagada' });
    }
});

// Eliminar deuda
router.delete('/:id', async (req, res) => {
    try {
        const ok = await deleteDebt(req.params.id, req.user.id);
        
        if (!ok) return res.status(404).json({ error: 'No encontrada' });
        
        await cacheInvalidateUserLists(req.user.id);
        
        res.status(204).send();
    
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error eliminando deuda' });
    }
});

export default router;