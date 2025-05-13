import { Context } from 'telegraf';

const ADMIN_ID = 6930703214;

export const contact = () => {
  return async (ctx: Context) => {
    if (!ctx.chat) {
      return ctx.reply('Error: Unable to fetch chat details.');
    }
    await ctx.reply('You can now send your message (text, photo, or media). I will forward it to the admin.');
  };
};

export const handleUserMessages = async (ctx: Context) => {
  if (!ctx.chat || !ctx.from) return;

  const message = ctx.message;

  // Forward to admin if not from admin
  if (ctx.from.id !== ADMIN_ID) {
    const name = ctx.from.first_name;
    const username = ctx.from.username ?? 'N/A';

    if ('text' in message) {
      const content = message.text;
      await ctx.telegram.sendMessage(
        ADMIN_ID,
        `*User Message from ${name} (@${username})*:\n${content}`,
        { parse_mode: 'Markdown' }
      );

      if (content.toLowerCase().includes('contact')) {
        await ctx.telegram.sendMessage(
          ADMIN_ID,
          `*Urgent Contact from ${name} (@${username})*:\n${content}`,
          { parse_mode: 'Markdown' }
        );
      }
    } else {
      // For non-text messages
      await ctx.telegram.forwardMessage(ADMIN_ID, ctx.chat.id, message.message_id);
    }
  }
};
