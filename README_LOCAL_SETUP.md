# Configuração do Ambiente Local - EduChat

## Pré-requisitos

1. **Node.js** (versão 18 ou superior)
2. **PostgreSQL** (local ou serviço como Neon)
3. **Git**

## Passos para Configuração

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo `env.example` para `.env` e configure as variáveis:

```bash
cp env.example .env
```

**Configurações obrigatórias:**
- `DATABASE_URL`: URL de conexão com PostgreSQL
- `SESSION_SECRET`: Chave secreta para sessões
- `ZAPI_TOKEN`: Token do Z-API (WhatsApp)
- `ZAPI_INSTANCE_ID`: ID da instância do Z-API

**Configurações opcionais:**
- `ANTHROPIC_API_KEY`: Para funcionalidades de IA
- `SENDGRID_API_KEY`: Para envio de emails

### 3. Configurar Banco de Dados

#### Opção A: PostgreSQL Local
1. Instale PostgreSQL
2. Crie um banco de dados: `createdb educhat_dev`
3. Configure a DATABASE_URL: `postgresql://username:password@localhost:5432/educhat_dev`

#### Opção B: Neon (Recomendado)
1. Acesse [neon.tech](https://neon.tech)
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Copie a URL de conexão para DATABASE_URL

### 4. Executar Migrações
```bash
npm run db:push
```

### 5. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3000`

## Estrutura do Projeto

```
├── client/          # Frontend React
├── server/          # Backend Express
├── shared/          # Código compartilhado
├── migrations/      # Migrações do banco
└── uploads/         # Arquivos enviados
```

## Scripts Disponíveis

- `npm run dev`: Servidor de desenvolvimento
- `npm run build`: Build de produção
- `npm run start`: Servidor de produção
- `npm run check`: Verificação de tipos TypeScript
- `npm run db:push`: Executar migrações

## Funcionalidades Principais

- **Chat Omnichannel**: WhatsApp, Facebook, Instagram
- **CRM**: Gestão de contatos e conversas
- **IA**: Classificação automática de mensagens
- **Equipes**: Sistema de permissões e atribuição
- **Relatórios**: Analytics e métricas
- **Upload de Mídia**: Suporte a imagens, vídeos e documentos

## Troubleshooting

### Erro de Conexão com Banco
- Verifique se o PostgreSQL está rodando
- Confirme se a DATABASE_URL está correta
- Teste a conexão: `psql DATABASE_URL`

### Erro de Dependências
- Delete `node_modules` e `package-lock.json`
- Execute `npm install` novamente

### Erro de Porta em Uso
- Mude a porta no arquivo de configuração
- Ou mate o processo que está usando a porta

## Suporte

Para dúvidas ou problemas, consulte a documentação ou entre em contato com a equipe de desenvolvimento. 