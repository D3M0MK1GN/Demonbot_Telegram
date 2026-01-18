import { Telegraf, Context, Scenes, session } from 'telegraf';
import { storage } from './storage';
import { insertCaseSchema, insertUserSchema } from '@shared/schema';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN must be set');
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// --- Scenes for Multi-step conversation ---
const { BaseScene, Stage } = Scenes;

const reportScene = new BaseScene<any>('REPORT_SCENE');

reportScene.enter((ctx) => {
  ctx.reply('Bienvenido al sistema de asistencia. Vamos a registrar tu caso.\n\n¿Cuál es tu nombre completo?');
  ctx.scene.session.state = { step: 'name' };
});

reportScene.on('text', async (ctx) => {
  const state = ctx.scene.session.state;
  const text = ctx.message.text;

  switch (state.step) {
    case 'name':
      state.fullName = text;
      state.step = 'id';
      ctx.reply('Gracias. Ahora, ingresa tu número de cédula o identificación:');
      break;
    case 'id':
      state.idNumber = text;
      state.step = 'type';
      ctx.reply('¿Qué tipo de delito deseas reportar?', {
        reply_markup: {
          keyboard: [
            [{ text: 'phishing' }, { text: 'hackeo_whatsapp' }],
            [{ text: 'hackeo_email' }, { text: 'extorsion' }],
            [{ text: 'otro' }]
          ],
          one_time_keyboard: true,
          resize_keyboard: true
        }
      });
      break;
    case 'type':
      state.type = text;
      state.step = 'description';
      ctx.reply('Describe brevemente lo sucedido:');
      break;
    case 'description':
      state.description = text;
      state.step = 'confirm';
      ctx.reply(`Resumen del reporte:\nNombre: ${state.fullName}\nTipo: ${state.type}\nDescripción: ${state.description}\n\n¿Es correcto? (Responde "si" para confirmar)`);
      break;
    case 'confirm':
      if (text.toLowerCase() === 'si') {
        try {
          // 1. Create/Update User
          let user = await storage.getUserByTelegramId(ctx.from.id.toString());
          if (!user) {
            user = await storage.createUser({
              telegramId: ctx.from.id.toString(),
              fullName: state.fullName,
              identificationNumber: state.idNumber,
              role: 'user'
            });
          }

          // 2. Create Case
          const newCase = await storage.createCase({
            userId: user.id,
            type: state.type as any,
            status: 'nuevo',
            description: state.description,
            incidentDate: new Date(),
          });

          ctx.reply(`✅ Caso registrado exitosamente.\nNúmero de caso: ${newCase.caseNumber}\n\nUn asesor revisará tu reporte pronto.`);
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

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
