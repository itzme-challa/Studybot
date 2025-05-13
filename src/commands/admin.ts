import { Context } from 'telegraf';
import { fetchChatIdsFromSheet } from '../utils/chatStore';
import { saveToSheet } from '../utils/saveToSheet';
import { Message } from 'telegraf/typings/core/types/typegram';

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

export const handleReplyCommand = () => async (ctx: Context) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized.');

  const message = ctx.message as Message.TextMessage | undefined;
  const reply = message?.reply_to_message;

  if (!reply || !('text' in reply)) {
    return ctx.reply('Reply to a user message.');
  }

  const parts = message.text.split(' ');
  const userId = Number(parts[1]);
  const replyText = parts.slice(2).join(' ') || reply.text;

  if (!userId || !replyText) return ctx.reply('Usage: /reply <user_id> <message>');

  try {
    await ctx.telegram.sendMessage(userId, replyText);
    await ctx.reply('Message sent.');
  } catch (err) {
    console.error('Error replying to user:', err);
    await ctx.reply('Failed to send message.');
  }
};

export const handleContactCommand = () => async (ctx: Context) => {
  const user = ctx.from;
  const msg = ctx.message;
  if (!user || !msg) return;

  const isTextMessage = 'text' in msg;
  const isReply = 'reply_to_message' in msg;

  const text = isTextMessage ? msg.text?.split(' ').slice(1).join(' ') : undefined;
  const reply = isReply ? msg.reply_to_message : undefined;

  try {
    if (text) {
      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `#help\nFrom: ${user.first_name} (@${user.username || 'N/A'})\nID: ${user.id}\nMessage: ${text}`
      );
      await ctx.reply('Your message has been sent to the admin.');
    } else if (reply && 'text' in reply) {
      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `#help\nFrom: ${user.first_name} (@${user.username || 'N/A'})\nID: ${user.id}\nReplied Message: ${reply.text}`
      );
      await ctx.reply('Your replied message has been sent to the admin.');
    } else {
      await ctx.reply('Usage: /contact <message> or reply with /contact');
    }
  } catch (err) {
    console.error('Error handling contact message:', err);
    await ctx.reply('Failed to contact admin.');
  }
};

export const forwardAllMessagesToAdmin = () => async (ctx: Context) => {
  if (ctx.from?.id === ADMIN_ID || !ctx.message || !ctx.chat) return;

  try {
    const name = ctx.from.first_name || 'Unknown';
    const username = ctx.from.username ? `@${ctx.from.username}` : 'N/A';

    await ctx.telegram.forwardMessage(ADMIN_ID, ctx.chat.id, ctx.message.message_id);
    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `From: ${name} (${username})\nUserID: ${ctx.from.id}`
    );
  } catch (err) {
    console.error('Failed to forward user message:', err);
  }
};
