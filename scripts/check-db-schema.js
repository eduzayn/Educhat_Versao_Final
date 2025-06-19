import pg from 'pg';

async function listTables() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL não está definida. Verifique seu arquivo .env');
    return;
  }

  console.log('🔄 Conectando ao banco de dados...');
  const { Client } = pg;
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    const query = `
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name;
    `;

    console.log('🔍 Executando query para listar tabelas...');
    const res = await client.query(query);

    if (res.rows.length === 0) {
      console.log('🟡 Nenhuma tabela encontrada no banco de dados.');
      console.log('➡️  Você já executou as migrações? Tente rodar "npm run db:push"');
    } else {
      console.log('✨ Tabelas encontradas:');
      let currentSchema = '';
      res.rows.forEach(row => {
        if (row.table_schema !== currentSchema) {
          currentSchema = row.table_schema;
          console.log(`\n  Schema: ${currentSchema}`);
        }
        console.log(`    - ${row.table_name}`);
      });
    }

  } catch (err) {
    console.error('❌ Erro ao conectar ou executar a query:', err.message);
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada.');
  }
}

listTables(); 