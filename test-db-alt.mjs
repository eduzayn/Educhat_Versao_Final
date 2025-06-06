// Script para testar a conexão com o banco de dados Neon
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configuração do WebSocket para Neon Serverless
neonConfig.webSocketConstructor = ws;

// Usar as credenciais individuais da imagem
const PGHOST = "ep-shy-mode-a5b4ocv7.us-east-2.aws.neon.tech";
const PGDATABASE = "neondb";
const PGUSER = "neondb_owner";
const PGPASSWORD = "npg_Bm1IRe39SAqQ";
const PGPORT = 5432;

// Construir a URL de conexão a partir dos componentes
const DATABASE_URL = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}?sslmode=require`;

console.log("URL de conexão construída:", DATABASE_URL);

async function testConnection() {
  console.log("Tentando conectar ao banco de dados Neon...");
  
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    // Testar a conexão executando uma consulta simples
    const result = await pool.query('SELECT NOW()');
    console.log("Conexão bem-sucedida!");
    console.log("Hora do servidor:", result.rows[0].now);
    
    // Testar a estrutura do banco consultando as tabelas
    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    
    console.log("\nTabelas disponíveis no banco de dados:");
    if (tables.rows.length === 0) {
      console.log("Nenhuma tabela encontrada.");
    } else {
      tables.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    }
    
  } catch (error) {
    console.error("Erro ao conectar ao banco de dados:", error);
  } finally {
    // Encerrar a conexão
    await pool.end();
  }
}

// Executar o teste
testConnection().catch(console.error); 