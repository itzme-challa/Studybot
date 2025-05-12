import { Telegraf } from 'telegraf';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { saveChatId, fetchChatIdsFromSheet } from './utils/chatStore';
import { saveToSheet } from './utils/saveToSheet';
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
bot.on('text', pdf());

// /users command
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

// --- GREETING HANDLING ---
bot.start(async (ctx) => {
  if (isPrivateChat(ctx.chat.type)) {
    await ctx.reply('Welcome! Use /help to explore commands.');
    await greeting()(ctx); // Trigger greeting on /start
  }
});

bot.on('text', async (ctx) => {
  const messageText = ctx.message.text?.trim().toLowerCase();

  // Trigger greeting when "hi", "hello", or similar messages are detected
  if (['hi', 'hello', 'hey', 'hii', 'heyy', 'start', '/start'].includes(messageText)) {
    await greeting()(ctx); // Trigger greeting on text messages like 'hi'
  }
});

// New group added
bot.on('new_chat_members', async (ctx) => {
  for (const member of ctx.message.new_chat_members) {
    if (member.username === ctx.botInfo.username) {
      await ctx.reply(`Thanks for adding me! Type /help to get started.`);
    }
  }
});

// --- MESSAGE HANDLER ---
bot.on('message', async (ctx) => {
  const chat = ctx.chat;
  const msg = ctx.message as { text?: string; reply_to_message?: { text?: string } };

  if (!chat?.id) return;

  // Save chat ID only for private chats
  if (isPrivateChat(chat.type)) {
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
  }
});

// --- DEPLOYMENT HANDLER ---
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};

if (ENVIRONMENT !== 'production') {
  development(bot);
}
