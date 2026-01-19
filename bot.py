import os
import logging
import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv
from telegram import Update, ReplyKeyboardMarkup, KeyboardButton
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes, MessageHandler, filters, ConversationHandler

# 1. Configuración de Logs
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# 2. Cargar Variables de Env
load_dotenv()
TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
DATABASE_URL = os.environ.get("DATABASE_URL")

if not TOKEN or not DATABASE_URL:
    logger.error("Variables CRÍTICAS faltantes")
    exit(1)

# 3. Pool de Conexiones
try:
    db_pool = psycopg2.pool.SimpleConnectionPool(1, 10, DATABASE_URL)
except Exception as e:
    logger.error(f"Error Pool: {e}")
    exit(1)

def get_db_connection():
    return db_pool.getconn()

def release_db_connection(conn):
    if conn:
        db_pool.putconn(conn)

# --- ESTADOS ---
TIPO, DESCR, UBIC, MONTO, EVID, CONS = range(6)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.effective_user: return
    uid = str(update.effective_user.id)
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE telegram_id = %s", (uid,))
        if not cur.fetchone():
            cur.execute("INSERT INTO users (telegram_id, telegram_username, role, created_at, updated_at, last_active) VALUES (%s, %s, 'user', NOW(), NOW(), NOW())", (uid, update.effective_user.username))
            conn.commit()
        cur.close()
    finally: release_db_connection(conn)
    kb = [[KeyboardButton("Reportar un incidente")], [KeyboardButton("Consultar número sospechoso")], [KeyboardButton("Hablar con un asesor")]]
    await update.message.reply_text("Bienvenido a CyberGuard. Selecciona una opción:", reply_markup=ReplyKeyboardMarkup(kb, resize_keyboard=True))

async def iniciar_reporte(update: Update, context: ContextTypes.DEFAULT_TYPE):
    kb = [[KeyboardButton("Phishing")], [KeyboardButton("Extorsión")], [KeyboardButton("Otros")]]
    await update.message.reply_text("¿Qué tipo de incidente?", reply_markup=ReplyKeyboardMarkup(kb, one_time_keyboard=True, resize_keyboard=True))
    return TIPO

async def capturar_tipo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['t'] = update.message.text
    await update.message.reply_text("Describe lo sucedido:", reply_markup=ReplyKeyboardMarkup([["Cancelar"]], resize_keyboard=True))
    return DESCR

async def capturar_descr(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message.text.lower() == "cancelar": return await cancelar(update, context)
    context.user_data['d'] = update.message.text
    await update.message.reply_text("¿En qué ciudad?", reply_markup=ReplyKeyboardMarkup([["Omitir"], ["Cancelar"]], resize_keyboard=True))
    return UBIC

async def capturar_ubic(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message.text.lower() == "cancelar": return await cancelar(update, context)
    context.user_data['u'] = None if update.message.text.lower() == "omitir" else update.message.text
    await update.message.reply_text("¿Monto perdido?", reply_markup=ReplyKeyboardMarkup([["0"], ["Cancelar"]], resize_keyboard=True))
    return MONTO

async def capturar_monto(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message.text.lower() == "cancelar": return await cancelar(update, context)
    try: context.user_data['m'] = float(update.message.text.replace("$","").replace(",",""))
    except: return MONTO
    await update.message.reply_text("Envía evidencia o 'Finalizar':", reply_markup=ReplyKeyboardMarkup([["Finalizar"], ["Cancelar"]], resize_keyboard=True))
    return EVID

async def capturar_evid(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message.text and update.message.text.lower() == "finalizar":
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT id FROM users WHERE telegram_id = %s", (str(update.effective_user.id),))
            rid = cur.fetchone()[0]
            cur.execute("INSERT INTO cases (user_id, type, description, location, amount_lost, status, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, 'nuevo', NOW(), NOW()) RETURNING id",
                        (rid, context.user_data.get('t','otro'), context.user_data.get('d',''), context.user_data.get('u'), context.user_data.get('m',0)))
            cid = cur.fetchone()[0]
            for ev in context.user_data.get('e', []):
                cur.execute("INSERT INTO evidences (case_id, file_path, file_type, created_at) VALUES (%s, %s, 'telegram', NOW())", (cid, ev))
            conn.commit()
            await update.message.reply_text(f"Reporte #{cid} guardado.")
        finally: release_db_connection(conn)
        context.user_data.clear()
        return ConversationHandler.END
    
    fid = update.message.photo[-1].file_id if update.message.photo else update.message.document.file_id if update.message.document else None
    if fid:
        if 'e' not in context.user_data: context.user_data['e'] = []
        context.user_data['e'].append(fid)
        await update.message.reply_text("Recibido. ¿Algo más?")
    return EVID

async def iniciar_cons(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Número a consultar:", reply_markup=ReplyKeyboardMarkup([["Cancelar"]], resize_keyboard=True))
    return CONS

async def procesar_cons(update: Update, context: ContextTypes.DEFAULT_TYPE):
    n = update.message.text.strip()
    if n.lower() == "cancelar": return await cancelar(update, context)
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT report_count FROM reported_numbers WHERE number = %s", (n,))
        res = cur.fetchone()
        await update.message.reply_text(f"Reportado {res[0]} veces" if res else "Sin reportes.")
    finally: release_db_connection(conn)
    return ConversationHandler.END

async def hablar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Un asesor te contactará.")
    return ConversationHandler.END

async def cancelar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data.clear()
    await update.message.reply_text("Cancelado.")
    return ConversationHandler.END

if __name__ == '__main__':
    app = ApplicationBuilder().token(TOKEN).build()
    app.add_handler(CommandHandler('start', start))
    app.add_handler(ConversationHandler(
        entry_points=[MessageHandler(filters.Regex('^Reportar'), iniciar_reporte), MessageHandler(filters.Regex('^Consultar'), iniciar_cons), MessageHandler(filters.Regex('^Hablar'), hablar)],
        states={
            TIPO: [MessageHandler(filters.TEXT & ~filters.COMMAND, capturar_tipo)],
            DESCR: [MessageHandler(filters.TEXT & ~filters.COMMAND, capturar_descr)],
            UBIC: [MessageHandler(filters.TEXT & ~filters.COMMAND, capturar_ubic)],
            MONTO: [MessageHandler(filters.TEXT & ~filters.COMMAND, capturar_monto)],
            EVID: [MessageHandler(filters.PHOTO | filters.Document.ALL | filters.Regex('^Finalizar$'), capturar_evid)],
            CONS: [MessageHandler(filters.TEXT & ~filters.COMMAND, procesar_cons)],
        },
        fallbacks=[CommandHandler('cancel', cancelar), MessageHandler(filters.Regex('^Cancelar$'), cancelar)],
    ))
    app.run_polling()
