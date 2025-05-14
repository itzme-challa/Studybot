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

  // Forward media from admin with caption: /reply <user_id>
  bot.on('message', async (ctx) => {
  if (ctx.from?.id !== ADMIN_ID || !ctx.message.caption?.startsWith('/reply ')) return;

  const parts = ctx.message.caption.split(' ');
  if (parts.length < 2) return;

  const userId = parseInt(parts[1]);
  if (isNaN(userId)) return;

  try {
    const msg = ctx.message as Message;  // Type assertion

    // Check if the message contains media with a caption
    if ('photo' in msg && msg.photo) {
      await ctx.telegram.sendPhoto(userId, msg.photo[msg.photo.length - 1].file_id, {
        caption: msg.caption?.replace(`/reply ${userId}`, '').trim(),
      });
    } else if ('video' in msg && msg.video) {
      await ctx.telegram.sendVideo(userId, msg.video.file_id, {
        caption: msg.caption?.replace(`/reply ${userId}`, '').trim(),
      });
    } else if ('document' in msg && msg.document) {
      await ctx.telegram.sendDocument(userId, msg.document.file_id, {
        caption: msg.caption?.replace(`/reply ${userId}`, '').trim(),
      });
    } else if ('audio' in msg && msg.audio) {
      await ctx.telegram.sendAudio(userId, msg.audio.file_id, {
        caption: msg.caption?.replace(`/reply ${userId}`, '').trim(),
      });
    } else if ('voice' in msg && msg.voice) {
      await ctx.telegram.sendVoice(userId, msg.voice.file_id);
    } else {
      await ctx.reply('Unsupported media type.');
    }

    await ctx.reply('Media sent.');
  } catch (err) {
    console.error('Failed to forward media reply:', err);
    await ctx.reply('Failed to send media.');
  }
});
};
