# Backend IGJ - Sistema de Gestão de Casinos

Sistema backend para gestão de casinos, clientes, interdições, ocorrências e transações financeiras.

## 📋 Descrição

Este é um sistema backend desenvolvido em Node.js com TypeScript para gestão de casinos e suas operações. O sistema permite controlar clientes, interdições, ocorrências, transações financeiras e impostos especiais.

## 🚀 Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **TypeScript** - Linguagem de programação
- **Express.js** - Framework web
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação e autorização
- **Zod** - Validação de dados
- **Multer** - Upload de arquivos
- **bcrypt** - Criptografia de senhas

## 📁 Estrutura do Projeto

```
backend_igj/
├── src/
│   ├── controllers/     # Controladores da aplicação
│   ├── routes/          # Rotas da API
│   ├── middleware/      # Middlewares personalizados
│   ├── configs/         # Configurações
│   ├── types/           # Tipos TypeScript
│   ├── lib/             # Bibliotecas e utilitários
│   ├── app.ts           # Configuração do Express
│   └── server.ts        # Servidor principal
├── prisma/
│   └── schema.prisma    # Schema do banco de dados
├── uploads/             # Arquivos enviados
├── package.json
├── tsconfig.json
└── env.ts
```

## 🗄️ Modelos do Banco de Dados

### Principais Entidades:

- **User** - Usuários do sistema (admin, gestor, técnico)
- **Casino** - Casinos registrados
- **Client** - Clientes dos casinos
- **Interdiction** - Interdições de clientes
- **Occurrence** - Ocorrências/incidentes
- **Transaction** - Transações financeiras
- **SpecialTax** - Impostos especiais
- **StampTax** - Impostos de selo

## 🔧 Instalação e Configuração

### Pré-requisitos

- Node.js (versão 18 ou superior)
- PostgreSQL
- npm ou yarn

### Passos para Instalação

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd backend_igj
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   Crie um arquivo `.env` na raiz do projeto:
   ```env
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_do_banco"
   ACCESS_TOKEN_SECRET="seu_secret_access_token"
   ACCESS_TOKEN_EXPIRES_IN="15m"
   REFRESH_TOKEN_SECRET="seu_secret_refresh_token"
   REFRESH_TOKEN_EXPIRES_IN="7d"
   REFRESH_TOKEN_COOKIE_NAME="refreshToken"
   ```

4. **Configure o banco de dados**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Execute o projeto**
   ```bash
   # Desenvolvimento
   npm run dev
   
   # Produção
   npm run build
   npm start
   ```

## 📡 Endpoints da API

### Autenticação
- `POST /sessions` - Login de usuário
- `POST /sessions/refresh` - Renovar token de acesso

### Usuários
- `GET /users` - Listar usuários
- `POST /users` - Criar usuário
- `GET /users/:id` - Buscar usuário por ID
- `PUT /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Deletar usuário

### Casinos
- `GET /casinos` - Listar casinos
- `POST /casinos` - Criar casino
- `GET /casinos/:id` - Buscar casino por ID
- `PUT /casinos/:id` - Atualizar casino
- `DELETE /casinos/:id` - Deletar casino

### Clientes
- `GET /clients` - Listar clientes
- `POST /clients` - Criar cliente
- `GET /clients/:id` - Buscar cliente por ID
- `PUT /clients/:id` - Atualizar cliente
- `DELETE /clients/:id` - Deletar cliente

### Interdições
- `GET /interdictions` - Listar interdições
- `POST /interdictions` - Criar interdição
- `GET /interdictions/:id` - Buscar interdição por ID
- `PUT /interdictions/:id` - Atualizar interdição
- `DELETE /interdictions/:id` - Deletar interdição
- `PATCH /interdictions/:id/approve` - Aprovar interdição
- `PATCH /interdictions/:id/reject` - Rejeitar interdição

### Ocorrências
- `GET /occurrences` - Listar ocorrências
- `POST /occurrences` - Criar ocorrência
- `GET /occurrences/:id` - Buscar ocorrência por ID
- `PUT /occurrences/:id` - Atualizar ocorrência
- `DELETE /occurrences/:id` - Deletar ocorrência

### Transações
- `GET /transactions` - Listar transações
- `POST /transactions` - Criar transação
- `GET /transactions/:id` - Buscar transação por ID
- `PUT /transactions/:id` - Atualizar transação
- `DELETE /transactions/:id` - Deletar transação

### Impostos Especiais
- `GET /special-taxes` - Listar impostos especiais
- `POST /special-taxes` - Criar imposto especial
- `GET /special-taxes/:id` - Buscar imposto especial por ID
- `PUT /special-taxes/:id` - Atualizar imposto especial
- `DELETE /special-taxes/:id` - Deletar imposto especial

### Impostos de Selo
- `GET /stamp-taxes` - Listar impostos de selo
- `POST /stamp-taxes` - Criar imposto de selo
- `GET /stamp-taxes/:id` - Buscar imposto de selo por ID
- `PUT /stamp-taxes/:id` - Atualizar imposto de selo
- `DELETE /stamp-taxes/:id` - Deletar imposto de selo

## 🔐 Autenticação e Autorização

O sistema utiliza JWT (JSON Web Tokens) para autenticação:

- **Access Token**: Token de curta duração (15 minutos)
- **Refresh Token**: Token de longa duração (7 dias) armazenado em cookie

### Roles de Usuário:
- **admin**: Acesso total ao sistema
- **gestor**: Gestão de casinos e operações
- **tecnico**: Operações técnicas limitadas

## 📁 Upload de Arquivos

O sistema suporta upload de arquivos para:
- Anexos de clientes
- Anexos de interdições
- Anexos de ocorrências

### Tipos de Arquivo Suportados:
- PDF
- Documentos
- Imagens

## 🛠️ Scripts Disponíveis

```bash
npm run dev          # Executa em modo desenvolvimento com hot reload
npm run build        # Compila o projeto para produção
npm run start:dev    # Executa o projeto compilado
```

## 🔍 Validação de Dados

O sistema utiliza Zod para validação de dados em todas as rotas, garantindo:
- Tipos corretos
- Campos obrigatórios
- Formatos válidos
- Validações customizadas

## 🚨 Tratamento de Erros

O sistema inclui tratamento de erros robusto:
- Erros de validação (400)
- Erros de autenticação (401)
- Erros de autorização (403)
- Erros de recurso não encontrado (404)
- Erros internos do servidor (500)

## 📊 Paginação

As listagens suportam paginação através dos parâmetros:
- `page`: Número da página (padrão: 1)
- `pageSize`: Itens por página (padrão: 10)

## 🔄 Status de Entidades

### Status de Interdições:
- `pendente` - Aguardando aprovação
- `aprovada` - Interdição aprovada
- `rejeitada` - Interdição rejeitada

### Status de Ocorrências:
- `pendente` - Aguardando resolução
- `resolvido` - Ocorrência resolvida
- `em_analise` - Em análise

### Status de Usuários:
- `activo` - Usuário ativo
- `inactivo` - Usuário inativo

## 🌐 CORS

O sistema está configurado para aceitar requisições do frontend em:
- `http://localhost:5173` (desenvolvimento)

## 📝 Licença

Este projeto está sob a licença ISC.

## 👥 Contribuição

Para contribuir com o projeto:
1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para suporte ou dúvidas, entre em contato com a equipe de desenvolvimento. 