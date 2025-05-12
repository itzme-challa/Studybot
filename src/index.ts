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

// /broadcast
bot.command('broadcast', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized.');

  const msg = ctx.message.text?.split(' ').slice(1).join(' ');
  if (!msg) return ctx.reply('Usage:\n/broadcast Your message here');

  try {
    const chatIds = await fetchChatIdsFromSheet();
    if (!chatIds.length) return ctx.reply('No users to broadcast to.');

    let success = 0;
    for (const id of chatIds) {
      try {
        await ctx.telegram.sendMessage(id, msg);
        success++;
      } catch (err) {
        console.log(`Failed to send to ${id}`, err);
      }
    }
    await ctx.reply(`✅ Broadcast sent to ${success} users.`);
  } catch (err) {
    console.error('Broadcast error:', err);
    await ctx.reply('❌ Error broadcasting.');
  }
});

// /reply
bot.command('reply', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized.');

  const [_, chatIdStr, ...msgParts] = ctx.message.text?.split(' ') ?? [];
  const chatId = Number(chatIdStr);
  const message = msgParts.join(' ');

  if (isNaN(chatId) || !message) {
    return ctx.reply('Usage:\n/reply <chat_id> <message>');
  }

  try {
    await ctx.telegram.sendMessage(chatId, `*Admin's Reply:*\n${message}`, { parse_mode: 'Markdown' });
    await ctx.reply(`Reply sent to ${chatId}`);
  } catch (err) {
    console.error('Reply error:', err);
    await ctx.reply(`Failed to send reply to ${chatId}`);
  }
});

// Refresh button
bot.action('refresh_users', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.answerCbQuery('Unauthorized');

  try {
    const chatIds = await fetchChatIdsFromSheet();
    await ctx.editMessageText(`📊 Total users: ${chatIds.length} (refreshed)`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: 'Refresh', callback_data: 'refresh_users' }]],
      },
    });
    await ctx.answerCbQuery('Refreshed!');
  } catch (err) {
    console.error('Refresh error:', err);
    await ctx.answerCbQuery('Refresh failed');
  }
});

// /start for private chat
bot.start(async (ctx) => {
  if (isPrivateChat(ctx.chat.type)) {
    await ctx.reply('Welcome! Use /help to explore commands.');
    await greeting()(ctx);
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

  // Handle /contact
  if (msg.text?.startsWith('/contact')) {
    const userMsg = msg.text.replace('/contact', '').trim() || msg.reply_to_message?.text;
    if (userMsg) {
      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `*Contact Message*\nFrom: ${chat.first_name} (@${chat.username || 'N/A'})\nChat ID: ${chat.id}\n\n${userMsg}`,
        { parse_mode: 'Markdown' }
      );
      await ctx.reply('Your message has been sent to the admin!');
    } else {
      await ctx.reply('Please provide a message or reply using /contact.');
    }
    return;
  }

  // Admin swipe reply
  if (chat.id === ADMIN_ID && msg.reply_to_message?.text) {
    const match = msg.reply_to_message.text.match(/Chat ID: (\d+)/);
    if (match) {
      const targetId = parseInt(match[1], 10);
      try {
        await ctx.telegram.sendMessage(targetId, `*Admin's Reply:*\n${msg.text}`, { parse_mode: 'Markdown' });
      } catch (err) {
        console.error('Swipe reply error:', err);
      }
    }
    return;
  }

  // Private greeting fallback
  if (isPrivateChat(chat.type)) {
    await greeting()(ctx);
  }
});

// --- DEPLOYMENT HANDLER ---
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};

if (ENVIRONMENT !== 'production') {
  development(bot);
}
