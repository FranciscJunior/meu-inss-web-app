# 🚀 Guia de Deploy - Sistema INSS e Justiça

## 📋 Pré-requisitos

1. **Conta no GitHub** - [github.com](https://github.com)
2. **Conta no Vercel** - [vercel.com](https://vercel.com)
3. **Node.js** instalado no computador

## 🔧 Passos para Deploy

### 1. Criar repositório no GitHub
- Acesse [github.com](https://github.com)
- Clique em "New repository"
- Nome: `meu-inss-web-app`
- Descrição: `Sistema web para escritório INSS e Justiça`
- Deixe público
- **NÃO** inicialize com README
- Clique em "Create repository"

### 2. Fazer push para o GitHub
```bash
git remote add origin https://github.com/SEU-USUARIO/meu-inss-web-app.git
git branch -M main
git push -u origin main
```

### 3. Deploy no Vercel
- Acesse [vercel.com](https://vercel.com)
- Faça login com sua conta GitHub
- Clique em "New Project"
- Importe o repositório `meu-inss-web-app`
- Clique em "Deploy"

## ⚙️ Configurações do Vercel

O arquivo `vercel.json` já está configurado para:
- ✅ Servir o frontend React
- ✅ Rotear APIs para o backend Node.js
- ✅ Configurar upload de fotos
- ✅ Definir timeouts adequados

## 🔐 Variáveis de Ambiente (Opcional)

No Vercel, você pode configurar:
- `JWT_SECRET` - Chave secreta para JWT
- `NODE_ENV` - Ambiente (production)

## 📱 URLs de Acesso

Após o deploy, você terá:
- **Frontend**: `https://meu-inss-web-app.vercel.app`
- **API**: `https://meu-inss-web-app.vercel.app/api`

## 🎯 Credenciais de Acesso

- **Usuário**: `admin`
- **Senha**: `admin`

## 🔄 Atualizações

Para atualizar o app:
1. Faça as mudanças no código
2. Commit e push para GitHub
3. O Vercel atualiza automaticamente

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs no Vercel Dashboard
2. Confirme se o repositório está sincronizado
3. Teste localmente antes do deploy 