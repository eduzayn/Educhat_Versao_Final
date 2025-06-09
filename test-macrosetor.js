// Teste de detecção de macrosetor
import { detectMacrosetor } from './server/storage/utils/macrosetorUtils.js';

const testMessages = [
  'Olá, gostaria de saber mais informações sobre o curso de programação',
  'Estou com problema para acessar a plataforma, não consigo fazer login',
  'Preciso de segunda via do boleto que venceu ontem',
  'Tenho dúvida sobre o exercício da aula 5 de matemática',
  'Gostaria de solicitar meu certificado de conclusão do curso',
  'Quanto custa o curso de engenharia civil?',
  'Minha senha não funciona, preciso de ajuda técnica',
  'Quero renegociar minha dívida em atraso'
];

console.log('🔍 Testando detecção de macrosetor:\n');

testMessages.forEach((message, index) => {
  const detection = detectMacrosetor(message);
  console.log(`Teste ${index + 1}:`);
  console.log(`Mensagem: "${message}"`);
  console.log(`Macrosetor: ${detection?.macrosetor || 'geral'}`);
  console.log(`Confiança: ${(detection?.confidence * 100).toFixed(1)}%`);
  console.log(`Palavras-chave: ${detection?.keywords.join(', ') || 'nenhuma'}`);
  console.log('---');
});