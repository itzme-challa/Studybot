import { Telegraf, Context } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';

const ADMIN_ID = 6930703214;

export const setupContactForwarding = (bot: Telegraf<Context>) => {
  // Forward private messages to admin (except from admin)
  bot.on('message', async (ctx) => {
    const user = ctx.from;
    const chat = ctx.chat;

    if (!chat || chat.id === ADMIN_ID || chat.type !== 'private') return;

    const name = user?.first_name || 'Unknown';
    const username = user?.username ? `@${user.username}` : 'N/A';

    const header = `*User Message*\n\n*Name:* ${name}\n*Username:* ${username}\n*User ID:* ${chat.id}`;

    try {
      await ctx.telegram.forwardMessage(ADMIN_ID, chat.id, ctx.message.message_id);
      await ctx.telegram.sendMessage(ADMIN_ID, header, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('Failed to forward message to admin:', err);
    }
  });

  // Handle /reply <user_id> <message> from admin (text only)
  bot.command('reply', async (ctx) => {
    if (ctx.from?.id !== ADMIN_ID) return;

    const parts = ctx.message.text?.split(' ');
    if (!parts || parts.length < 3) {
      return ctx.reply('Usage: /reply <user_id> <message>');
    }

    const userId = parseInt(parts[1]);
    const replyMessage = parts.slice(2).join(' ');

    try {
      await ctx.telegram.sendMessage(userId, replyMessage);
      await ctx.reply('Message sent.');
    } catch (err) {
      console.error('Failed to send reply:', err);
      await ctx.reply('Failed to send message. The user may have blocked the bot.');
    }
  });

};
