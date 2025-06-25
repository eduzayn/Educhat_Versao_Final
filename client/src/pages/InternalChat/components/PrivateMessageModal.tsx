import { useState, useEffect, useRef } from "react";
import {
  Send,
  X,
  Phone,
  Video,
  Minimize2,
  Paperclip,
  Smile,
  Mic,
  MoreHorizontal,
  Reply,
  Heart,
  ThumbsUp,
  Laugh,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Textarea } from "@/shared/ui/textarea";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Badge } from "@/shared/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/shared/ui/dropdown-menu";
import { useInternalChatStore } from "../store/internalChatStore";
import { useAuth } from "@/shared/lib/hooks/useAuth";
import { useToast } from "@/shared/lib/hooks/use-toast";
import {
  AudioRecorder,
  AudioRecorderRef,
} from "@/modules/Messages/components/AudioRecorder";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PrivateMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    id: number;
    username: string;
    displayName: string;
    roleName?: string;
    avatar?: string;
  };
}

export function PrivateMessageModal({
  isOpen,
  onClose,
  targetUser,
}: PrivateMessageModalProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { playNotificationSound } = useInternalChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRecorderRef = useRef<AudioRecorderRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = user as any;
  const privateChannelId = `direct-${Math.min(currentUser?.id || 0, targetUser.id)}-${Math.max(currentUser?.id || 0, targetUser.id)}`;

  const FREQUENT_EMOJIS = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", 
    "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", 
    "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", 
    "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤐", 
    "🥴", "😵", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", 
    "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾",
    "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", 
    "🖕", "👇", "☝️", "👍", "👎", "👊", "✊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", 
    "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", 
    "👁️", "👅", "👄", "💋", "🩸", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", 
    "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "🔥", "💯", "💢", "💥", "💫", "💦", "💨", "🕳️", 
    "💣", "💬", "👁️‍🗨️", "🗨️", "🗯️", "💭", "💤", "🎉", "🎊", "🎈", "🎁", "🎀", "🎯", "🎪", "🎨", 
    "🎭", "🩰", "🎪", "🎨", "🎬", "🎤", "🎧", "🎼", "🎵", "🎶", "🎹", "🥁", "🎷", "🎺", "🎸", "🪕", 
    "🎻", "🎲", "♠️", "♥️", "♦️", "♣️", "♟️", "🃏", "🀄", "🎴", "🎮", "🕹️", "🎰", "🧩", "🚗", "🚕", 
    "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🏍️", "🛵", "🚲", "🛴", 
    "🛹", "🛼", "🚁", "🛸", "🚀", "✈️", "🛫", "🛬", "🪂", "⛵", "🚤", "🛥️", "🛳️", "⛴️", "🚢", "⚓", 
    "🏰", "🏯", "🏟️", "🎡", "🎢", "🎠", "⛲", "⛱️", "🏖️", "🏝️", "🏜️", "🌋", "⛰️", "🏔️", "🗻", "🏕️", 
    "⛺", "🏠", "🏡", "🏘️", "🏚️", "🏗️", "🏭", "🏢", "🏬", "🏣", "🏤", "🏥", "🏦", "🏨", "🏪", "🏫", 
    "🏩", "💒", "🏛️", "⛪", "🕌", "🛕", "🕍", "🕋", "⛩️", "🗾", "🎑", "🏞️", "🌅", "🌄", "🌠", "🎇", 
    "🎆", "🌇", "🌆", "🏙️", "🌃", "🌌", "🌉", "🌁", "⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", 
    "🖲️", "🕹️", "🗜️", "💽", "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", 
    "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭", "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳", "📡", "🔋", 
    "🔌", "💡", "🔦", "🕯️", "🪔", "🧯", "🛢️", "💸", "💵", "💴", "💶", "💷", "💰", "💳", "💎", "⚖️", 
    "🧰", "🔧", "🔨", "⚒️", "🛠️", "⛏️", "🔩", "⚙️", "🧱", "⛓️", "🧲", "🔫", "💣", "🧨", "🪓", "🔪", 
    "🗡️", "⚔️", "🛡️", "🚬", "⚰️", "⚱️", "🏺", "🔮", "📿", "🧿", "💈", "⚗️", "🔭", "🔬", "🕳️", "🩹", 
    "🩺", "💊", "💉", "🩸", "🧬", "🦠", "🧫", "🧪", "🌡️", "🧹", "🧺", "🧻", "🚽", "🚰", "🚿", "🛁", 
    "🛀", "🧴", "🧷", "🧸", "🧵", "🪡", "🧶", "🪢", "🧮", "🎊", "🎈", "🎁", "🎀", "🪅", "🪆", "🎯", 
    "🎮", "🕹️", "🎰", "🎲", "🧩", "🃏", "🀄", "🎴", "🎭", "🖼️", "🎨", "🧵", "🪡", "🧶", "🪢", "⚽", 
    "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", 
    "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️", "🥌", "🎿", 
    "⛷️", "🏂", "🪂", "🏋️", "🤸", "🤺", "🤾", "🏌️", "🏇", "🧘", "🏄", "🏊", "🤽", "🚣", "🧗", "🚵", 
    "🚴", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🏵️", "🎗️", "🎫", "🎟️", "🎪", "🤹", "🎭", "🩰", "🎨", 
    "🎬", "🎤", "🎧", "🎼", "🎵", "🎶", "🥇", "🥈", "🥉", "🏆", "🏅", "🎖️", "🏵️", "🎗️", "🍏", "🍎", 
    "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", 
    "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🧄", "🧅", "🥔", "🍠", "🥐", "🥖", 
    "🍞", "🥨", "🥯", "🥞", "🧇", "🧀", "🍖", "🍗", "🥩", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", 
    "🌯", "🫔", "🥙", "🧆", "🥚", "🍳", "🥘", "🍲", "🫕", "🥣", "🥗", "🍿", "🧈", "🧂", "🥫", "🍱", 
    "🍘", "🍙", "🍚", "🍛", "🍜", "🍝", "🍠", "🍢", "🍣", "🍤", "🍥", "🥮", "🍡", "🥟", "🥠", "🥡", 
    "🦀", "🦞", "🦐", "🦑", "🐙", "🦪", "🍧", "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", 
    "🍫", "🍿", "🍩", "🍪", "🌰", "🥜", "🍯", "🥛", "🍼", "☕", "🍵", "🧃", "🥤", "🍶", "🍺", "🍻", 
    "🥂", "🍷", "🥃", "🍸", "🍹", "🧉", "🍾", "🧊", "🥄", "🍴", "🍽️", "🥢", "🥡", "🐶", "🐱", "🐭", 
    "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐸", "🐷", "🐽", "🐴", "🦄", "🐮", "🐔", "🐧", 
    "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦓", "🦒", "🐘", "🦏", "🦛", 
    "🐪", "🐫", "🦙", "🦘", "🐃", "🐂", "🐄", "🐎", "🐖", "🐏", "🐑", "🦌", "🐕", "🐩", "🦮", "🐕‍🦺", 
    "🐈", "🐈‍⬛", "🐓", "🦃", "🦚", "🦜", "🦢", "🦩", "🕊️", "🐇", "🦝", "🦨", "🦡", "🦦", "🦥", "🐁", 
    "🐀", "🐿️", "🦔", "🐾", "🐉", "🐲", "🌵", "🎄", "🌲", "🌳", "🌴", "🌱", "🌿", "☘️", "🍀", "🎍", 
    "🎋", "🍃", "🍂", "🍁", "🍄", "🐚", "🌾", "💐", "🌷", "🌹", "🥀", "🌺", "🌸", "🌼", "🌻", "🌞", 
    "🌝", "🌛", "🌜", "🌚", "🌕", "🌖", "🌗", "🌘", "🌑", "🌒", "🌓", "🌔", "🌙", "🌎", "🌍", "🌏", 
    "🪐", "💫", "⭐", "🌟", "✨", "⚡", "☄️", "💥", "🌪️", "🌈", "☀️", "🌤️", "⛅", "🌦️", "🌧️", "⛈️", 
    "🌩️", "🌨️", "❄️", "☃️", "⛄", "🌬️", "💨", "💧", "💦", "☔", "☂️", "🌊", "🌫️", "☮️", "✝️", "☪️", 
    "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", 
    "♐", "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳", "🈶", "🈚", "🈸", "🈺", "🈷️", "✴️", 
    "🆚", "💮", "🉐", "㊙️", "㊗️", "🈴", "🈵", "🈹", "🈲", "🅰️", "🅱️", "🆎", "🆑", "🅾️", "🆘", "❌", 
    "⭕", "🛑", "⛔", "📛", "🚫", "💯", "💢", "♨️", "🚷", "🚯", "🚳", "🚱", "🔞", "📵", "🚭", "❗", "❕", 
    "❓", "❔", "‼️", "⁉️", "🔅", "🔆", "〽️", "⚠️", "🚸", "🔱", "⚜️", "🔰", "♻️", "✅", "🈯", "💹", "❇️", 
    "✳️", "❎", "🌐", "💠", "Ⓜ️", "🌀", "💤", "🏧", "🚾", "♿", "🅿️", "🈳", "🈂️", "🛂", "🛃", "🛄", 
    "🛅", "🚹", "🚺", "🚼", "🚻", "🚮", "🎦", "📶", "🈁", "🔣", "ℹ️", "🔤", "🔡", "🔠", "🆖", "🆗", 
    "🆙", "🆒", "🆕", "🆓", "0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟", 
    "🔢", "#️⃣", "*️⃣", "⏏️", "▶️", "⏸️", "⏯️", "⏹️", "⏺️", "⏭️", "⏮️", "⏩", "⏪", "⏫", "⏬", "◀️", 
    "🔼", "🔽", "➡️", "⬅️", "⬆️", "⬇️", "↗️", "↘️", "↙️", "↖️", "↕️", "↔️", "↪️", "↩️", "⤴️", "⤵️", 
    "🔀", "🔁", "🔂", "🔄", "🔃", "🎵", "🎶", "➕", "➖", "➗", "✖️", "♾️", "💲", "💱", "™️", "©️", "®️", 
    "〰️", "➰", "➿", "🔚", "🔙", "🔛", "🔝", "🔜", "✔️", "☑️", "🔘", "🔴", "🟠", "🟡", "🟢", "🔵", 
    "🟣", "⚫", "⚪", "🟤", "🔺", "🔻", "🔸", "🔹", "🔶", "🔷", "🔳", "🔲", "▪️", "▫️", "◾", "◽", "◼️", 
    "◻️", "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "⬛", "⬜", "🟫", "🔈", "🔇", "🔉", "🔊", "🔔", "🔕", 
    "📣", "📢", "👁️‍🗨️", "💬", "💭", "🗯️", "♠️", "♣️", "♥️", "♦️", "🃏", "🎴", "🀄", "🕐", "🕑", "🕒", 
    "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚", "🕛", "🕜", "🕝", "🕞", "🕟", "🕠", "🕡", "🕢", 
    "🕣", "🕤", "🕥", "🕦", "🕧"
  ];

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleAudioSend = async (audioBlob: Blob, duration: number) => {
    if (!currentUser) return;

    try {
      const audioUrl = URL.createObjectURL(audioBlob);

      const newMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        channelId: privateChannelId,
        userId: currentUser.id,
        userName: currentUser.displayName || currentUser.username || "Usuário",
        userAvatar: currentUser.avatar,
        content: `Áudio (${Math.floor(duration)}s)`,
        messageType: "file" as const,
        timestamp: new Date(),
        reactions: {},
        metadata: {
          fileType: "audio",
          audioUrl,
          duration,
        },
      };

      setMessages((prev) => [...prev, newMessage]);
      playNotificationSound("send");
      setShowAudioRecorder(false);
      setIsRecording(false);

      toast({
        title: "Áudio enviado",
        description: "Sua mensagem de áudio foi enviada.",
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar áudio",
        description: "Falha ao enviar mensagem de áudio.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    const fileUrl = URL.createObjectURL(file);
    let fileType = "document";
    if (file.type.startsWith("image/")) fileType = "image";
    else if (file.type.startsWith("video/")) fileType = "video";

    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      channelId: privateChannelId,
      userId: currentUser.id,
      userName: currentUser.displayName || currentUser.username || "Usuário",
      userAvatar: currentUser.avatar,
      content: file.name,
      messageType: "file" as const,
      timestamp: new Date(),
      reactions: {},
      metadata: {
        fileType,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
      },
    };

    setMessages((prev) => [...prev, newMessage]);
    playNotificationSound("send");

    toast({
      title: "Arquivo enviado",
      description: `${file.name} foi compartilhado.`,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const reactions = { ...msg.reactions };
          const userId = currentUser?.id;

          if (!reactions[emoji]) {
            reactions[emoji] = [];
          }

          if (!reactions[emoji].includes(userId)) {
            reactions[emoji].push(userId);
          }

          return { ...msg, reactions };
        }
        return msg;
      }),
    );
  };

  const insertEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleSendMessage = () => {
    if (!message.trim() || !currentUser) return;

    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      channelId: privateChannelId,
      userId: currentUser.id,
      userName: currentUser.displayName || currentUser.username || "Usuário",
      userAvatar: currentUser.avatar,
      content: message.trim(),
      messageType: "text" as const,
      timestamp: new Date(),
      reactions: {},
    };

    setMessages((prev) => [...prev, newMessage]);
    playNotificationSound("send");
    setMessage("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    toast({
      title: "Mensagem enviada",
      description: `Mensagem privada enviada para ${targetUser.displayName}`,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: Date) => {
    return format(new Date(timestamp), "HH:mm", { locale: ptBR });
  };

  const getRoleColor = (roleName?: string) => {
    if (roleName === "Administrador" || roleName === "Admin")
      return "text-yellow-600";
    if (roleName === "Gerente" || roleName === "Gestor") return "text-blue-600";
    return "text-muted-foreground";
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`max-w-4xl w-[750px] h-[700px] p-0 ${isMinimized ? "h-16" : ""}`}
      >
        {/* Header */}
        <DialogHeader className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={targetUser.avatar || ""} />
                <AvatarFallback className="text-xs">
                  {targetUser.displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-base">
                  {targetUser.displayName}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    @{targetUser.username}
                  </span>
                  {targetUser.roleName && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${getRoleColor(targetUser.roleName)}`}
                    >
                      {targetUser.roleName}
                    </Badge>
                  )}
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Video className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <Avatar className="h-16 w-16 mx-auto mb-3">
                      <AvatarImage src={targetUser.avatar || ""} />
                      <AvatarFallback>
                        {targetUser.displayName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-medium mb-2">
                      Conversa com {targetUser.displayName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Esta é uma conversa privada. Apenas vocês dois podem ver
                      essas mensagens.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage = msg.userId === currentUser?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""} group`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={msg.userAvatar || ""} />
                          <AvatarFallback className="text-xs">
                            {msg.userName
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div
                          className={`flex-1 max-w-[70%] ${isOwnMessage ? "text-right" : ""}`}
                        >
                          <div
                            className={`inline-block p-3 rounded-lg relative ${
                              isOwnMessage
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {/* Conteúdo da mensagem */}
                            {msg.messageType === "file" &&
                            msg.metadata?.fileType === "audio" ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    const audio = new Audio(
                                      msg.metadata.audioUrl,
                                    );
                                    audio.play();
                                  }}
                                >
                                  <div className="h-4 w-4 bg-current rounded-full flex items-center justify-center">
                                    <div className="h-2 w-2 bg-white rounded-full" />
                                  </div>
                                </Button>
                                <span className="text-sm">{msg.content}</span>
                              </div>
                            ) : msg.messageType === "file" &&
                              msg.metadata?.fileType === "image" ? (
                              <div>
                                <img
                                  src={msg.metadata.fileUrl}
                                  alt={msg.content}
                                  className="max-w-64 max-h-64 rounded object-cover cursor-pointer"
                                  onClick={() =>
                                    window.open(msg.metadata.fileUrl, "_blank")
                                  }
                                />
                                <p className="text-xs mt-1">{msg.content}</p>
                              </div>
                            ) : msg.messageType === "file" ? (
                              <div className="flex items-center gap-2">
                                <Paperclip className="h-4 w-4" />
                                <span
                                  className="text-sm underline cursor-pointer"
                                  onClick={() =>
                                    window.open(msg.metadata.fileUrl, "_blank")
                                  }
                                >
                                  {msg.content}
                                </span>
                              </div>
                            ) : (
                              <p className="text-sm">{msg.content}</p>
                            )}

                            {/* Botões de ação que aparecem no hover */}
                            <div className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex gap-1 bg-background border rounded-lg shadow-sm p-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => addReaction(msg.id, "👍")}
                                >
                                  👍
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => addReaction(msg.id, "❤️")}
                                >
                                  ❤️
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => addReaction(msg.id, "😂")}
                                >
                                  😂
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Reações */}
                          {Object.keys(msg.reactions || {}).length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {Object.entries(msg.reactions).map(
                                ([emoji, users]) => {
                                  const userList = Array.isArray(users)
                                    ? users
                                    : [];
                                  return (
                                    userList.length > 0 && (
                                      <Button
                                        key={emoji}
                                        variant="outline"
                                        size="sm"
                                        className="h-6 px-2 text-xs"
                                        onClick={() =>
                                          addReaction(msg.id, emoji)
                                        }
                                      >
                                        {emoji} {userList.length}
                                      </Button>
                                    )
                                  );
                                },
                              )}
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground mt-1">
                            {formatMessageTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t space-y-3">
              {/* Gravador de Áudio */}
              {showAudioRecorder && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <AudioRecorder
                    ref={audioRecorderRef}
                    onSendAudio={handleAudioSend}
                    onCancel={() => {
                      setShowAudioRecorder(false);
                      setIsRecording(false);
                    }}
                    onRecordingStateChange={setIsRecording}
                    autoStart={isRecording}
                  />
                </div>
              )}

              <div className="flex gap-2">
                {/* Botões de Ação */}
                <div className="flex gap-1">
                  {/* Anexos */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0"
                    onClick={() => fileInputRef.current?.click()}
                    title="Anexar arquivo"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>

                  {/* Emojis */}
                  <Popover
                    open={showEmojiPicker}
                    onOpenChange={setShowEmojiPicker}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 p-0"
                        title="Adicionar emoji"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3">
                      <div className="grid grid-cols-8 gap-1">
                        {FREQUENT_EMOJIS.map((emoji) => (
                          <Button
                            key={emoji}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-lg hover:bg-muted"
                            onClick={() => insertEmoji(emoji)}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Áudio */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-10 w-10 p-0 ${isRecording ? "bg-red-100 text-red-600" : ""}`}
                    onClick={() => {
                      if (showAudioRecorder) {
                        setShowAudioRecorder(false);
                        setIsRecording(false);
                      } else {
                        setShowAudioRecorder(true);
                        setIsRecording(true);
                      }
                    }}
                    title={isRecording ? "Parar gravação" : "Gravar áudio"}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>

                {/* Input de Texto */}
                <Textarea
                  ref={textareaRef}
                  placeholder={`Mensagem para ${targetUser.displayName}...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="min-h-[40px] max-h-32 resize-none flex-1"
                  rows={1}
                />

                {/* Botão Enviar */}
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  size="sm"
                  className="h-10 px-3"
                  title="Enviar mensagem"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
