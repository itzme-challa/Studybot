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

export const handleReplyCommand = () => async (ctx: Context) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized.');
  if (!ctx.message || !('reply_to_message' in ctx.message) || !ctx.message.reply_to_message) {
    return ctx.reply('Reply to a user message.');
  }

  const replyTo = ctx.message.reply_to_message;
  const text = ctx.message.text?.split(' ');

  const userId = Number(text?.[1]);
  const replyText = text?.slice(2).join(' ') || replyTo.text;

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
  if (!user) return;

  const text = ctx.message?.text?.split(' ').slice(1).join(' ');
  const reply = ctx.message?.reply_to_message;

  try {
    if (text) {
      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `#help\nFrom: ${user.first_name} (@${user.username || 'N/A'})\nID: ${user.id}\nMessage: ${text}`
      );
      await ctx.reply('Your message has been sent to the admin.');
    } else if (reply) {
      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `#help\nFrom: ${user.first_name} (@${user.username || 'N/A'})\nID: ${user.id}\nReplied Message: ${reply.text || '[Non-text message]'}`
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

// Forward all user messages to admin
export const forwardAllMessagesToAdmin = () => async (ctx: Context) => {
  if (ctx.from?.id === ADMIN_ID) return; // Ignore admin messages
  if (!ctx.message) return;

  try {
    const name = ctx.from?.first_name || 'Unknown';
    const username = ctx.from?.username ? `@${ctx.from.username}` : 'N/A';

    await ctx.telegram.forwardMessage(ADMIN_ID, ctx.chat.id, ctx.message.message_id);
    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `From: ${name} (${username})\nUserID: ${ctx.from?.id}`
    );
  } catch (err) {
    console.error('Failed to forward user message:', err);
  }
};
