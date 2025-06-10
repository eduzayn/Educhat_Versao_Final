// Test script para verificar a detecção de interesse educacional

const { detectEducationalInfo } = require('./server/storage/utils/courseUtils');

const testMessages = [
  "Olá, tenho interesse em Administração",
  "Quero fazer curso de História",
  "Sou formado em Psicologia",
  "Gostaria de estudar Direito",
  "Trabalho na área de Enfermagem",
  "Pretendo me formar em Pedagogia",
  "Busco informações sobre Contabilidade",
  "Me interesso por Fisioterapia",
  "Cursei Engenharia Civil",
  "Tenho graduação em Medicina"
];

console.log('🧪 Testando detecção de interesse educacional...\n');

testMessages.forEach((message, index) => {
  console.log(`Teste ${index + 1}: "${message}"`);
  const result = detectEducationalInfo(message);
  console.log('Resultado:', {
    interesses: result.interests,
    formação: result.background,
    todosCursos: result.allCourses
  });
  console.log('---');
});