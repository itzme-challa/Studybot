import { Context } from 'telegraf';
import { fetchChatIdsFromSheet } from '../utils/chatStore';
import { saveToSheet } from '../utils/saveToSheet';

const ADMIN_ID = 6930703214;

export const handleUsersCommand = () => async (ctx: Context) => {
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
};

export const handleRefreshUsersCallback = () => async (ctx: Context) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.answerCbQuery('Unauthorized');

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
};

export const notifyNewUser = async (ctx: Context, type: 'start' | 'interacted') => {
  const user = ctx.from;
  const chat = ctx.chat;
  if (!chat || chat.id === ADMIN_ID) return;

  const alreadyNotified = await saveToSheet(chat);
  if (alreadyNotified) return;

  const name = user?.first_name || 'Unknown';
  const username = user?.username ? `@${user.username}` : 'N/A';
  const header = type === 'start' ? '*New user started the bot!*' : '*New user interacted!*';

  await ctx.telegram.sendMessage(
    ADMIN_ID,
    `${header}\n\n*Name:* ${name}\n*Username:* ${username}\n*Chat ID:* ${chat.id}\n*Type:* ${chat.type}`,
    { parse_mode: 'Markdown' }
  );
};

// Optional: Admin-only /reply and /contact commands (basic version)
export const handleReplyCommand = () => async (ctx: Context) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized.');
  const replyTo = ctx.message?.reply_to_message;
  if (!replyTo || !replyTo.from?.id) return ctx.reply('Reply to a user message.');

  await ctx.telegram.sendMessage(replyTo.from.id, ctx.message.text?.split(' ').slice(1).join(' ') || '');
};

export const handleContactCommand = () => async (ctx: Context) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized.');
  const parts = ctx.message.text?.split(' ');
  const chatId = Number(parts?.[1]);
  const msg = parts?.slice(2).join(' ');

  if (!chatId || !msg) return ctx.reply('Usage: /contact <chat_id> <message>');

  try {
    await ctx.telegram.sendMessage(chatId, msg);
    ctx.reply('Message sent.');
  } catch {
    ctx.reply('Failed to send message.');
  }
};
