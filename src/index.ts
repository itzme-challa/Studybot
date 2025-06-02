import { Telegraf } from 'telegraf';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { fetchChatIdsFromFirebase, getLogsByDate } from './utils/chatStore';
import { saveToFirebase } from './utils/saveToFirebase';
import { logMessage } from './utils/logMessage';
import { about } from './commands/about';
import { help, handleHelpPagination } from './commands/help';
import { pdf } from './commands/pdf';
import { greeting } from './text/greeting';
import { production, development } from './core';
import { isPrivateChat } from './utils/groupSettings';
import { setupBroadcast } from './commands/broadcast';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';
const ADMIN_ID = 6930703214;

if (!BOT_TOKEN) throw new Error('BOT_TOKEN not provided!');
console.log(`Running bot in ${ENVIRONMENT} mode`);

const bot = new Telegraf(BOT_TOKEN);

// Vercel export
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};

// --- Commands ---
bot.command('about', about());

const helpTriggers = ['help', 'study', 'material', 'pdf', 'pdfs'];
helpTriggers.forEach(trigger => bot.command(trigger, help()));
bot.hears(/^(help|study|material|pdf|pdfs)$/i, help());

bot.command('start', async (ctx) => {
  const chat = ctx.chat;
  const user = ctx.from;
  if (!chat || !user) return;

  const alreadyNotified = await saveToFirebase(chat);

  if (isPrivateChat(chat.type)) {
    await greeting()(ctx);
    await logMessage(chat.id, '/start', user);
  }

  if (!alreadyNotified && chat.id !== ADMIN_ID) {
    const name = user.first_name || (chat.type === 'group' || chat.type === 'supergroup' ? chat.title : 'Unknown') || 'Unknown';
    const username = user.username 
      ? `@${user.username}` 
      : (chat.type === 'supergroup' && 'username' in chat ? `@${chat.username}` : 'N/A');
    const chatTypeLabel = chat.type.charAt(0).toUpperCase() + chat.type.slice(1);

    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `*New ${chatTypeLabel} started the bot!*\n\n*Name:* ${name}\n*Username:* ${username}\n*Chat ID:* ${chat.id}\n*Type:* ${chat.type}`,
      { parse_mode: 'Markdown' }
    );
  }
});

bot.command('users', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized.');
  try {
    const chatIds = await fetchChatIdsFromFirebase();
    await ctx.reply(`📊 Total interacting entities: ${chatIds.length}`, {
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

bot.command('logs', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return;
  const parts = ctx.message?.text?.split(' ') || [];
  if (parts.length < 2)
    return ctx.reply("Usage: /logs <YYYY-MM-DD> or /logs <chatid>");

  const dateOrChatId = parts[1];
  try {
    const logs = await getLogsByDate(dateOrChatId);
    if (logs === 'No logs found for this date.') {
      await ctx.reply(logs);
    } else {
      await ctx.replyWithDocument({
        source: Buffer.from(logs, 'utf-8'),
        filename: `logs-${dateOrChatId}.txt`,
      });
    }
  } catch (err) {
    console.error('Error fetching logs:', err);
    await ctx.reply('❌ Error fetching logs.');
  }
});

setupBroadcast(bot);

bot.on('message', async (ctx) => {
  const chat = ctx.chat;
  const user = ctx.from;
  const message = ctx.message;

  if (!chat?.id || !user) return;

  const alreadyNotified = await saveToFirebase(chat);

  if (isPrivateChat(chat.type)) {
    let logText = '[Unknown/Unsupported message type]';

    if ('text' in message) {
      logText = message.text;
    } else if ('photo' in message) {
      logText = '[Photo message]';
    } else if ('document' in message) {
      logText = `[Document: ${message.document.file_name || 'Unnamed'}]`;
    } else if ('video' in message) {
      logText = '[Video message]';
    } else if ('voice' in message) {
      logText = '[Voice message]';
    } else if ('audio' in message) {
      logText = '[Audio message]';
    } else if ('sticker' in message) {
      logText = `[Sticker: ${message.sticker.emoji || 'Sticker'}]`;
    } else if ('contact' in message) {
      logText = '[Contact shared]';
    } else if ('location' in message) {
      logText = `[Location: ${message.location.latitude}, ${message.location.longitude}]`;
    } else if ('poll' in message) {
      logText = `[Poll: ${message.poll.question}]`;
    }

    try {
      await logMessage(chat.id, logText, user);
    } catch (err) {
      console.error('Failed to log message:', err);
    }

    if (!('text' in message)) {
      const name = user.first_name || 'Unknown';
      const username = user.username ? `@${user.username}` : 'N/A';
      const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      const header = `*Non-text message received!*\n\n*Name:* ${name}\n*Username:* ${username}\n*Chat ID:* ${chat.id}\n*Time:* ${time}\n`;

      try {
        await ctx.telegram.sendMessage(ADMIN_ID, header, { parse_mode: 'Markdown' });
        await ctx.forwardMessage(ADMIN_ID as number, chat.id as number, message.message_id as number);
      } catch (err) {
        console.error('Failed to forward non-text message:', err);
      }
    }
  }
});

bot.on('text', async (ctx) => {
  if (!ctx.chat || !isPrivateChat(ctx.chat.type)) return;

  const text = ctx.message.text?.toLowerCase();
  if (['help', 'study', 'material', 'pdf', 'pdfs'].includes(text)) {
    await help()(ctx);
  } else {
    await greeting()(ctx);
    await pdf()(ctx);
  }
});

bot.on('new_chat_members', async (ctx) => {
  for (const member of ctx.message.new_chat_members) {
    if (member.username === ctx.botInfo.username) {
      await ctx.reply('Thanks for adding me! Type /help to get started.');
    }
  }
});

if (ENVIRONMENT !== 'production') {
  development(bot);
}
