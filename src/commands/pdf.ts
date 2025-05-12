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

  await ctx.reply('Here is your file. Save or forward it to keep it — this message will not be stored permanently.');

  await ctx.telegram.copyMessage(
    ctx.chat!.id,
    fileStorageChatId,
    messageMap[keyword]
  );
};

const pdf = () => async (ctx: Context) => {
  try {
    const message = ctx.message;

    // Handle /start with deep link
    if (message && 'text' in message && message.text.startsWith('/start')) {
      const parts = message.text.trim().split(' ');
      if (parts.length > 1) {
        const keyword = parts[1].toLowerCase();
        await handlePdfCommand(ctx, keyword);
        return;
      }
    }

    // Handle plain text commands like "neetpyq1"
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
