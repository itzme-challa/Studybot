import { Context } from 'telegraf';
import { fetchChatIdsFromSheet } from '../utils/chatStore';
import { saveToSheet } from '../utils/saveToSheet';

const ADMIN_ID = 6930703214;

// Forward all user messages to admin
export const forwardUserMessages = async (ctx: Context) => {
  if (!ctx.message || ctx.from?.id === ADMIN_ID) return;
  
  const user = ctx.from;
  const chat = ctx.chat;
  const message = ctx.message;

  // Save user info to sheet
  await saveToSheet(chat);

  // Prepare user info
  const name = user?.first_name || 'Unknown';
  const username = user?.username ? `@${user.username}` : 'N/A';
  
  try {
    // Forward the original message
    await ctx.forwardMessage(ADMIN_ID);
    
    // Send additional user info
    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `ℹ️ *User Info*\n\n*Name:* ${name}\n*Username:* ${username}\n*Chat ID:* ${chat?.id}\n*Type:* ${chat?.type}`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('Error forwarding message:', err);
  }
};

// Handle /contact command from users
export const handleUserContactCommand = async (ctx: Context) => {
  if (!ctx.message || ctx.from?.id === ADMIN_ID) return;

  const user = ctx.from;
  const chat = ctx.chat;
  const message = ctx.message;
  const contactText = 'text' in message ? message.text.replace('/contact', '').trim() : '';

  try {
    // Forward the original message to admin with #help tag
    await ctx.forwardMessage(ADMIN_ID);
    
    // Send additional info to admin
    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `#help\n📩 *New Contact Request*\n\n` +
      `*From:* ${user?.first_name || 'Unknown'} (${user?.username ? `@${user.username}` : 'N/A'})\n` +
      `*Chat ID:* ${chat?.id}\n` +
      `*Message:* ${contactText || 'No message provided'}`,
      { parse_mode: 'Markdown' }
    );

    // Confirm to user
    await ctx.reply('Your message has been forwarded to support. We will get back to you soon!');
  } catch (err) {
    console.error('Error handling contact command:', err);
    await ctx.reply('Failed to send your message. Please try again later.');
  }
};

// Original admin commands (updated)
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

// Enhanced reply command for admin
export const handleReplyCommand = () => async (ctx: Context) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized.');

  // Check if message exists and has text
  if (!ctx.message || !('text' in ctx.message)) return ctx.reply('Invalid command format.');

  const messageText = ctx.message.text;
  
  // Case 1: Reply to a message (with /reply in reply)
  if ('reply_to_message' in ctx.message && ctx.message.reply_to_message) {
    const replyTo = ctx.message.reply_to_message;
    
    if (!('from' in replyTo) return ctx.reply('Cannot reply to this type of message.');
    if (!replyTo.from) return ctx.reply('Cannot determine message sender.');

    const replyText = messageText.replace('/reply', '').trim();
    if (!replyText) return ctx.reply('Please provide a reply message.');

    try {
      await ctx.telegram.sendMessage(replyTo.from.id, replyText);
      await ctx.reply('✅ Message sent to user.');
    } catch (err) {
      console.error('Error sending reply:', err);
      await ctx.reply('Failed to send message. User may have blocked the bot.');
    }
    return;
  }

  // Case 2: Manual reply with user ID (/reply <userid> <message>)
  const parts = messageText.split(' ');
  if (parts.length < 3) return ctx.reply('Usage: /reply <userid> <message>');

  const userId = Number(parts[1]);
  const replyText = parts.slice(2).join(' ');

  if (!userId || !replyText) return ctx.reply('Usage: /reply <userid> <message>');

  try {
    await ctx.telegram.sendMessage(userId, replyText);
    await ctx.reply(`✅ Message sent to user ${userId}`);
  } catch (err) {
    console.error('Error sending message:', err);
    await ctx.reply('Failed to send message. User may have blocked the bot or ID is invalid.');
  }
};

// Enhanced contact command for admin
export const handleContactCommand = () => async (ctx: Context) => {
  if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized.');

  // Check if message exists and has text
  if (!ctx.message || !('text' in ctx.message)) return ctx.reply('Invalid command format.');

  // Case 1: Reply to a message (with /contact in reply)
  if ('reply_to_message' in ctx.message && ctx.message.reply_to_message) {
    const replyTo = ctx.message.reply_to_message;
    
    try {
      await ctx.forwardMessage(replyTo.from?.id || ADMIN_ID);
      await ctx.reply('✅ Message forwarded to user.');
    } catch (err) {
      console.error('Error forwarding message:', err);
      await ctx.reply('Failed to forward message. User may have blocked the bot.');
    }
    return;
  }

  // Case 2: Manual contact with user ID (/contact <userid> <message>)
  const parts = ctx.message.text.split(' ');
  if (parts.length < 3) return ctx.reply('Usage: /contact <userid> <message>');

  const userId = Number(parts[1]);
  const message = parts.slice(2).join(' ');

  if (!userId || !message) return ctx.reply('Usage: /contact <userid> <message>');

  try {
    await ctx.telegram.sendMessage(userId, message);
    await ctx.reply(`✅ Message sent to user ${userId}`);
  } catch (err) {
    console.error('Error sending message:', err);
    await ctx.reply('Failed to send message. User may have blocked the bot or ID is invalid.');
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
