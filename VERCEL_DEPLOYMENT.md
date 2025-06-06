# Implantação na Vercel

Este documento contém instruções para configurar e implantar o projeto na plataforma Vercel.

## Pré-requisitos

1. Conta na Vercel (https://vercel.com)
2. Repositório do projeto no GitHub
3. Variáveis de ambiente necessárias configuradas

## Passos para implantação

### 1. Conectar com o GitHub

1. Faça login na sua conta Vercel
2. Clique em "Add New..." e selecione "Project"
3. Importe seu repositório GitHub
4. Selecione o repositório do projeto

### 2. Configuração do Projeto

Ao importar o projeto, configure os seguintes campos:

- **Framework Preset**: Selecione "Vite"
- **Build Command**: Será automaticamente preenchido com `npm run vercel-build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no painel da Vercel:

- `DATABASE_URL`: URL de conexão com o banco de dados
- `SESSION_SECRET`: Chave secreta para sessões
- (Adicione outras variáveis específicas do projeto conforme necessário)

### 4. Deploy

Clique em "Deploy" para iniciar a implantação.

## Implantação Contínua

O projeto está configurado para implantação automática a partir do GitHub. Cada push para a branch principal acionará uma nova implantação.

## Solução de Problemas

Se encontrar problemas durante a implantação:

1. Verifique os logs de build na Vercel
2. Confirme se todas as variáveis de ambiente estão configuradas corretamente
3. Verifique se o arquivo vercel.json está configurado adequadamente 