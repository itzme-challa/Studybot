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

const handlePdfCommand = async (ctx: Context, keyword: string) => {
  if (!messageMap[keyword]) return;

  debug(`Handling PDF command for: ${keyword}`);

  await ctx.reply('This file will disappear in 5 minutes. Save or forward it to keep it.');

  const sent = await ctx.telegram.copyMessage(
    ctx.chat!.id,
    fileStorageChatId,
    messageMap[keyword]
  );

  // Schedule deletion after 5 minutes
  setTimeout(() => {
    ctx.telegram.deleteMessage(ctx.chat!.id, sent.message_id).catch((err) => {
      console.warn('Failed to delete message:', err);
    });
  }, 5 * 60 * 1000); // 5 minutes
};

const pdf = () => async (ctx: Context) => {
  try {
    const message = ctx.message;

    // Support deep-link like /start neetpyq1
    if (message && 'text' in message && message.text.startsWith('/start')) {
      const parts = message.text.trim().split(' ');
      if (parts.length > 1) {
        const keyword = parts[1].toLowerCase();
        await handlePdfCommand(ctx, keyword);
        return;
      }
    }

    // Support plain text like "neetpyq1"
    if (message && 'text' in message) {
      const keyword = message.text.trim().toLowerCase();
      await handlePdfCommand(ctx, keyword);
    }
  } catch (err) {
    console.error('PDF command handler error:', err);
    await ctx.reply('An error occurred while fetching your file. Please try again later.');
  }
};

export { pdf };
