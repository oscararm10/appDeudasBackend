import pg from 'pg';
const { Pool } = pg;


const pool = new Pool({
host: process.env.PGHOST,
port: process.env.PGPORT,
user: process.env.PGUSER,
password: process.env.PGPASSWORD,
database: process.env.PGDATABASE,
});


export const query = (text, params) => pool.query(text, params);


export async function createUser({ email, passwordHash }) {
const { rows } = await query(
`INSERT INTO users (email, password_hash)
VALUES ($1, $2)
RETURNING id, email, created_at`,
[email.toLowerCase(), passwordHash]
);
return rows[0];
}


export async function findUserByEmail(email) {
const { rows } = await query(`SELECT * FROM users WHERE email=$1`, [email.toLowerCase()]);
return rows[0] || null;
}


export async function createDebt(userId, { title, amount, due_date }) {
const { rows } = await query(
`INSERT INTO debts (user_id, title, amount, due_date)
VALUES ($1, $2, $3, $4)
RETURNING *`,
[userId, title, amount, due_date || null]
);
return rows[0];
}


export async function getDebtById(id, userId) {
const { rows } = await query(`SELECT * FROM debts WHERE id=$1 AND user_id=$2`, [id, userId]);
return rows[0] || null;
}


export async function listDebts(userId, { status }) {
let sql = `SELECT * FROM debts WHERE user_id=$1`;
const params = [userId];
if (status === 'paid') { sql += ' AND paid = TRUE'; }
else if (status === 'pending') { sql += ' AND paid = FALSE'; }
sql += ' ORDER BY created_at DESC';
const { rows } = await query(sql, params);
return rows;
}


export async function updateDebt(id, userId, updates) {
const fields = [];
const params = [];
let idx = 1;
for (const [k, v] of Object.entries(updates)) {
fields.push(`${k} = $${idx++}`);
params.push(v);
}
params.push(id, userId);
const sql = `UPDATE debts SET ${fields.join(', ')} WHERE id=$${idx++} AND user_id=$${idx} RETURNING *`;
const { rows } = await query(sql, params);
return rows[0] || null;
}


export async function deleteDebt(id, userId) {
const { rowCount } = await query(`DELETE FROM debts WHERE id=$1 AND user_id=$2`, [id, userId]);
return rowCount > 0;
}


export async function markDebtPaid(id, userId) {
const { rows } = await query(
`UPDATE debts SET paid=TRUE, paid_at=NOW() WHERE id=$1 AND user_id=$2 AND paid=FALSE RETURNING *`,
[id, userId]
);
return rows[0] || null;
}