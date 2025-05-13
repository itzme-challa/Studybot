import { Context, Telegraf } from 'telegraf';

const ADMIN_ID = 6930703214;

// /contact command
export const contact = () => {
  return async (ctx: Context) => {
    await ctx.reply('You can now send your message (text, photo, or media). I will forward it to the admin.');
  };
};

// Handles all user messages (highlighting /contact-related ones)
export const handleUserMessages = async (ctx: Context) => {
  const user = ctx.from;
  const name = user?.first_name || 'Unknown';
  const username = user?.username ? `@${user.username}` : 'N/A';
  const userId = user?.id;
  const messageId = ctx.message?.message_id;

  const forwardMessage = async () => {
    try {
      await ctx.telegram.forwardMessage(
        ADMIN_ID,
        ctx.chat.id,
        messageId!,
      );

      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `*User Message Received*\n\n*Name:* ${name}\n*Username:* ${username}\n*User ID:* ${userId}`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.error('Failed to forward message:', err);
    }
  };

  await forwardMessage();
};

// Highlights /contact-based messages
export const handleContactMessage = async (ctx: Context) => {
  const user = ctx.from;
  const name = user?.first_name || 'Unknown';
  const username = user?.username ? `@${user.username}` : 'N/A';
  const userId = user?.id;
  const messageId = ctx.message?.message_id;

  try {
    await ctx.telegram.forwardMessage(
      ADMIN_ID,
      ctx.chat.id,
      messageId!
    );

    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `*CONTACT REQUEST*\n\n*Name:* ${name}\n*Username:* ${username}\n*User ID:* ${userId}\n\n*This message was sent via /contact.*`,
      { parse_mode: 'Markdown' }
    );

    await ctx.reply('Your message has been sent to the admin.');
  } catch (err) {
    console.error('Failed to forward contact message:', err);
    await ctx.reply('❌ Failed to send your message to the admin.');
  }
};
