// Main Telegram Bot Setup (Cleaned)
import { Telegraf } from 'telegraf';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllChatIds, saveChatId } from './utils/chatStore';
import { fetchChatIdsFromSheet } from './utils/chatStore';
import { saveToSheet } from './utils/saveToSheet';
import { about, help } from './commands';
import { greeting } from './text';
import { development, production } from './core';
import { isPrivateChat } from './utils/groupSettings';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';
const ADMIN_ID = 6930703214;

if (!BOT_TOKEN) throw new Error('BOT_TOKEN not provided!');
const bot = new Telegraf(BOT_TOKEN);

// --- COMMANDS ---
bot.command('about', about());
bot.command('help', help());

// --- GREETING ON /start ---
bot.start(async (ctx) => {
  if (isPrivateChat(ctx.chat.type)) {
    await greeting()(ctx);
  }
});

// --- MESSAGE HANDLER ---
bot.on('message', async (ctx) => {
  const chat = ctx.chat;
  const msg = ctx.message as { text?: string; reply_to_message?: { text?: string } };
  const chatType = chat.type;

  if (!chat?.id) return;

  saveChatId(chat.id);
  const alreadyNotified = await saveToSheet(chat);

  if (chat.id !== ADMIN_ID && !alreadyNotified) {
    if (chat.type === 'private' && 'first_name' in chat && 'username' in chat) {
      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `*New user started the bot!*\n\n*Name:* ${chat.first_name}\n*Username:* @${chat.username}\nChat ID: ${chat.id}`,
        { parse_mode: 'Markdown' }
      );
    }
  }

  if (chat.id === ADMIN_ID && msg.reply_to_message?.text) {
    const match = msg.reply_to_message.text.match(/Chat ID: (\d+)/);
    if (match) {
      const targetId = parseInt(match[1], 10);
      try {
        await ctx.telegram.sendMessage(
          targetId,
          `*Admin's Reply:*\n${msg.text}`,
          { parse_mode: 'Markdown' }
        );
      } catch (err) {
        console.error('Failed to send swipe reply:', err);
      }
    }
    return;
  }

  if (isPrivateChat(chatType)) {
    await greeting()(ctx);
  }
});

// --- DEPLOYMENT ---
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};

if (ENVIRONMENT !== 'production') {
  development(bot);
}
