# appDeudasBackend

# Cómo correr
# 1. Levanta Postgres y Redis (opcional) con Docker
docker compose up -d
# 2. Instala dependencias
npm install
# 3. Inicializa la base de datos (requiere psql disponible y variables PG del .env exportadas)
export $(cat .env | xargs)
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -c "CREATE EXTENSION IF NOT
EXISTS pgcrypto;"
npm run db:init
# 4. Arranca la API
npm run start
# o en desarrollo con recarga
npm run dev

Si no tienes Redis, la API usará caché en memoria automáticamente.