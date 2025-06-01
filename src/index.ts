import { Telegraf, session, Context, Markup } from 'telegraf';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { saveToSheet } from './utils/saveToSheet';
import { fetchChatIdsFromSheet } from './utils/chatStore';
import { about } from './commands/about';
import { help, handleHelpPagination } from './commands/help';
import { pdf } from './commands/pdf';
import { yakeen, handleYakeenPagination, handleYakeenSubject, handleYakeenChapter, handleYakeenKeys, getKeys } from './commands/yakeen';
import { greeting } from './text/greeting';
import { production, development } from './core';
import { isPrivateChat } from './utils/groupSettings';
import { setupBroadcast } from './commands/broadcast';
import { db, ref, set } from './utils/firebase'; // Import Firebase utilities

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';
const ADMIN_ID = 6930703214;

if (!BOT_TOKEN) throw new Error('BOT_TOKEN not provided!');
console.log(`Running bot in ${ENVIRONMENT} mode`);

interface SessionData {
  awaitingKeys?: { batch: string; subject: string; chapter: string };
}

interface MyContext extends Context {
  session: SessionData;
}

const bot = new Telegraf<MyContext>(BOT_TOKEN);
bot.use(session());

// --- Commands ---
bot.command('about', about());

// Multiple triggers for help/material/pdf content
const helpTriggers = ['help', 'study', 'material', 'pdf', 'pdfs'];
helpTriggers.forEach(trigger => bot.command(trigger, help()));
bot.hears(/^(help|study|material|pdf|pdfs)$/i, help);

// Yakeen command
bot.command('yakeen', yakeen());

// Admin: /publish
bot.command('publish', async (ctx: MyContext) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized.');
  await handleYakeenSubject(ctx, '2026');
});

// Admin: /users
bot.command('users', async (ctx: MyContext) => {
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

// Admin: /broadcast
setupBroadcast(bot);

// --- Callback Handler ---
bot.on('callback_query', async (ctx: MyContext) => {
  const callback = ctx.callbackQuery;
  if ('data' in callback) {
    const data = callback.data;

    if (data.startsWith('help_page_')) {
      await handleHelpPagination()(ctx);
    } else if (data === 'refresh_users' && ctx.from?.id === ADMIN_ID) {
      try {
        const chatIds = await fetchChatIdsFromSheet();
        await ctx.editMessageText(`📊 Total users: ${chatIds.length}`, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: 'Refresh', callback_data: 'refresh_users' }]],
          },
        });
      } catch (err) {
        console.error('Error refreshing users:', err);
        await ctx.answerCbQuery('Failed to refresh.');
      }
    } else if (data.startsWith('yakeen_subject_')) {
      await handleYakeenSubject(ctx, data.split('_')[2]);
    } else if (data.startsWith('yakeen_chapter_')) {
      await handleYakeenChapter(ctx, data.split('_')[2], data.split('_')[3]);
    } else if (data.startsWith('yakeen_page_')) {
      await handleYakeenPagination(ctx, data.split('_')[2], data.split('_')[3]);
    } else if (data.startsWith('yakeen_keys_')) {
      await handleYakeenKeys(ctx, data.split('_')[2], data.split('_')[3], data.split('_')[4]);
    } else {
      await ctx.answerCbQuery('Unknown action');
    }
  } else {
    await ctx.answerCbQuery('Unsupported callback type');
  }
});

// --- /start ---
bot.start(async (ctx: MyContext) => {
  if (!ctx.chat || !isPrivateChat(ctx.chat.type)) return;

  const user = ctx.from;
  const chat = ctx.chat;

  await greeting()(ctx);
  await pdf()(ctx);

  const alreadyNotified = await saveToSheet(chat);
  console.log(`Saved chat ID: ${chat.id} (${chat.type})`);

  if (chat.id !== ADMIN_ID && !alreadyNotified) {
    const name = user?.first_name || 'Unknown';
    const username = user?.username ? `@${user.username}` : 'N/A';
    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `*New user started the bot!*\n\n*Name:* ${name}\n*Username:* ${username}\n*Chat ID:* ${chat.id}\n*Type:* ${chat.type}`,
      { parse_mode: 'Markdown' }
    );
  }
});

// --- Text Handler ---
bot.on('text', async (ctx: MyContext) => {
  if (!ctx.chat || !isPrivateChat(ctx.chat.type)) return;

  const text = ctx.message.text?.toLowerCase();
  if (['help', 'study', 'material', 'pdf', 'pdfs'].includes(text)) {
    await help()(ctx);
  } else if (text?.startsWith('/yakeen_')) {
    await yakeen()(ctx);
  } else if (ctx.from?.id === ADMIN_ID && ctx.session?.awaitingKeys) {
    const { batch, subject, chapter } = ctx.session.awaitingKeys;
    const keyPairs = text?.split(',').map((pair: string) => {
      const [key, id] = pair.split(':').map((s: string) => s.trim());
      return { key, id };
    });

    const invalidPairs = keyPairs.filter((pair: { key: string; id: string }) => !pair.key || isNaN(parseInt(pair.id)));
    if (invalidPairs.length > 0) {
      await ctx.reply('Invalid format. Please use: key1:id1,key2:id2,...');
      return;
    }

    try {
      const keysRef = ref(db, `batches/${batch}/${subject}/${chapter}/keys`);
      const currentKeys = await getKeys(batch, subject, chapter);
      const updatedKeys = { ...currentKeys };

      for (const { key, id } of keyPairs) {
        updatedKeys[key] = id;
      }

      await set(keysRef, updatedKeys);
      await ctx.reply(`Successfully added/updated ${keyPairs.length} keys for ${chapter.replace(/_/g, ' ')} in ${subject}.`);
    } catch (err) {
      console.error('Error saving keys to Firebase:', err);
      await ctx.reply('Error saving keys. Please try again or contact @itzfew.');
    }

    delete ctx.session.awaitingKeys;
  } else {
    await greeting()(ctx);
    await pdf()(ctx);
  }
});

// --- New Member Welcome (Group) ---
bot.on('new_chat_members', async (ctx: MyContext) => {
  for (const member of ctx.message.new_chat_members) {
    if (member.username === ctx.botInfo.username) {
      await ctx.reply('Thanks for adding me! Type /help to get started.');
    }
  }
});

// --- Message Tracker for Private Chats ---
bot.on('message', async (ctx: MyContext) => {
  const chat = ctx.chat;
  if (!chat?.id || !isPrivateChat(chat.type)) return;

  const alreadyNotified = await saveToSheet(chat);
  console.log(`Saved chat ID: ${chat.id} (${chat.type})`);

  if (chat.id !== ADMIN_ID && !alreadyNotified) {
    const user = ctx.from;
    const name = user?.first_name || 'Unknown';
    const username = user?.username ? `@${user.username}` : 'N/A';
    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `*New user interacted!*\n\n*Name:* ${name}\n*Username:* ${username}\n*Chat ID:* ${chat.id}\n*Type:* ${chat.type}`,
      { parse_mode: 'Markdown' }
    );
  }
});

// --- Vercel Export ---
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};

if (ENVIRONMENT !== 'production') {
  development(bot);
}
