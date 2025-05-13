// commands/contact.ts

import { Context } from 'telegraf';

const ADMIN_ID = 6930703214;

// /contact command or /contact message
export const contact = () => async (ctx: Context) => {
  const text = ctx.message?.text?.trim() || '';

  const user = ctx.from!;
  const chatId = ctx.chat!.id;
  const name = user.first_name || 'Unknown';
  const username = user.username ? `@${user.username}` : 'N/A';

  const messageToForward = text.replace(/^\/contact\s*/, '');

  if (messageToForward) {
    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `*New contact message received!*\n\n*Name:* ${name}\n*Username:* ${username}\n*Chat ID:* ${chatId}\n\n*Message:*\n${messageToForward}`,
      { parse_mode: 'Markdown' }
    );
    await ctx.reply('✅ Your message has been sent to the admin.');
  } else {
    await ctx.reply('✏️ Please type your message after /contact to send it to the admin.');
  }
};

// handleUserMessages: forward all messages to admin
export const handleUserMessages = async (ctx: Context) => {
  if (ctx.from?.id === ADMIN_ID) return;

  const user = ctx.from!;
  const name = user.first_name || 'Unknown';
  const username = user.username ? `@${user.username}` : 'N/A';

  const content = ctx.message?.text || ctx.message?.caption || '[Non-text message]';

  await ctx.forwardMessage(ADMIN_ID);
  await ctx.telegram.sendMessage(
    ADMIN_ID,
    `*User Message Details:*\n\n*Name:* ${name}\n*Username:* ${username}\n*Chat ID:* ${ctx.chat!.id}\n*Type:* ${ctx.chat!.type}`,
    { parse_mode: 'Markdown' }
  );
};

// Admin /reply handler
export const handleAdminReply = async (ctx: Context) => {
  const args = ctx.message?.text?.split(' ').slice(1);

  if (!args || args.length < 2) {
    return ctx.reply('Usage: /reply <user_id> <message>');
  }

  const [userId, ...rest] = args;
  const message = rest.join(' ');

  try {
    await ctx.telegram.sendMessage(Number(userId), `*Admin Reply:*\n\n${message}`, {
      parse_mode: 'Markdown',
    });
    await ctx.reply('✅ Message sent to the user.');
  } catch (err) {
    console.error('Failed to reply to user:', err);
    await ctx.reply('❌ Failed to send message. User may have blocked the bot.');
  }
};
