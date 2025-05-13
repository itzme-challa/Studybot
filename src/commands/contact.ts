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
  if (!ctx.chat || !ctx.from || !ctx.message) return; // <- FIX: check for ctx.message

  const message = ctx.message;

  if (ctx.from.id !== ADMIN_ID) {
    const name = ctx.from.first_name;
    const username = ctx.from.username ?? 'N/A';

    if ('text' in message && message.text) {
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
      // Forward non-text message
      await ctx.telegram.forwardMessage(ADMIN_ID, ctx.chat.id, message.message_id);
    }
  }
};
