import 'dotenv/config';
import express from 'express';
import cors from 'cors';
11
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import debtsRoutes from './routes/debts.routes.js';
import { requireAuth } from './middleware.js';
import { initCache, cacheAvailable } from './cache.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

initCache();

app.get('/', (req, res) => {
    res.json({ 
        ok: true, name: 'API Deudas', cache: cacheAvailable() ? 'redis' : 'in-memory' });
    });
    
app.use('/auth', authRoutes);
app.use('/debts', requireAuth, debtsRoutes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});