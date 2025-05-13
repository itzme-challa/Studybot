// commands/contact.ts

import { Context } from 'telegraf';

const ADMIN_ID = 6930703214;

// /contact command: forwards message with #help highlight to admin
export const contact = () => async (ctx: Context) => {
  const user = ctx.from!;
  const chatId = ctx.chat!.id;
  const name = user.first_name || 'Unknown';
  const username = user.username ? `@${user.username}` : 'N/A';
  const profileLink = username !== 'N/A' ? `https://t.me/${user.username}` : 'No link';

  const text = ctx.message?.text?.trim() || '';
  const message = text.replace(/^\/contact\s*/, '').trim();

  if (!message) {
    await ctx.reply('✏️ Please type your message after /contact to send it to the admin.');
    return;
  }

  await ctx.telegram.sendMessage(
    ADMIN_ID,
    `*#Help Request Received!*

*Name:* ${name}
*Username:* ${username}
*User ID:* ${user.id}
*Profile:* ${profileLink}

*Message:*
${message}`,
    { parse_mode: 'Markdown' }
  );

  await ctx.reply('✅ Your message has been sent to the admin.');
};

// Forwards all user messages to admin with context
export const handleUserMessages = async (ctx: Context) => {
  if (ctx.from?.id === ADMIN_ID) return;

  const user = ctx.from!;
  const name = user.first_name || 'Unknown';
  const username = user.username ? `@${user.username}` : 'N/A';
  const profileLink = username !== 'N/A' ? `https://t.me/${user.username}` : 'No link';

  const content = ctx.message?.text || ctx.message?.caption || '[Non-text message]';

  await ctx.forwardMessage(ADMIN_ID);
  await ctx.telegram.sendMessage(
    ADMIN_ID,
    `*User Message Details:*

*Name:* ${name}
*Username:* ${username}
*User ID:* ${user.id}
*Profile:* ${profileLink}

*Message:*
${content}`,
    { parse_mode: 'Markdown' }
  );
};

// Admin uses /reply <user_id> <message> or replies with /reply <user_id> to send reply
export const handleAdminReply = async (ctx: Context) => {
  const text = ctx.message?.text || '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    return ctx.reply('Usage: /reply <user_id> <message> or reply to a message with /reply <user_id>');
  }

  const userId = parseInt(args[0]);
  const customMessage = args.slice(1).join(' ').trim();

  let messageToSend = customMessage;

  // If no message is typed, use the replied message text
  if (!messageToSend && ctx.message?.reply_to_message?.text) {
    messageToSend = ctx.message.reply_to_message.text;
  }

  if (!messageToSend) {
    return ctx.reply('❌ No message content found to send.');
  }

  try {
    await ctx.telegram.sendMessage(userId, `*Admin Reply:*

${messageToSend}`, {
      parse_mode: 'Markdown',
    });
    await ctx.reply('✅ Message sent to the user.');
  } catch (err) {
    console.error('Failed to reply to user:', err);
    await ctx.reply('❌ Failed to send message. User may have blocked the bot or ID is invalid.');
  }
};
