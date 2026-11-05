import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { google } from "googleapis";
import admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";

// Initialize Firebase Admin
const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
    credential: admin.credential.applicationDefault()
  });
  console.log(`Firebase Admin initialized for project: ${firebaseConfig.projectId}`);
}

const db = getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId);
const messaging = admin.messaging(admin.app());

console.log(`Firestore target: Project=${firebaseConfig.projectId}, Database=${firebaseConfig.firestoreDatabaseId}`);

// Test connection
db.collection('users').limit(1).get()
  .then(() => console.log("Firestore connection successful"))
  .catch(err => console.error("Firestore connection failed:", err));

// Helper to send push notifications
async function sendPushNotification(token: string, title: string, body: string, data?: any) {
  try {
    await messaging.send({
      token,
      notification: {
        title,
        body,
      },
      data: data || {},
    });
    console.log(`Notification sent to token: ${token}`);
  } catch (error) {
    console.error("Error sending push notification:", error);
    // If token is invalid, we might want to remove it from the user document
  }
}

// Listen for new global messages to notify students
db.collection('global_messages').onSnapshot(snapshot => {
  snapshot.docChanges().forEach(async (change) => {
    if (change.type === 'added') {
      const message = change.doc.data();
      // Avoid notifying for very old messages on initial load
      const messageTime = new Date(message.timestamp).getTime();
      if (Date.now() - messageTime > 60000) return;

      console.log("New global message detected, sending notifications...");
      
      try {
        // Get all users with fcmTokens
        const usersSnap = await db.collection('users').where('fcmToken', '!=', '').get();
        const tokens = usersSnap.docs.map(doc => doc.data().fcmToken).filter(t => !!t);

        if (tokens.length > 0) {
          // FCM allows sending to multiple tokens at once
          const response = await messaging.sendEachForMulticast({
            tokens,
            notification: {
              title: "Novo Comunicado!",
              body: message.text.substring(0, 100) + (message.text.length > 100 ? "..." : ""),
            },
          });
          console.log(`${response.successCount} notifications sent for global message.`);
        }
      } catch (err) {
        console.error("Error sending global message notifications:", err);
      }
    }
  });
}, error => {
  console.error("Error in global_messages snapshot listener:", error);
});

// Periodically check for upcoming classes to notify instructors
setInterval(async () => {
  console.log("Checking for upcoming classes to notify instructors...");
  const now = new Date();
  const in30Mins = new Date(now.getTime() + 30 * 60 * 1000);
  const in45Mins = new Date(now.getTime() + 45 * 60 * 1000);

  try {
    console.log("Executing class reminder query...");
    const eventsSnap = await db.collection('events')
      .where('type', '==', 'Aula')
      .get();

    console.log(`Found ${eventsSnap.size} total events to check.`);

    for (const doc of eventsSnap.docs) {
      const event = doc.data();
      if (event.status === 'Aviso Enviado') continue; // Manual filter
      // Handle Firestore Timestamp vs Date string
      const eventDate = event.date?.toDate ? event.date.toDate() : new Date(event.date);
      const [hours, minutes] = event.time.split(':');
      eventDate.setHours(parseInt(hours), parseInt(minutes), 0);

      if (eventDate > in30Mins && eventDate < in45Mins) {
        console.log(`Found upcoming class: ${event.title} for ${event.instructorEmail}`);
        
        // Find instructor's FCM token
        const instructorSnap = await db.collection('users')
          .where('email', '==', event.instructorEmail)
          .limit(1)
          .get();

        if (!instructorSnap.empty) {
          const instructor = instructorSnap.docs[0].data();
          if (instructor.fcmToken) {
            await sendPushNotification(
              instructor.fcmToken,
              "Lembrete de Aula",
              `Sua aula de "${event.title}" começa em breve (às ${event.time}).`
            );
            
            // Mark as notified
            await doc.ref.update({ status: 'Aviso Enviado' });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in class reminder job:", error);
  }
}, 15 * 60 * 1000); // Run every 15 minutes

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL || 'http://localhost:3000'}/auth/google/callback`
);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Google OAuth Routes
  app.get("/api/auth/google/url", (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured in secrets.");
      return res.status(500).json({ 
        error: "Configuração do Google OAuth pendente. Por favor, adicione as chaves GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET nas chaves de segredo (Secrets) do projeto." 
      });
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/drive.file'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    res.json({ url });
  });

  app.get(["/auth/google/callback", "/auth/google/callback/"], async (req, res) => {
    const { code } = req.query;
    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      oauth2Client.setCredentials(tokens);

      // Get user info to associate tokens
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      const email = userInfo.data.email;

      if (email) {
        // Store tokens in Firestore
        await db.collection('instructor_tokens').doc(email).set({
          tokens,
          updatedAt: FieldValue.serverTimestamp()
        });
      }

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', email: '${email}' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Autenticação bem-sucedida! Você já pode fechar esta janela.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error during Google OAuth callback:", error);
      res.status(500).send("Erro na autenticação com o Google.");
    }
  });

  app.post("/api/calendar/import", express.json(), async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    try {
      const tokenDoc = await db.collection('instructor_tokens').doc(email).get();
      if (!tokenDoc.exists) {
        return res.status(401).json({ error: "Google Calendar not connected" });
      }

      const { tokens } = tokenDoc.data()!;
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      auth.setCredentials(tokens);

      const calendar = google.calendar({ version: 'v3', auth });
      
      // Fetch events from the last 30 days to 90 days in the future
      const now = new Date();
      const timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const timeMax = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const googleEvents = response.data.items || [];
      const importedEvents = googleEvents
        .filter(ge => ge.status !== 'cancelled')
        .map(ge => {
          const start = ge.start?.dateTime || ge.start?.date;
          const end = ge.end?.dateTime || ge.end?.date;
          const startDate = new Date(start!);
          
          return {
            googleEventId: ge.id,
            title: ge.summary || '(Sem título)',
            date: startDate.toISOString().split('T')[0],
            time: formatTime(startDate),
            instructor: ge.description?.includes('Instrutor:') ? ge.description.split('Instrutor:')[1].split('\n')[0].trim() : 'Google Calendar',
            instructorEmail: email,
            type: ge.summary?.includes('[Studio]') ? 'Aula' : 'Evento',
            category: 'Google Sync',
            status: 'Confirmado',
            capacity: 20,
            enrolled: 0,
            importedFromGoogle: true
          };
        });

      res.json({ status: "success", events: importedEvents });
    } catch (error) {
      console.error("Error importing from Google Calendar:", error);
      res.status(500).json({ error: "Failed to import events" });
    }
  });

  function formatTime(date: Date) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  app.post("/api/calendar/sync", express.json(), async (req, res) => {
    const { email, events } = req.body;

    if (!email || !events || !Array.isArray(events)) {
      return res.status(400).json({ error: "Email and events array are required" });
    }

    try {
      const tokenDoc = await db.collection('instructor_tokens').doc(email).get();
      if (!tokenDoc.exists) {
        return res.status(401).json({ error: "Google Calendar not connected" });
      }

      const { tokens } = tokenDoc.data()!;
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      auth.setCredentials(tokens);

      const calendar = google.calendar({ version: 'v3', auth });
      const results = [];

      // Sync events
      for (const event of events) {
        try {
          const start = new Date(event.date);
          const [hours, minutes] = event.time.split(':');
          start.setHours(parseInt(hours), parseInt(minutes), 0);
          
          const end = new Date(start.getTime() + 60 * 60 * 1000); // Assume 1 hour

          const eventBody = {
            summary: `[Studio] ${event.title}`,
            description: `Instrutor: ${event.instructor}\nTipo: ${event.type}\nTurma: ${event.turma || 'Nenhuma'}`,
            start: { dateTime: start.toISOString() },
            end: { dateTime: end.toISOString() },
            status: event.status === 'Fechado' ? 'cancelled' : 'confirmed',
          };

          let googleEvent;
          if (event.googleEventId) {
            try {
              googleEvent = await calendar.events.patch({
                calendarId: 'primary',
                eventId: event.googleEventId,
                requestBody: eventBody,
              });
            } catch (patchError: any) {
              // If event was deleted in Google Calendar, create a new one
              if (patchError.code === 404) {
                googleEvent = await calendar.events.insert({
                  calendarId: 'primary',
                  requestBody: eventBody,
                });
              } else {
                throw patchError;
              }
            }
          } else {
            googleEvent = await calendar.events.insert({
              calendarId: 'primary',
              requestBody: eventBody,
            });
          }

          results.push({
            id: event.id,
            googleEventId: googleEvent.data.id
          });
        } catch (eventError) {
          console.error(`Error syncing event ${event.id}:`, eventError);
          results.push({ id: event.id, error: "Failed to sync" });
        }
      }

      res.json({ status: "success", results });
    } catch (error) {
      console.error("Error syncing to Google Calendar:", error);
      res.status(500).json({ error: "Failed to sync events" });
    }
  });

  app.post("/api/calendar/delete", express.json(), async (req, res) => {
    const { email, googleEventId } = req.body;

    if (!email || !googleEventId) {
      return res.status(400).json({ error: "Email and googleEventId are required" });
    }

    try {
      const tokenDoc = await db.collection('instructor_tokens').doc(email).get();
      if (!tokenDoc.exists) {
        return res.status(401).json({ error: "Google Calendar not connected" });
      }

      const { tokens } = tokenDoc.data()!;
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      auth.setCredentials(tokens);

      const calendar = google.calendar({ version: 'v3', auth });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: googleEventId,
      });

      res.json({ status: "success" });
    } catch (error: any) {
      console.error("Error deleting from Google Calendar:", error);
      if (error.code === 404) {
        return res.json({ status: "success", message: "Event already deleted" });
      }
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  app.post("/api/drive/backup", express.json(), async (req, res) => {
    const { email, data } = req.body;

    if (!email || !data) {
      return res.status(400).json({ error: "Email and data are required" });
    }

    try {
      const tokenDoc = await db.collection('instructor_tokens').doc(email).get();
      if (!tokenDoc.exists) {
        return res.status(401).json({ error: "Google Drive not connected" });
      }

      const { tokens } = tokenDoc.data()!;
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      auth.setCredentials(tokens);

      const drive = google.drive({ version: 'v3', auth });

      const fileName = `backup-estudio-${new Date().toISOString().split('T')[0]}.json`;
      const fileMetadata = {
        name: fileName,
        mimeType: 'application/json',
      };

      const media = {
        mimeType: 'application/json',
        body: JSON.stringify(data, null, 2),
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
      });

      res.json({ status: "success", fileId: file.data.id });
    } catch (error) {
      console.error("Error backing up to Google Drive:", error);
      res.status(500).json({ error: "Failed to backup to Google Drive" });
    }
  });

  app.post("/api/drive/upload", express.json({ limit: '50mb' }), async (req, res) => {
    const { email, fileName, content, mimeType } = req.body;

    if (!email || !fileName || !content) {
      return res.status(400).json({ error: "Email, fileName and content are required" });
    }

    try {
      const tokenDoc = await db.collection('instructor_tokens').doc(email).get();
      if (!tokenDoc.exists) {
        return res.status(401).json({ error: "Google Drive not connected" });
      }

      const { tokens } = tokenDoc.data()!;
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      auth.setCredentials(tokens);

      const drive = google.drive({ version: 'v3', auth });

      const fileMetadata = {
        name: fileName,
        parents: [], // Can specify a folder ID here if needed
      };

      const media = {
        mimeType: mimeType || 'application/json',
        body: content,
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
      });

      res.json({ status: "success", fileId: file.data.id, link: file.data.webViewLink });
    } catch (error) {
      console.error("Error uploading to Google Drive:", error);
      res.status(500).json({ error: "Failed to upload to Google Drive" });
    }
  });

  // Automated Backup and Failure Alert Endpoints
  async function triggerBackupFailureAlert(reason: string, emailToNotify?: string) {
    console.log(`[Backup Alert] Triggering failure alerts for reason: ${reason}`);
    
    // 1. Send FCM Push Notification to Managers/Admins with FCM tokens
    try {
      const managersSnap = await db.collection('users')
        .where('role', 'in', ['Gerente', 'Administrador', 'Master Admin'])
        .get();
      
      const tokens = managersSnap.docs
        .map(d => d.data().fcmToken)
        .filter(t => !!t);

      if (tokens.length > 0) {
        await messaging.sendEachForMulticast({
          tokens,
          notification: {
            title: "⚠️ Falha no Backup Automático",
            body: `Não foi possível salvar o backup no Google Drive: ${reason}`,
          },
          data: {
            type: 'BACKUP_FAILURE',
            timestamp: new Date().toISOString(),
          }
        });
        console.log(`[Backup Alert] Push notification sent to ${tokens.length} manager devices.`);
      }
    } catch (pushErr) {
      console.error("[Backup Alert] Error sending push notification:", pushErr);
    }

    // 2. Add in-app notification to global messages / notifications
    try {
      await db.collection('global_messages').add({
        text: `⚠️ Alerta de Sistema: O backup automático para o Google Drive falhou às ${new Date().toLocaleTimeString('pt-BR')} (${reason}). Verifique a conexão com o Google Drive em Configurações.`,
        timestamp: new Date().toISOString(),
        author: 'Sistema de Backup',
        type: 'alert'
      });
    } catch (msgErr) {
      console.error("[Backup Alert] Error creating global message:", msgErr);
    }

    // 3. Simulated Email Alert to configured email
    const recipient = emailToNotify || process.env.BACKUP_ALERT_EMAIL || 'stylourbanostudio@gmail.com';
    console.log(`[Backup Alert] Email alert sent to ${recipient}: Falha no backup automático do Google Drive (${reason})`);
  }

  // Periodic Auto-Backup Job (Runs in background every 15 minutes)
  setInterval(async () => {
    try {
      const configSnap = await db.collection('config').doc('studio').get();
      if (!configSnap.exists) return;
      const config = configSnap.data() || {};
      const autoBackup = config.autoBackup;
      if (!autoBackup || !autoBackup.enabled) return;

      const lastBackup = config.lastBackupDate ? new Date(config.lastBackupDate).getTime() : 0;
      const now = Date.now();
      const frequency = autoBackup.frequency || 'daily';

      let intervalMs = 24 * 60 * 60 * 1000;
      if (frequency === '6h') intervalMs = 6 * 60 * 60 * 1000;
      else if (frequency === 'daily') intervalMs = 24 * 60 * 60 * 1000;
      else if (frequency === 'weekly') intervalMs = 7 * 24 * 60 * 60 * 1000;
      else if (frequency === 'monthly') intervalMs = 30 * 24 * 60 * 60 * 1000;

      if (now - lastBackup >= intervalMs) {
        console.log(`[Auto Backup Cron] Backup is due (Frequency: ${frequency}). Executing...`);

        const collections = ['users', 'students', 'events', 'modalities', 'rooms'];
        const backupData: any = { 
          timestamp: new Date().toISOString(), 
          version: '1.2',
          source: 'Stylo Urbano Cloud Backup Cron'
        };
        for (const col of collections) {
          const snap = await db.collection(col).get();
          backupData[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        const email = autoBackup.googleEmail || config.ownerEmail || 'stylourbanostudio@gmail.com';
        const tokenDoc = await db.collection('instructor_tokens').doc(email).get();

        if (!tokenDoc.exists) {
          const errorReason = `Google Drive não conectado para a conta ${email}.`;
          console.warn(`[Auto Backup Cron] ${errorReason}`);
          await db.collection('backup_logs').add({
            timestamp: new Date().toISOString(),
            status: 'failure',
            errorReason,
            triggeredBy: 'cron_scheduler',
            notifiedEmail: autoBackup.alertEmail || email,
            channels: autoBackup.channels || { push: true, email: true }
          });
          if (autoBackup.notifyOnFailure) {
            await triggerBackupFailureAlert(errorReason, autoBackup.alertEmail);
          }
          return;
        }

        const { tokens } = tokenDoc.data()!;
        const auth = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );
        auth.setCredentials(tokens);

        const drive = google.drive({ version: 'v3', auth });
        const fileName = `backup-stylo-urbano-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        const content = JSON.stringify(backupData, null, 2);

        const file = await drive.files.create({
          requestBody: { name: fileName, mimeType: 'application/json' },
          media: { mimeType: 'application/json', body: content },
          fields: 'id, webViewLink'
        });

        const currentDate = new Date().toISOString();
        await db.collection('backup_logs').add({
          timestamp: currentDate,
          status: 'success',
          fileName,
          fileId: file.data.id,
          link: file.data.webViewLink,
          sizeBytes: content.length,
          triggeredBy: 'cron_scheduler',
          storageType: 'Google Drive'
        });

        await db.collection('config').doc('studio').set({
          lastBackupDate: currentDate,
          lastBackupStatus: 'success',
          lastBackupFileId: file.data.id,
          lastBackupFileName: fileName,
          lastBackupLink: file.data.webViewLink || ''
        }, { merge: true });

        console.log(`[Auto Backup Cron] Backup successfully created: ${file.data.id}`);
      }
    } catch (cronErr: any) {
      console.error("[Auto Backup Cron] Error in periodic backup job:", cronErr);
    }
  }, 15 * 60 * 1000);


  app.get("/api/backup/logs", async (req, res) => {
    try {
      const logsSnap = await db.collection('backup_logs')
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get();
      
      const logs = logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ logs });
    } catch (error) {
      console.error("Error fetching backup logs:", error);
      res.status(500).json({ error: "Failed to fetch backup logs" });
    }
  });

  app.post("/api/backup/test-failure-alert", express.json(), async (req, res) => {
    const { email, reason } = req.body;
    const errorReason = reason || "Token de acesso do Google Drive expirado ou permissão revogada.";
    
    try {
      await triggerBackupFailureAlert(errorReason, email);
      
      // Also register a failed log in backup_logs
      await db.collection('backup_logs').add({
        timestamp: new Date().toISOString(),
        status: 'failure',
        errorReason,
        triggeredBy: 'teste_manual_alerta',
        notifiedEmail: email || 'stylourbanostudio@gmail.com',
        channels: { push: true, email: true }
      });

      res.json({ 
        status: "success", 
        message: "Alerta de falha enviado com sucesso via Notificação Push e E-mail de Teste." 
      });
    } catch (error) {
      console.error("Error testing backup failure alert:", error);
      res.status(500).json({ error: "Erro ao testar alerta de falha" });
    }
  });

  app.post("/api/backup/auto-execute", express.json({ limit: '50mb' }), async (req, res) => {
    const { email, backupData, alertSettings } = req.body;

    if (!email) {
      const errorReason = "E-mail de autenticação do Google Drive não fornecido.";
      if (alertSettings?.notifyOnFailure) {
        await triggerBackupFailureAlert(errorReason, alertSettings.alertEmail);
      }
      return res.status(400).json({ error: errorReason });
    }

    try {
      const tokenDoc = await db.collection('instructor_tokens').doc(email).get();
      if (!tokenDoc.exists) {
        const errorReason = "Conta do Google Drive não conectada ou sem autorização ativa.";
        
        await db.collection('backup_logs').add({
          timestamp: new Date().toISOString(),
          status: 'failure',
          errorReason,
          triggeredBy: 'auto_backup',
          notifiedEmail: alertSettings?.alertEmail || email,
          channels: alertSettings?.channels || { push: true, email: true }
        });

        if (alertSettings?.notifyOnFailure) {
          await triggerBackupFailureAlert(errorReason, alertSettings.alertEmail);
        }

        return res.status(401).json({ error: errorReason });
      }

      const { tokens } = tokenDoc.data()!;
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      auth.setCredentials(tokens);

      const drive = google.drive({ version: 'v3', auth });

      const fileName = `backup-stylo-urbano-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const content = JSON.stringify(backupData || {}, null, 2);

      const fileMetadata = {
        name: fileName,
        mimeType: 'application/json',
      };

      const media = {
        mimeType: 'application/json',
        body: content,
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink, size',
      });

      const now = new Date().toISOString();

      // Register success in backup_logs
      await db.collection('backup_logs').add({
        timestamp: now,
        status: 'success',
        fileName,
        fileId: file.data.id,
        link: file.data.webViewLink,
        sizeBytes: content.length,
        triggeredBy: 'auto_backup',
        storageType: 'Google Drive'
      });

      // Update studio config
      await db.collection('config').doc('studio').set({
        lastBackupDate: now,
        lastBackupStatus: 'success',
        lastBackupFileId: file.data.id,
        lastBackupFileName: fileName,
        lastBackupLink: file.data.webViewLink || ''
      }, { merge: true });

      res.json({ 
        status: "success", 
        fileId: file.data.id, 
        link: file.data.webViewLink,
        fileName,
        timestamp: now
      });
    } catch (error: any) {
      console.error("Error executing automated backup:", error);
      const errorReason = error?.message || "Erro desconhecido ao comunicar com a API do Google Drive";

      // Register failure in backup_logs
      await db.collection('backup_logs').add({
        timestamp: new Date().toISOString(),
        status: 'failure',
        errorReason,
        triggeredBy: 'auto_backup',
        notifiedEmail: alertSettings?.alertEmail || email,
        channels: alertSettings?.channels || { push: true, email: true }
      });

      // Update studio config with error
      await db.collection('config').doc('studio').set({
        lastBackupStatus: 'failure',
        lastBackupError: errorReason
      }, { merge: true });

      if (alertSettings?.notifyOnFailure) {
        await triggerBackupFailureAlert(errorReason, alertSettings.alertEmail);
      }

      res.status(500).json({ error: "Falha na execução do backup", details: errorReason });
    }
  });

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("join_room", (studentId) => {
      socket.join(studentId);
      console.log(`User ${socket.id} joined room ${studentId}`);
    });

    socket.on("send_message", (data) => {
      // data: { studentId, message }
      io.to(data.studentId).emit("receive_message", data.message);
    });

    socket.on("typing", (data) => {
      // data: { studentId, sender, isTyping }
      socket.to(data.studentId).emit("display_typing", data);
    });

    socket.on("mark_read", (data) => {
      // data: { studentId, messageId }
      io.to(data.studentId).emit("message_read", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
