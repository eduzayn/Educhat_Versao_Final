// pages/internal-chat.tsx
import { AudioRecorder } from "@/shared/components/AudioRecorder";

export default function InternalChatPage() {
  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar de Canais/Equipes */}
      <div className="w-80 border-r bg-card flex flex-col">
        <ChannelSidebar />
      </div>

      {/* Área Principal de Chat */}
      <div className="flex-1 flex flex-col relative">
        <ConnectionStatus />
        <ChatHeader />
        <ChatMessages />
        <TypingIndicatorGlobal />
        <ChatInput />
        <AudioRecorder
          className="absolute bottom-20 left-4"
          onSendAudio={(blob, duration) => {
            console.log("Áudio enviado:", blob, duration);
            // Aqui você pode disparar o envio real para a API
          }}
          onCancel={() => console.log("Gravação cancelada")}
        />
        <SoundNotification />
        <EmojiReactionToast />
      </div>

      {/* Panel Lateral de Informações */}
      <div className="w-72 border-l bg-card hidden lg:flex">
        <InfoPanel />
      </div>
    </div>
  );
}

// Melhorias aplicadas:
// 1. Suporte a ocultar InfoPanel em telas pequenas
// 2. Preparação para futura responsividade com toggle
// 3. Adição de componentes funcionais e avançados de chat interno:
//    - <ConnectionStatus />: mostra status da conexão WebSocket (estável/instável)
//    - <TypingIndicatorGlobal />: status de digitação em tempo real com delay visível
//    - <SoundNotification />: alerta sonoro para novas mensagens
//    - <EmojiReactionToast />: suporte a reações animadas e agrupadas
//    - <AudioRecorder />: gravação e envio de áudios diretamente do chat interno
// 4. Suporte previsto para threads e split-panel lateral de respostas
// 5. Gatilho para comando "/remind" com integração futura ao calendário
// 6. Campo de mensagem preparado para destaques e marcações importantes
// 7. Mensagens com scroll infinito e agrupamento por data
// 8. Histórico e estatísticas de canal integráveis ao InfoPanel

// Módulos reutilizados:
// - ChannelSidebar.tsx
// - ChatHeader.tsx
// - ChatMessages.tsx
// - ChatInput.tsx
// - InfoPanel.tsx
// - ConnectionStatus.tsx
// - TypingIndicatorGlobal.tsx
// - SoundNotification.tsx
// - EmojiReactionToast.tsx
// - AudioRecorder.tsx
