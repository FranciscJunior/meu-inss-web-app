const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { initDatabase, dbQuery, dbRun, dbGet, db } = require('./db');
const { authenticateToken, requireAdmin, generateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware de segurança
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requests por IP
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Inicializar banco de dados
initDatabase().then(() => {
  console.log('Banco de dados inicializado com sucesso!');
}).catch(err => {
  console.error('Erro ao inicializar banco:', err);
});

// Configurar multer para upload de imagens
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const galeriaDir = path.join(__dirname, 'Galeria');
    if (!fs.existsSync(galeriaDir)) {
      fs.mkdirSync(galeriaDir, { recursive: true });
    }
    cb(null, galeriaDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cliente-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'));
    }
  }
});

// Rota para upload de foto do cliente
app.post('/api/upload-photo', authenticateToken, upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
    }
    
    const photoUrl = `/Galeria/${req.file.filename}`;
    res.json({
      message: 'Foto enviada com sucesso',
      photoUrl: photoUrl
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem' });
  }
});

// Servir arquivos estáticos
app.use('/Galeria', express.static(path.join(__dirname, 'Galeria')));

// Rota para listar fotos da galeria
app.get('/api/galeria', authenticateToken, (req, res) => {
  try {
    const galeriaDir = path.join(__dirname, 'Galeria');
    if (!fs.existsSync(galeriaDir)) {
      return res.json({ photos: [] });
    }
    
    const files = fs.readdirSync(galeriaDir);
    const photos = files
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
      .map(file => ({
        filename: file,
        url: `/Galeria/${file}`,
        createdAt: fs.statSync(path.join(galeriaDir, file)).mtime
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
    
    res.json({ photos });
  } catch (error) {
    console.error('Erro ao listar galeria:', error);
    res.status(500).json({ error: 'Erro ao listar galeria' });
  }
});

// Rota para deletar foto da galeria
app.delete('/api/galeria/:filename', authenticateToken, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'Galeria', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Foto deletada com sucesso' });
    } else {
      res.status(404).json({ error: 'Foto não encontrada' });
    }
  } catch (error) {
    console.error('Erro ao deletar foto:', error);
    res.status(500).json({ error: 'Erro ao deletar foto' });
  }
});

// ===== ROTAS DE AUTENTICAÇÃO =====

// Login
app.post('/api/auth/login', [
  body('username').notEmpty().withMessage('Usuário é obrigatório'),
  body('password').notEmpty().withMessage('Senha é obrigatória')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const { username, password } = req.body;

    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas',
        message: 'Usuário ou senha incorretos'
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas',
        message: 'Usuário ou senha incorretos'
      });
    }

    const token = generateToken(user);
    
    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: 'Tente novamente mais tarde'
    });
  }
});

// Verificar token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
});

// ===== ROTAS DE CLIENTES =====

// Listar clientes
app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = 'SELECT * FROM clients';
    let params = [];
    
    if (search) {
      sql += ' WHERE name LIKE ? OR cpf LIKE ? OR email LIKE ?';
      params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }
    
    sql += ' ORDER BY name LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const clients = await dbQuery(sql, params);
    const total = await dbGet('SELECT COUNT(*) as count FROM clients');
    
    res.json({
      clients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total.count,
        pages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar cliente por ID
app.get('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const client = await dbGet('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json(client);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar cliente
app.post('/api/clients', authenticateToken, async (req, res) => {
  try {
    console.log('Recebendo dados do cliente:', req.body);
    
    const { 
      name, cpf, rg, phone, email, address, city, state, cep, birth_date,
      process_type, process_number, protocol_number, inss_password, 
      lawyer_name, indication, registration_date, contract_value, photo_url
    } = req.body;
    
    // Validação simples
    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    
    console.log('Executando INSERT no banco...');
    console.log('Valores a serem inseridos:', [
      name, cpf, rg, phone, email, address, city, state, cep, birth_date,
      process_type, process_number, protocol_number, inss_password,
      lawyer_name, indication, registration_date, contract_value, photo_url
    ]);
    
    const result = await dbRun(`
      INSERT INTO clients (
        name, cpf, rg, phone, email, address, city, state, cep, birth_date,
        process_type, process_number, protocol_number, inss_password,
        lawyer_name, indication, registration_date, contract_value, photo_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, cpf, rg, phone, email, address, city, state, cep, birth_date,
        process_type, process_number, protocol_number, inss_password,
        lawyer_name, indication, registration_date, contract_value, photo_url]);
    
    console.log('Cliente inserido com ID:', result.id);
    
    const newClient = await dbGet('SELECT * FROM clients WHERE id = ?', [result.id]);
    console.log('Cliente recuperado:', newClient);
    
    res.status(201).json({
      message: 'Cliente criado com sucesso',
      client: newClient
    });
  } catch (error) {
    console.error('Erro detalhado ao criar cliente:', error);
    console.error('Stack trace:', error.stack);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'CPF já cadastrado' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar cliente
app.put('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { 
      name, cpf, rg, phone, email, address, city, state, cep, birth_date,
      process_type, process_number, protocol_number, inss_password,
      lawyer_name, indication, registration_date, contract_value, photo_url
    } = req.body;
    
    await dbRun(`
      UPDATE clients 
      SET name = ?, cpf = ?, rg = ?, phone = ?, email = ?, 
          address = ?, city = ?, state = ?, cep = ?, birth_date = ?,
          process_type = ?, process_number = ?, protocol_number = ?, inss_password = ?,
          lawyer_name = ?, indication = ?, registration_date = ?, contract_value = ?,
          photo_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, cpf, rg, phone, email, address, city, state, cep, birth_date,
        process_type, process_number, protocol_number, inss_password,
        lawyer_name, indication, registration_date, contract_value, photo_url, req.params.id]);
    
    const updatedClient = await dbGet('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    
    res.json({
      message: 'Cliente atualizado com sucesso',
      client: updatedClient
    });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar cliente
app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    // Verificar se há processos vinculados
    const processes = await dbQuery('SELECT id FROM processes WHERE client_id = ?', [req.params.id]);
    if (processes.length > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar cliente com processos vinculados' 
      });
    }
    
    await dbRun('DELETE FROM clients WHERE id = ?', [req.params.id]);
    res.json({ message: 'Cliente deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== ROTAS DE PROCESSOS =====

// Listar processos
app.get('/api/processes', authenticateToken, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT p.*, c.name as client_name 
      FROM processes p 
      JOIN clients c ON p.client_id = c.id
    `;
    let params = [];
    let conditions = [];
    
    if (search) {
      conditions.push('(p.process_number LIKE ? OR p.description LIKE ? OR c.name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const processes = await dbQuery(sql, params);
    const total = await dbGet('SELECT COUNT(*) as count FROM processes');
    
    res.json({
      processes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total.count,
        pages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar processos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar processo por ID
app.get('/api/processes/:id', authenticateToken, async (req, res) => {
  try {
    const process = await dbQuery(`
      SELECT p.*, c.name as client_name 
      FROM processes p 
      JOIN clients c ON p.client_id = c.id 
      WHERE p.id = ?
    `, [req.params.id]);
    
    if (!process[0]) {
      return res.status(404).json({ error: 'Processo não encontrado' });
    }
    
    res.json(process[0]);
  } catch (error) {
    console.error('Erro ao buscar processo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar processo
app.post('/api/processes', authenticateToken, [
  body('client_id').isInt().withMessage('Cliente é obrigatório'),
  body('process_type').notEmpty().withMessage('Tipo de processo é obrigatório'),
  body('process_number').optional().notEmpty().withMessage('Número do processo inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const { 
      client_id, process_number, process_type, status, description, 
      initial_date, final_date, value, observations 
    } = req.body;
    
    const result = await dbRun(`
      INSERT INTO processes (client_id, process_number, process_type, status, description, 
                           initial_date, final_date, value, observations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [client_id, process_number, process_type, status, description, 
        initial_date, final_date, value, observations]);
    
    const newProcess = await dbQuery(`
      SELECT p.*, c.name as client_name 
      FROM processes p 
      JOIN clients c ON p.client_id = c.id 
      WHERE p.id = ?
    `, [result.id]);
    
    res.status(201).json({
      message: 'Processo criado com sucesso',
      process: newProcess[0]
    });
  } catch (error) {
    console.error('Erro ao criar processo:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Número do processo já cadastrado' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar processo
app.put('/api/processes/:id', authenticateToken, async (req, res) => {
  try {
    const { 
      process_number, process_type, status, description, 
      initial_date, final_date, value, observations 
    } = req.body;
    
    await dbRun(`
      UPDATE processes 
      SET process_number = ?, process_type = ?, status = ?, description = ?,
          initial_date = ?, final_date = ?, value = ?, observations = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [process_number, process_type, status, description, 
        initial_date, final_date, value, observations, req.params.id]);
    
    const updatedProcess = await dbQuery(`
      SELECT p.*, c.name as client_name 
      FROM processes p 
      JOIN clients c ON p.client_id = c.id 
      WHERE p.id = ?
    `, [req.params.id]);
    
    res.json({
      message: 'Processo atualizado com sucesso',
      process: updatedProcess[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar processo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar processo
app.delete('/api/processes/:id', authenticateToken, async (req, res) => {
  try {
    // Verificar se há audiências vinculadas
    const hearings = await dbQuery('SELECT id FROM hearings WHERE process_id = ?', [req.params.id]);
    if (hearings.length > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar processo com audiências vinculadas' 
      });
    }
    
    await dbRun('DELETE FROM processes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Processo deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar processo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== ROTAS DE AUDIÊNCIAS =====

// Listar audiências
app.get('/api/hearings', authenticateToken, async (req, res) => {
  try {
    const { process_id, date, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT h.*, p.process_number, p.process_type, c.name as client_name
      FROM hearings h
      JOIN processes p ON h.process_id = p.id
      JOIN clients c ON p.client_id = c.id
    `;
    let params = [];
    let conditions = [];
    
    if (process_id) {
      conditions.push('h.process_id = ?');
      params.push(process_id);
    }
    
    if (date) {
      conditions.push('h.date = ?');
      params.push(date);
    }
    
    if (status) {
      conditions.push('h.status = ?');
      params.push(status);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY h.date ASC, h.time ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const hearings = await dbQuery(sql, params);
    const total = await dbGet('SELECT COUNT(*) as count FROM hearings');
    
    res.json({
      hearings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total.count,
        pages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar audiências:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar audiência
app.post('/api/hearings', authenticateToken, [
  body('process_id').isInt().withMessage('Processo é obrigatório'),
  body('date').notEmpty().withMessage('Data é obrigatória'),
  body('time').optional().notEmpty().withMessage('Horário inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    const { process_id, date, time, location, type, status, observations } = req.body;
    
    const result = await dbRun(`
      INSERT INTO hearings (process_id, date, time, location, type, status, observations)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [process_id, date, time, location, type, status, observations]);
    
    const newHearing = await dbQuery(`
      SELECT h.*, p.process_number, p.process_type, c.name as client_name
      FROM hearings h
      JOIN processes p ON h.process_id = p.id
      JOIN clients c ON p.client_id = c.id
      WHERE h.id = ?
    `, [result.id]);
    
    res.status(201).json({
      message: 'Audiência criada com sucesso',
      hearing: newHearing[0]
    });
  } catch (error) {
    console.error('Erro ao criar audiência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar audiência
app.put('/api/hearings/:id', authenticateToken, async (req, res) => {
  try {
    const { date, time, location, type, status, observations } = req.body;
    
    await dbRun(`
      UPDATE hearings 
      SET date = ?, time = ?, location = ?, type = ?, status = ?, observations = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [date, time, location, type, status, observations, req.params.id]);
    
    const updatedHearing = await dbQuery(`
      SELECT h.*, p.process_number, p.process_type, c.name as client_name
      FROM hearings h
      JOIN processes p ON h.process_id = p.id
      JOIN clients c ON p.client_id = c.id
      WHERE h.id = ?
    `, [req.params.id]);
    
    res.json({
      message: 'Audiência atualizada com sucesso',
      hearing: updatedHearing[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar audiência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar audiência
app.delete('/api/hearings/:id', authenticateToken, async (req, res) => {
  try {
    await dbRun('DELETE FROM hearings WHERE id = ?', [req.params.id]);
    res.json({ message: 'Audiência deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar audiência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== ROTAS DE ESTATÍSTICAS =====

// Dashboard stats
app.get('/api/stats/dashboard', authenticateToken, async (req, res) => {
  try {
    const [
      totalClients,
      totalProcesses,
      totalHearings,
      processesByStatus,
      hearingsByStatus
    ] = await Promise.all([
      dbGet('SELECT COUNT(*) as count FROM clients'),
      dbGet('SELECT COUNT(*) as count FROM processes'),
      dbGet('SELECT COUNT(*) as count FROM hearings'),
      dbQuery('SELECT status, COUNT(*) as count FROM processes GROUP BY status'),
      dbQuery('SELECT status, COUNT(*) as count FROM hearings GROUP BY status')
    ]);
    
    res.json({
      totalClients: totalClients.count,
      totalProcesses: totalProcesses.count,
      totalHearings: totalHearings.count,
      processesByStatus,
      hearingsByStatus
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rotas para agendamentos INSS
app.get('/api/agendamentos-inss', authenticateToken, async (req, res) => {
  try {
    const { search = '' } = req.query;
    let query = 'SELECT * FROM agendamentos_inss';
    let params = [];

    if (search) {
      query += ' WHERE client_name LIKE ? OR cpf LIKE ? OR phone LIKE ?';
      params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }

    query += ' ORDER BY appointment_date DESC, appointment_time ASC';

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Erro ao buscar agendamentos:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      res.json(rows);
    });
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/agendamentos-inss', authenticateToken, async (req, res) => {
  try {
    const {
      client_name, cpf, phone, email, protocol_number, appointment_date, appointment_time,
      appointment_type, location, status, notes
    } = req.body;

    // Verificar se já existe um agendamento para este cliente
    db.get('SELECT id FROM agendamentos_inss WHERE client_name = ? AND cpf = ?', [client_name, cpf], (err, existingAgendamento) => {
      if (err) {
        console.error('Erro ao verificar agendamento existente:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }

      if (existingAgendamento) {
        return res.status(400).json({ error: 'Já existe um agendamento para este cliente' });
      }

      const query = `
        INSERT INTO agendamentos_inss 
        (client_name, cpf, phone, email, protocol_number, appointment_date, appointment_time, appointment_type, location, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        client_name, cpf, phone, email, protocol_number, appointment_date, appointment_time,
        appointment_type, location, status, notes
      ];

      db.run(query, params, function(err) {
        if (err) {
          console.error('Erro ao criar agendamento:', err);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }

        // Buscar o agendamento criado
        db.get('SELECT * FROM agendamentos_inss WHERE id = ?', [this.lastID], (err, row) => {
          if (err) {
            console.error('Erro ao buscar agendamento criado:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
          }
          res.status(201).json(row);
        });
      });
    });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/agendamentos-inss/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      client_name, cpf, phone, email, protocol_number, appointment_date, appointment_time,
      appointment_type, location, status, notes
    } = req.body;

    const query = `
      UPDATE agendamentos_inss SET 
      client_name = ?, cpf = ?, phone = ?, email = ?, protocol_number = ?, appointment_date = ?, 
      appointment_time = ?, appointment_type = ?, location = ?, status = ?, notes = ?,
      updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const params = [
      client_name, cpf, phone, email, protocol_number, appointment_date, appointment_time,
      appointment_type, location, status, notes, id
    ];

    db.run(query, params, function(err) {
      if (err) {
        console.error('Erro ao atualizar agendamento:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      // Buscar o agendamento atualizado
      db.get('SELECT * FROM agendamentos_inss WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Erro ao buscar agendamento atualizado:', err);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json(row);
      });
    });
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/agendamentos-inss/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    db.run('DELETE FROM agendamentos_inss WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Erro ao deletar agendamento:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }

      res.json({ message: 'Agendamento deletado com sucesso' });
    });
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rotas para pagamentos
app.get('/api/payments', authenticateToken, async (req, res) => {
  try {
    const { search = '', page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM payments';
    let params = [];
    
    if (search) {
      query += ' WHERE client_name LIKE ? OR description LIKE ?';
      params = [`%${search}%`, `%${search}%`];
    }
    
    query += ' ORDER BY payment_date DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Erro ao buscar pagamentos:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      res.json(rows);
    });
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/payments', authenticateToken, async (req, res) => {
  try {
    const {
      client_id, client_name, payment_date, payment_amount, payment_method,
      payment_status, payment_type, description, receipt_number
    } = req.body;

    const query = `
      INSERT INTO payments 
      (client_id, client_name, payment_date, payment_amount, payment_method, 
       payment_status, payment_type, description, receipt_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      client_id, client_name, payment_date, payment_amount, payment_method,
      payment_status, payment_type, description, receipt_number
    ];

    db.run(query, params, function(err) {
      if (err) {
        console.error('Erro ao criar pagamento:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }

      // Buscar o pagamento criado
      db.get('SELECT * FROM payments WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          console.error('Erro ao buscar pagamento criado:', err);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.status(201).json(row);
      });
    });
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/payments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      client_id, client_name, payment_date, payment_amount, payment_method,
      payment_status, payment_type, description, receipt_number
    } = req.body;

    const query = `
      UPDATE payments SET 
      client_id = ?, client_name = ?, payment_date = ?, payment_amount = ?, 
      payment_method = ?, payment_status = ?, payment_type = ?, description = ?, 
      receipt_number = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const params = [
      client_id, client_name, payment_date, payment_amount, payment_method,
      payment_status, payment_type, description, receipt_number, id
    ];

    db.run(query, params, function(err) {
      if (err) {
        console.error('Erro ao atualizar pagamento:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Pagamento não encontrado' });
      }

      // Buscar o pagamento atualizado
      db.get('SELECT * FROM payments WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Erro ao buscar pagamento atualizado:', err);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json(row);
      });
    });
  } catch (error) {
    console.error('Erro ao atualizar pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/payments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    db.run('DELETE FROM payments WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Erro ao deletar pagamento:', err);
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Pagamento não encontrado' });
      }

      res.json({ message: 'Pagamento deletado com sucesso' });
    });
  } catch (error) {
    console.error('Erro ao deletar pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: 'Algo deu errado'
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    message: 'A rota solicitada não existe'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 API disponível em: http://localhost:${PORT}`);
  console.log(`🔐 Usuário padrão: admin / admin`);
}); 