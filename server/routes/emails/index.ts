import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../conversations/middleware';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Endpoint para envio de emails
router.post('/send', requireAuth, upload.any(), async (req, res) => {
  try {
    const { from, to, subject, body } = req.body;
    const attachments = req.files as Express.Multer.File[];

    if (!from || !to || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: from, to, subject, body'
      });
    }

    // Validar se SendGrid está configurado
    if (!process.env.SENDGRID_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Serviço de email não configurado. Entre em contato com o administrador.'
      });
    }

    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Preparar anexos se existirem
    const emailAttachments = attachments?.map(file => ({
      content: require('fs').readFileSync(file.path).toString('base64'),
      filename: file.originalname,
      type: file.mimetype,
      disposition: 'attachment'
    })) || [];

    // Preparar email
    const msg = {
      from: from,
      to: to.split(',').map((email: string) => email.trim()),
      subject: subject,
      html: body.replace(/\n/g, '<br>'),
      attachments: emailAttachments
    };

    // Enviar email
    await sgMail.send(msg);

    // Limpar arquivos temporários
    if (attachments) {
      attachments.forEach(file => {
        try {
          require('fs').unlinkSync(file.path);
        } catch (error) {
          console.warn('Erro ao remover arquivo temporário:', error);
        }
      });
    }

    // Log da atividade
    console.log(`📧 Email enviado de ${from} para ${to} - Assunto: ${subject}`);

    res.json({
      success: true,
      message: 'Email enviado com sucesso',
      recipients: to.split(',').length
    });

  } catch (error) {
    console.error('Erro ao enviar email:', error);
    
    // Limpar arquivos temporários em caso de erro
    if (req.files) {
      (req.files as Express.Multer.File[]).forEach(file => {
        try {
          require('fs').unlinkSync(file.path);
        } catch (cleanupError) {
          console.warn('Erro ao remover arquivo temporário:', cleanupError);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao enviar email'
    });
  }
});

export default router;