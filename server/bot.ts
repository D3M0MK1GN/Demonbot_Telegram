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
    const photoPath = path.resolve(process.cwd(), 'attached_assets/generated_images/cybersecurity_shield_assistant_digital_guardian_bot_profile_picture.png');
    if (fs.existsSync(photoPath)) {
      // Solo intentamos cambiar la foto si el bot tiene acceso a un canal o grupo, 
      // ya que no se puede cambiar la foto de un chat privado (como el bot mismo via API de esta forma a veces falla)
      // En realidad, para cambiar la foto del BOT se usa el BotFather, pero Telegraf permite setChatPhoto si el bot es admin.
      // Si falla es generalmente porque el ID no es de un chat válido para esta operación.
      console.log('Attempting to set bot photo...');
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
      if (isNaN(age) || age < 1 || age > 99) {
        return ctx.reply('Por favor, ingresa una edad válida entre 1 y 99 años (solo números):');
      }
      state.age = age;
      state.step = 'birth_date';
      ctx.reply('Gracias. Ahora ingresa tu *Fecha de Nacimiento* (formato DD/MM/AAAA):', { parse_mode: 'Markdown' });
      break;
    case 'birth_date':
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = text.match(dateRegex);
      if (!match) {
        return ctx.reply('Formato de fecha inválido. Usa DD/MM/AAAA (ejemplo: 15/05/1990):');
      }
      const day = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const year = parseInt(match[3]);
      const birthDate = new Date(year, month, day);
      
      if (isNaN(birthDate.getTime()) || birthDate > new Date()) {
        return ctx.reply('La fecha ingresada no es válida. Por favor verifica:');
      }

      // Validar contra edad
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }

      if (Math.abs(calculatedAge - state.age) > 1) {
        return ctx.reply(`⚠️ La fecha de nacimiento no coincide con la edad de ${state.age} años ingresada anteriormente. Por favor, verifica tu fecha de nacimiento (DD/MM/AAAA):`);
      }

      state.birthDate = birthDate;
      state.step = 'address';
      ctx.reply('Entendido. ¿Cuál es tu *Dirección de Residencia*?:', { parse_mode: 'Markdown' });
      break;
    case 'address':
      state.address = text;
      state.step = 'profession';
      ctx.reply('¿Cuál es tu *Profesión*?:', { parse_mode: 'Markdown' });
      break;
    case 'profession':
      state.profession = text;
      state.step = 'phone_number';
      ctx.reply('Por favor, ingresa tu *Número de Teléfono* de contacto:', { parse_mode: 'Markdown' });
      break;
    case 'phone_number':
      state.phoneNumber = text;
      state.step = 'incident_description';
      ctx.reply('Finalmente, por favor describe de forma detallada lo que sucedió (*Descripción del Incidente*):', { parse_mode: 'Markdown' });
      break;
    case 'incident_description':
      state.description = text;
      state.step = 'confirm_initial';
      ctx.reply(`Gracias. Hemos registrado los datos del reporte:\n\n*Nombre:* ${state.fullName}\n*Edad:* ${state.age}\n*Teléfono:* ${state.phoneNumber}\n\n¿Deseas guardar y enviar este reporte? (Responde "si" para confirmar)`, { parse_mode: 'Markdown' });
      break;
    case 'confirm_initial':
      if (text.toLowerCase() === 'si') {
        try {
          let user = await storage.getUserByTelegramId(ctx.from.id.toString());
          const userData = {
            telegramId: ctx.from.id.toString(),
            telegramUsername: ctx.from.username,
            fullName: state.fullName,
            identificationNumber: state.idNumber,
            age: state.age,
            birthDate: state.birthDate,
            address: state.address,
            profession: state.profession,
            phoneNumber: state.phoneNumber,
            role: 'user' as const,
            lastIp: (ctx as any).ip
          };

          if (!user) {
            user = await storage.createUser(userData);
          } else {
            await db.update(users).set({
              ...userData,
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
            description: state.description,
            incidentDate: new Date(),
          });

          ctx.reply(`✅ <b>Borrador Guardado</b>\nNúmero de caso: <code>${newCase.caseNumber}</code>\n\nHe completado los primeros 3 pasos de tu reporte. Un asesor ha sido notificado y puede contactarte por este medio pronto.\n\nUsa /nuevo_caso si deseas iniciar otro reporte o espera el contacto del asesor.`, { parse_mode: 'HTML' });
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
