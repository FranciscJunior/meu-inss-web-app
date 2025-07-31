const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('Verificando tabelas do banco de dados...');

db.all('SELECT name FROM sqlite_master WHERE type="table"', (err, rows) => {
  if (err) {
    console.error('Erro ao verificar tabelas:', err);
  } else {
    console.log('Tabelas existentes:', rows);
    
    // Verificar se a tabela agendamentos_inss existe
    const agendamentosTable = rows.find(row => row.name === 'agendamentos_inss');
    if (agendamentosTable) {
      console.log('✅ Tabela agendamentos_inss existe');
      
      // Verificar estrutura da tabela
      db.all("PRAGMA table_info(agendamentos_inss)", (err, columns) => {
        if (err) {
          console.error('Erro ao verificar estrutura da tabela:', err);
        } else {
          console.log('Colunas da tabela agendamentos_inss:', columns);
        }
        db.close();
      });
    } else {
      console.log('❌ Tabela agendamentos_inss NÃO existe');
      db.close();
    }
  }
}); 