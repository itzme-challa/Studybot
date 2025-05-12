import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:pdf_handler');

// Map command keywords to message IDs
const messageMap: Record<string, number> = {
  neetpyq1: 2,
  jeepyq2: 3,
  // add more as needed
};

const fileStorageChatId = -1002589507108;

const pdf = () => async (ctx: Context) => {
  try {
    const message = ctx.message;
    if (!message || !('text' in message)) return;

    const text = message.text.trim().toLowerCase();

    if (messageMap[text]) {
      debug(`Copying stored message for command: ${text}`);

      // Inform user about auto-delete
      await ctx.reply('This file will disappear in 5 minutes. Save or forward it to keep it.');

      // Send the file without forwarding label
      const sent = await ctx.telegram.copyMessage(
        ctx.chat!.id,
        fileStorageChatId,
        messageMap[text]
      );

      // Delete after 5 minutes
      setTimeout(() => {
        ctx.telegram.deleteMessage(ctx.chat!.id, sent.message_id).catch((err) => {
          console.warn('Failed to delete message:', err);
        });
      }, 5 * 60 * 1000); // 5 minutes
    }
  } catch (err) {
    console.error('PDF command handler error:', err);
    await ctx.reply('An error occurred while fetching your file. Please try again later.');
  }
};

export { pdf };
