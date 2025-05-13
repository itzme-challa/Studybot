import { Context } from 'telegraf';

const ADMIN_ID = 6930703214;

// /contact command
export const contact = () => {
  return async (ctx: Context) => {
    if (!ctx.chat) {
      return ctx.reply('Error: Unable to fetch chat details.');
    }
    await ctx.reply('You can now send your message (text, photo, or media). I will forward it to the admin.');
  };
};

// Handles all user messages (highlighting /contact-related ones)
export const handleUserMessages = async (ctx: Context) => {
  if (!ctx.chat) {
    return; // Avoid further processing if there's no chat
  }

  const userMessage = ctx.message;

  // Forwarding all user messages to admin
  if (ctx.from?.id !== ADMIN_ID) {
    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `*User Message from ${ctx.from?.first_name} (@${ctx.from?.username || 'N/A'})*:\n${userMessage?.text || 'No text provided'}`,
      { parse_mode: 'Markdown' }
    );
  }

  // Highlighting the contact messages
  if (userMessage?.text?.toLowerCase() === 'contact') {
    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `*Urgent Contact from ${ctx.from?.first_name} (@${ctx.from?.username || 'N/A'})*:\n${userMessage?.text || 'No text provided'}`,
      { parse_mode: 'Markdown' }
    );
  }
};
