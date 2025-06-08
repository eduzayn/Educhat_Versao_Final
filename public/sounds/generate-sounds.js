// Script para gerar sons de notificação simples
const fs = require('fs');
const path = require('path');

// Função para gerar dados de áudio WAV básicos
function generateWAVSound(frequency, duration, volume = 0.3) {
  const sampleRate = 44100;
  const samples = Math.floor(sampleRate * duration);
  const buffer = Buffer.alloc(44 + samples * 2);
  
  // Header WAV
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples * 2, 40);
  
  // Dados do áudio
  for (let i = 0; i < samples; i++) {
    const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * volume * 32767;
    buffer.writeInt16LE(sample, 44 + i * 2);
  }
  
  return buffer;
}

// Função para gerar som com múltiplas frequências (acordes)
function generateChordSound(frequencies, duration, volume = 0.3) {
  const sampleRate = 44100;
  const samples = Math.floor(sampleRate * duration);
  const buffer = Buffer.alloc(44 + samples * 2);
  
  // Header WAV
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples * 2, 40);
  
  // Dados do áudio combinando frequências
  for (let i = 0; i < samples; i++) {
    let sample = 0;
    frequencies.forEach(freq => {
      sample += Math.sin(2 * Math.PI * freq * i / sampleRate);
    });
    sample = (sample / frequencies.length) * volume * 32767;
    
    // Envelope (fade out)
    const fadeOut = Math.max(0, 1 - (i / samples) * 2);
    sample *= fadeOut;
    
    buffer.writeInt16LE(sample, 44 + i * 2);
  }
  
  return buffer;
}

// Gerar diferentes sons
const sounds = [
  {
    name: 'notification-pop.wav',
    generator: () => generateWAVSound(800, 0.15)
  },
  {
    name: 'notification-ding.wav', 
    generator: () => generateChordSound([523, 659], 0.3)
  },
  {
    name: 'notification-chime.wav',
    generator: () => generateChordSound([523, 659, 784], 0.5)
  },
  {
    name: 'notification-swoosh.wav',
    generator: () => {
      const buffer = generateWAVSound(400, 0.2);
      // Modificar para criar efeito swoosh
      return buffer;
    }
  },
  {
    name: 'notification-bell.wav',
    generator: () => generateChordSound([880, 1100], 0.4)
  },
  {
    name: 'notification-bubble.wav',
    generator: () => generateWAVSound(1200, 0.1)
  },
  {
    name: 'notification-default.wav',
    generator: () => generateWAVSound(600, 0.2)
  }
];

// Criar os arquivos
sounds.forEach(sound => {
  const buffer = sound.generator();
  fs.writeFileSync(path.join(__dirname, sound.name), buffer);
  console.log(`Som gerado: ${sound.name}`);
});

console.log('Todos os sons foram gerados com sucesso!');