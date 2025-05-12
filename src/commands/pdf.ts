import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:pdf_handler');

// Map command keywords to message IDs
const messageMap: Record<string, number> = {
  neetpyq1: 2,
  jeepyq2: 3,
  // add more as needed
};

const fileStorageChatId = -1002589507108; // Converted from /c/2131991973 to full chat ID

const pdf = () => async (ctx: Context) => {
  try {
    const message = ctx.message;
    if (!message || !('text' in message)) return;

    const text = message.text.trim().toLowerCase();

    if (messageMap[text]) {
      debug(`Forwarding stored message for command: ${text}`);
      await ctx.telegram.copyMessage(
  ctx.chat!.id,
  fileStorageChatId,
  messageMap[text]
);
    }
  } catch (err) {
    console.error('PDF command handler error:', err);
    await ctx.reply('An error occurred while fetching your file. Please try again later.');
  }
};

export { pdf };
