import { Context } from 'telegraf';

const ADMIN_ID = 6930703214;

export const contact = () => async (ctx: Context) => {
  const user = ctx.from!;
  const chatId = ctx.chat!.id;
  const name = user.first_name || 'Unknown';
  const username = user.username ? `@${user.username}` : 'N/A';
  const profileLink = username !== 'N/A' ? `https://t.me/${user.username}` : 'No link';

  const text = 'text' in ctx.message! ? ctx.message.text : '';
  const message = text.replace(/^\/contact\s*/i, '').trim();

  if (!message) {
    await ctx.reply('✏️ Please type your message after /contact to send it to the admin.');
    return;
  }

  await ctx.telegram.sendMessage(
    ADMIN_ID,
    `*#Help Request Received!*\n\n*Name:* ${name}\n*Username:* ${username}\n*User ID:* ${user.id}\n*Profile:* ${profileLink}\n\n*Message:*\n${message}`,
    { parse_mode: 'Markdown' }
  );

  await ctx.reply('✅ Your message has been sent to the admin.');
};

export const handleUserMessages = async (ctx: Context) => {
  if (ctx.from?.id === ADMIN_ID) return;

  const user = ctx.from!;
  const name = user.first_name || 'Unknown';
  const username = user.username ? `@${user.username}` : 'N/A';
  const profileLink = username !== 'N/A' ? `https://t.me/${user.username}` : 'No link';

  let content = '[Non-text message]';
  if ('text' in ctx.message!) content = ctx.message.text;
  else if ('caption' in ctx.message!) content = ctx.message.caption;

  await ctx.forwardMessage(ADMIN_ID);
  await ctx.telegram.sendMessage(
    ADMIN_ID,
    `*User Message Details:*\n\n*Name:* ${name}\n*Username:* ${username}\n*User ID:* ${user.id}\n*Profile:* ${profileLink}\n\n*Message:*\n${content}`,
    { parse_mode: 'Markdown' }
  );
};

export const handleAdminReply = async (ctx: Context) => {
  if (!ctx.message || ctx.from?.id !== ADMIN_ID) return;

  const text = 'text' in ctx.message ? ctx.message.text : '';
  const args = text.split(' ').slice(1);

  if (args.length < 1) {
    await ctx.reply('Usage: /reply <user_id> <message> or reply to a message with /reply <user_id>');
    return;
  }

  const userId = parseInt(args[0]);
  const customMessage = args.slice(1).join(' ').trim();

  let messageToSend = customMessage;

  if (!messageToSend && 'reply_to_message' in ctx.message && 'text' in ctx.message.reply_to_message!) {
    messageToSend = ctx.message.reply_to_message.text;
  }

  if (!messageToSend) {
    await ctx.reply('❌ No message content found to send.');
    return;
  }

  try {
    await ctx.telegram.sendMessage(userId, `*Admin Reply:*\n\n${messageToSend}`, {
      parse_mode: 'Markdown',
    });
    await ctx.reply('✅ Message sent to the user.');
  } catch (err) {
    console.error('Failed to reply to user:', err);
    await ctx.reply('❌ Failed to send message. User may have blocked the bot or ID is invalid.');
  }
};
