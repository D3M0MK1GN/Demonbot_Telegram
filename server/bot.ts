import { Telegraf, Context, Scenes, session } from 'telegraf';
import { storage } from './storage';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { insertCaseSchema, insertUserSchema } from '@shared/schema';
import path from 'path';
import fs from 'fs';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN must be set');
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Export for sending messages from backend
export async function sendMessageToUser(telegramId: string, message: string) {
  try {
    await bot.telegram.sendMessage(telegramId, message);
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
  }
}

// Function to set bot photo
async function setBotPhoto() {
  try {
    const photoPath = path.resolve(process.cwd(), 'attached_assets/generated_images/cybersecurity_assistant_bot_profile_picture.png');
    if (fs.existsSync(photoPath)) {
      await bot.telegram.setChatPhoto(process.env.TELEGRAM_BOT_TOKEN!.split(':')[0], { source: photoPath });
      console.log('Bot photo updated successfully');
    }
  } catch (error) {
    console.error('Error setting bot photo:', error);
  }
}

// --- Scenes for Multi-step conversation ---
const { BaseScene, Stage } = Scenes;

const reportScene = new BaseScene<any>('REPORT_SCENE');

reportScene.enter((ctx) => {
  ctx.reply('🛡️ *Bienvenido al Sistema de Asistencia para Víctimas de Delitos Informáticos*\n\nEstoy aquí para ayudarte a registrar tu caso de forma segura y profesional.\n\nPara comenzar, ¿qué tipo de delito deseas reportar?', {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [
        [{ text: 'Phishing (Suplantación)' }, { text: 'Hackeo de WhatsApp' }],
        [{ text: 'Hackeo de Email' }, { text: 'Extorsión' }],
        [{ text: 'Otro' }]
      ],
      one_time_keyboard: true,
      resize_keyboard: true
    }
  });
  ctx.scene.session.state = { step: 'crime_type' };
});

reportScene.on('text', async (ctx) => {
  const state = ctx.scene.session.state;
  const text = ctx.message.text;

  switch (state.step) {
    case 'crime_type':
      state.crimeType = text;
      state.step = 'full_name';
      ctx.reply('Entendido. Ahora iniciaremos con tus *Datos Personales*.\n\nPor favor, ingresa tu *Nombre Completo*:', { parse_mode: 'Markdown' });
      break;
    case 'full_name':
      state.fullName = text;
      state.step = 'id_number';
      ctx.reply('Gracias. Ahora, ingresa tu *Número de Cédula o Identificación*:', { parse_mode: 'Markdown' });
      break;
    case 'id_number':
      state.idNumber = text;
      state.step = 'age';
      ctx.reply('¿Cuál es tu *edad*? (Por favor, ingresa solo números):', { parse_mode: 'Markdown' });
      break;
    case 'age':
      const age = parseInt(text);
      if (isNaN(age)) {
        return ctx.reply('Por favor, ingresa una edad válida (solo números).');
      }
      state.age = age;
      state.step = 'confirm_initial';
      ctx.reply(`Gracias. Hemos registrado los primeros datos:\n\n*Tipo:* ${state.crimeType}\n*Nombre:* ${state.fullName}\n*ID:* ${state.idNumber}\n*Edad:* ${state.age}\n\n¿Deseas continuar con el resto del reporte? (Responde "si" para guardar este borrador y seguir)`, { parse_mode: 'Markdown' });
      break;
    case 'confirm_initial':
      if (text.toLowerCase() === 'si') {
        try {
          let user = await storage.getUserByTelegramId(ctx.from.id.toString());
          if (!user) {
            user = await storage.createUser({
              telegramId: ctx.from.id.toString(),
              fullName: state.fullName,
              identificationNumber: state.idNumber,
              age: state.age,
              role: 'user'
            });
          } else {
            // Update user if exists
            await db.update(users).set({
              fullName: state.fullName,
              identificationNumber: state.idNumber,
              age: state.age,
              updatedAt: new Date()
            }).where(eq(users.id, user.id));
          }

          const newCase = await storage.createCase({
            userId: user.id,
            type: state.crimeType.toLowerCase().includes('phishing') ? 'phishing' : 
                  state.crimeType.toLowerCase().includes('whatsapp') ? 'hackeo_whatsapp' :
                  state.crimeType.toLowerCase().includes('email') ? 'hackeo_email' :
                  state.crimeType.toLowerCase().includes('extorsion') ? 'extorsion' : 'otro',
            status: 'nuevo',
            description: 'Registro inicial de datos personales completado.',
            incidentDate: new Date(),
          });

          ctx.reply(`✅ *Borrador Guardado*\nNúmero de caso: \`${newCase.caseNumber}\`\n\nHe completado los primeros 3 pasos de tu reporte. Un asesor ha sido notificado y puede contactarte por este medio pronto.\n\nUsa /nuevo_caso si deseas iniciar otro reporte o espera el contacto del asesor.`, { parse_mode: 'Markdown' });
        } catch (error) {
          console.error('Bot Error:', error);
          ctx.reply('Lo siento, hubo un error al guardar tu reporte. Por favor intenta más tarde.');
        }
        return ctx.scene.leave();
      } else {
        ctx.reply('Reporte cancelado. Puedes iniciar de nuevo con /nuevo_caso');
        return ctx.scene.leave();
      }
  }
});

const stage = new Stage([reportScene]);
bot.use(session());
bot.use(stage.middleware());

// Handle incoming messages from user (not in scene) to route to chat
bot.on('text', async (ctx, next) => {
  if (ctx.message.text.startsWith('/')) return next();
  
  const telegramId = ctx.from.id.toString();
  const user = await storage.getUserByTelegramId(telegramId);
  
  if (user) {
    // Find active case for this user
    const userCases = await storage.getCases(1, 0);
    const activeCase = userCases.find(c => c.userId === user.id && c.status !== 'cerrado');
    
    if (activeCase) {
      await storage.createMessage({
        caseId: activeCase.id,
        senderId: user.id,
        content: ctx.message.text,
        fromAdmin: false
      });
      return; // Handled
    }
  }
  
  return next();
});

// --- Commands ---
bot.start((ctx) => {
  ctx.reply('¡Hola! Soy tu asistente de seguridad digital. Usa /nuevo_caso para reportar un incidente.');
});

bot.command('nuevo_caso', (ctx: any) => ctx.scene.enter('REPORT_SCENE'));

bot.help((ctx) => {
  ctx.reply('Comandos disponibles:\n/start - Inicio\n/nuevo_caso - Reportar un delito\n/cancel - Cancelar operación');
});

export function startBot() {
  bot.launch();
  console.log('Telegram Bot started');

  // Try to set photo on startup
  setBotPhoto();

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
