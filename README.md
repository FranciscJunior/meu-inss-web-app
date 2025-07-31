# Sistema INSS e Justiça - Web App

Sistema web completo para gerenciamento de escritório de advocacia especializado em INSS e Justiça, com backend local e interface moderna.

## 🚀 Características

- **Backend Local**: API REST com Node.js e Express
- **Banco de Dados**: SQLite local (sem necessidade de instalação)
- **Frontend**: React com Material-UI
- **Autenticação**: JWT seguro
- **Interface Responsiva**: Funciona em desktop e mobile
- **Dashboard**: Estatísticas e gráficos
- **CRUD Completo**: Clientes, Processos e Audiências

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn
- Navegador moderno (Chrome, Firefox, Safari, Edge)

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd meu-inss-web-app
```

### 2. Instale as dependências
```bash
# Instalar dependências do projeto principal
npm install

# Instalar dependências do backend
cd server
npm install

# Instalar dependências do frontend
cd ../client
npm install

# Voltar para a raiz
cd ..
```

### 3. Iniciar o sistema
```bash
# Iniciar backend e frontend simultaneamente
npm run dev

# Ou iniciar separadamente:
# Backend: npm run server
# Frontend: npm run client
```

## 🌐 Acesso ao Sistema

- **URL Local**: http://localhost:3000
- **API Backend**: http://localhost:4000
- **Usuário Padrão**: admin / admin

## 📊 Funcionalidades

### Dashboard
- Estatísticas gerais
- Gráficos de status de processos
- Gráficos de status de audiências
- Visão geral do escritório

### Clientes
- Cadastro completo de clientes
- Busca e filtros
- Edição e exclusão
- Dados pessoais e de contato

### Processos
- Vinculação com clientes
- Controle de status (Em Andamento, Concluído, Suspenso)
- Valores e observações
- Datas de início e fim

### Audiências
- Agendamento de audiências
- Vinculação com processos
- Controle de status (Agendada, Realizada, Cancelada)
- Local e horário

## 🔧 Configuração

### Variáveis de Ambiente (Opcional)
Crie um arquivo `.env` na pasta `server`:

```env
PORT=4000
JWT_SECRET=sua_chave_secreta_muito_segura
```

### Banco de Dados
O sistema usa SQLite local. O arquivo `database.sqlite` será criado automaticamente na primeira execução.

## 📱 Acesso via Rede Local

Para acessar de outros dispositivos na mesma rede:

1. Descubra o IP do seu computador:
   ```bash
   # Windows
   ipconfig
   
   # Linux/Mac
   ifconfig
   ```

2. Acesse: `http://SEU_IP:3000`

3. Configure o firewall para liberar as portas 3000 e 4000

## 🔒 Segurança

- Autenticação JWT
- Senhas criptografadas com bcrypt
- Validação de dados no backend
- Proteção de rotas
- Rate limiting

## 📁 Estrutura do Projeto

```
meu-inss-web-app/
├── server/                 # Backend Node.js
│   ├── server.js          # Servidor principal
│   ├── db.js              # Configuração do banco
│   ├── middleware/        # Middlewares
│   └── package.json
├── client/                # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── contexts/      # Contextos (Auth)
│   │   └── App.js         # App principal
│   └── package.json
├── package.json           # Scripts principais
└── README.md
```

## 🚀 Deploy

### Para Produção Local
```bash
# Build do frontend
cd client
npm run build

# Iniciar apenas o backend
cd ../server
npm start
```

### Para Internet (Opcional)
- Use ngrok para expor temporariamente: `ngrok http 4000`
- Configure um VPS para hospedagem permanente
- Use HTTPS em produção

## 🐛 Solução de Problemas

### Erro de Porta em Uso
```bash
# Verificar processos usando as portas
netstat -ano | findstr :3000
netstat -ano | findstr :4000

# Matar processo (Windows)
taskkill /PID <PID> /F
```

### Erro de Dependências
```bash
# Limpar cache e reinstalar
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Banco de Dados Corrompido
```bash
# Deletar e recriar
rm server/database.sqlite
# Reiniciar o servidor
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs no console
2. Confirme se todas as dependências estão instaladas
3. Verifique se as portas estão livres
4. Reinicie o sistema se necessário

## 🔄 Atualizações

Para atualizar o sistema:
```bash
git pull
npm run install-all
npm run dev
```

## 📄 Licença

Este projeto é de uso livre para escritórios de advocacia.

---

**Desenvolvido para otimizar a gestão de escritórios de advocacia especializados em INSS e Justiça.** 