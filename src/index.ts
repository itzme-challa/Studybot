import { Telegraf } from 'telegraf';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { saveToSheet } from './utils/saveToSheet';
import { fetchChatIdsFromSheet } from './utils/chatStore';
import { about } from './commands/about';
import { help } from './commands/help';
import { pdf } from './commands/pdf';
import { greeting } from './text/greeting';
import { production, development } from './core';
import { isPrivateChat } from './utils/groupSettings';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';
const ADMIN_ID = 6930703214;

if (!BOT_TOKEN) throw new Error('BOT_TOKEN not provided!');
console.log(`Running bot in ${ENVIRONMENT} mode`);

const bot = new Telegraf(BOT_TOKEN);

// --- COMMANDS ---
bot.command('about', about());
bot.command('help', help());

// Admin-only command: /users
bot.command('users', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized.');

  try {
    const chatIds = await fetchChatIdsFromSheet();
    await ctx.reply(`📊 Total users: ${chatIds.length}`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: 'Refresh', callback_data: 'refresh_users' }]],
      },
    });
  } catch (err) {
    console.error('Error fetching user count:', err);
    await ctx.reply('❌ Unable to fetch user count.');
  }
});

// --- START COMMAND ---
bot.start(async (ctx) => {
  if (isPrivateChat(ctx.chat.type)) {
    await ctx.reply('Welcome! Use /help to explore commands.');
    await greeting()(ctx); // Run greeting on /start
  }
});

// --- MAIN TEXT HANDLER (runs both greeting and PDF logic) ---
bot.on('text', async (ctx) => {
  try {
    await greeting()(ctx); // greeting checks if text matches and responds if needed
    await pdf()(ctx);      // pdf checks if text matches code and responds if needed
  } catch (err) {
    console.error('Error in text handler:', err);
  }
});

// --- NEW GROUP MEMBER WELCOME ---
bot.on('new_chat_members', async (ctx) => {
  for (const member of ctx.message.new_chat_members) {
    if (member.username === ctx.botInfo.username) {
      await ctx.reply(`Thanks for adding me! Type /help to get started.`);
    }
  }
});

// --- TRACK USERS IN PRIVATE CHATS ---
bot.on('message', async (ctx) => {
  const chat = ctx.chat;
  if (!chat?.id || !isPrivateChat(chat.type)) return;

  const alreadyNotified = await saveToSheet(chat);
  console.log(`Saved chat ID: ${chat.id} (${chat.type})`);

  if (chat.id !== ADMIN_ID && !alreadyNotified) {
    const name = 'first_name' in chat ? chat.first_name : 'Unknown';
    const username = 'username' in chat ? `@${chat.username}` : 'N/A';

    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `*New user started the bot!*\n\n*Name:* ${name}\n*Username:* ${username}\n*Chat ID:* ${chat.id}\n*Type:* ${chat.type}`,
      { parse_mode: 'Markdown' }
    );
  }
});

// --- DEPLOYMENT HANDLER ---
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};

if (ENVIRONMENT !== 'production') {
  development(bot);
}
