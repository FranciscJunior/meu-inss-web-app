const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Criação do banco de dados
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Inicialização das tabelas
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabela de usuários
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          email TEXT,
          role TEXT DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Criar tabela de clientes
      db.run(`
        CREATE TABLE IF NOT EXISTS clients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          cpf TEXT UNIQUE,
          rg TEXT,
          phone TEXT,
          email TEXT,
          address TEXT,
          city TEXT,
          state TEXT,
          cep TEXT,
          birth_date TEXT,
          process_type TEXT,
          process_number TEXT,
          protocol_number TEXT,
          inss_password TEXT,
          lawyer_name TEXT,
          indication TEXT,
          registration_date TEXT,
          contract_value REAL,
          photo_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabela de processos
      db.run(`
        CREATE TABLE IF NOT EXISTS processes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id INTEGER NOT NULL,
          process_number TEXT UNIQUE,
          process_type TEXT NOT NULL,
          status TEXT DEFAULT 'em_andamento',
          description TEXT,
          initial_date TEXT,
          final_date TEXT,
          value REAL,
          observations TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients (id)
        )
      `);

      // Tabela de audiências
      db.run(`
        CREATE TABLE IF NOT EXISTS hearings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          process_id INTEGER NOT NULL,
          date TEXT NOT NULL,
          time TEXT,
          location TEXT,
          type TEXT,
          status TEXT DEFAULT 'agendada',
          observations TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (process_id) REFERENCES processes (id)
        )
      `);

      // Criar tabela de agendamentos INSS
      db.run(`
        CREATE TABLE IF NOT EXISTS agendamentos_inss (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_name TEXT NOT NULL,
          cpf TEXT,
          phone TEXT,
          email TEXT,
          protocol_number TEXT,
          appointment_date TEXT NOT NULL,
          appointment_time TEXT NOT NULL,
          appointment_type TEXT,
          location TEXT,
          status TEXT DEFAULT 'agendado',
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tabela de pagamentos
      db.run(`
        CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id INTEGER NOT NULL,
          client_name TEXT NOT NULL,
          payment_date TEXT NOT NULL,
          payment_amount REAL NOT NULL,
          payment_method TEXT,
          payment_status TEXT DEFAULT 'pendente',
          payment_type TEXT,
          description TEXT,
          receipt_number TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients (id)
        )
      `);

      // Inserir usuário padrão (admin/admin)
      db.get("SELECT id FROM users WHERE username = 'admin'", (err, row) => {
        if (!row) {
          const bcrypt = require('bcryptjs');
          const hashedPassword = bcrypt.hashSync('admin', 10);
          db.run(`
            INSERT INTO users (username, password, name, email, role)
            VALUES ('admin', ?, 'Administrador', 'admin@inss.com', 'admin')
          `, [hashedPassword]);
        }
      });

      resolve();
    });
  });
};

// Funções auxiliares para o banco
const dbQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

module.exports = {
  db,
  initDatabase,
  dbQuery,
  dbRun,
  dbGet
}; 