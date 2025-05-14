import { Telegraf, Context } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';

const ADMIN_ID = 6930703214;

export const setupContactForwarding = (bot: Telegraf) => {
  // Forward all private messages to admin (excluding admin's own)
  bot.on('message', async (ctx) => {
    const user = ctx.from;
    const chat = ctx.chat;

    if (!chat || chat.id === ADMIN_ID || chat.type !== 'private') return;

    const name = user?.first_name || 'Unknown';
    const username = user?.username ? `@${user.username}` : 'N/A';

    const header = `*User Message*\n\n*Name:* ${name}\n*Username:* ${username}\n*User ID:* ${chat.id}`;

    try {
      // Forward message
      await ctx.telegram.forwardMessage(ADMIN_ID, chat.id, ctx.message.message_id);
      // Send user info
      await ctx.telegram.sendMessage(ADMIN_ID, header, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('Failed to forward message to admin:', err);
    }
  });

// Admin can reply to a user using: /reply <user_id> <message>
  bot.command('reply', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID) return;

  const text = ctx.message?.text;

  if (!text) {
    return ctx.reply('❌ Invalid command. Usage:\n/reply <user_id> <message>');
  }

  const match = text.match(/^\/reply\s+(\d+)\s+([\s\S]+)/);
  if (!match) {
    return ctx.reply('❌ Invalid format. Usage:\n/reply <user_id> <message>');
  }

  const userId = Number(match[1]);
  const replyMessage = match[2].trim();

  if (!replyMessage) {
    return ctx.reply('❌ Message is empty.');
  }

  try {
    const sentMessage = await ctx.telegram.sendMessage(userId, replyMessage, {
      parse_mode: 'Markdown',
    });

    if (sentMessage && sentMessage.message_id) {
      await ctx.reply(`✅ Message delivered to user ID: ${userId}`);
    } else {
      await ctx.reply(`⚠️ Message sent, but no confirmation received.`);
    }
  } catch (err: any) {
    console.error('Failed to send message to user:', err);
    let errorMsg = '❌ Failed to send message.';

    if (err.response && err.response.error_code) {
      // Telegram-specific error formatting
      const code = err.response.error_code;
      const desc = err.response.description;

      if (code === 403 && desc.includes('bot was blocked')) {
        errorMsg += ' The bot was *blocked* by the user.';
      } else if (code === 400 && desc.includes('chat not found')) {
        errorMsg += ' User *has not started the bot* yet.';
      } else {
        errorMsg += `\nTelegram error ${code}: ${desc}`;
      }
    }

    await ctx.reply(errorMsg, { parse_mode: 'Markdown' });
  }
});
};
