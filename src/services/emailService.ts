import { toast } from 'sonner';

export interface WelcomeEmailData {
  to: string;
  name: string;
  role: string;
  login: string;
  password: string;
  phone?: string;
}

export const sendWelcomeEmail = async (data: WelcomeEmailData) => {
  // In a real application, this would call an API like SendGrid, Mailgun, or a Firebase Cloud Function.
  // For this environment, we will simulate the process and log the content.
  
  console.log('--- SIMULATED EMAIL SENT ---');
  console.log(`To: ${data.to}`);
  console.log(`Subject: Bem-vindo ao Stylo Urbano Gestão - ${data.name}`);
  console.log(`Body:
    Olá ${data.name},
    
    Seu cadastro como ${data.role} foi realizado com sucesso!
    
    Aqui estão seus dados de acesso:
    Login: ${data.login}
    Senha: ${data.password}
    
    Por favor, altere sua senha após o primeiro login para sua segurança.
    
    Equipe Stylo Urbano
  `);
  console.log('----------------------------');

  // We can also show a toast to inform the manager that the email was "sent"
  toast.success(`E-mail de boas-vindas enviado para ${data.to}`);
  
  return true;
};

export const sendPasswordResetEmail = async (email: string, name: string, newPassword: string) => {
  console.log('--- SIMULATED PASSWORD RESET EMAIL SENT ---');
  console.log(`To: ${email}`);
  console.log(`Subject: Reset de Senha - Stylo Urbano Gestão`);
  console.log(`Body:
    Olá ${name},
    
    Sua senha foi resetada pelo administrador.
    
    Nova senha temporária: ${newPassword}
    
    Equipe Stylo Urbano
  `);
  console.log('-------------------------------------------');
  toast.success(`E-mail de reset de senha enviado para ${email}`);
  return true;
};

export interface BackupFailureAlertData {
  to: string;
  studioName: string;
  timestamp: string;
  errorReason: string;
  frequency: string;
}

export const sendBackupFailureAlertEmail = async (data: BackupFailureAlertData) => {
  console.log('--- ⚠️ SIMULATED BACKUP FAILURE ALERT EMAIL SENT ---');
  console.log(`To: ${data.to}`);
  console.log(`Subject: ⚠️ Alerta Crítico: Falha no Backup Automático do Google Drive - ${data.studioName}`);
  console.log(`Body:
    Atenção Administrador do ${data.studioName},

    O sistema detectou uma falha ao tentar realizar o backup automático agendado para o Google Drive.

    Detalhes do Incidente:
    • Data/Hora da Tentativa: ${data.timestamp}
    • Frequência Programada: ${data.frequency}
    • Motivo do Erro: ${data.errorReason}

    Ações Recomendadas:
    1. Acesse o sistema e abra a aba "Configurações > Backup & Portabilidade".
    2. Verifique se a sua conta do Google Drive continua conectada e autorizada.
    3. Clique em "Fazer Backup Agora" para testar a sincronização manual.

    Atenciosamente,
    Sistema de Monitoramento Automatizado - Stylo Urbano
  `);
  console.log('----------------------------------------------------');
  toast.error(`Alerta de falha enviado para o e-mail: ${data.to}`);
  return true;
};

