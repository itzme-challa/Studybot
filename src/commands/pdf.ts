import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:pdf_handler');

const messageMap: Record<string, number> = {
  neetpyq1: 2,
};

const fileStorageChatId = -1002589507108;

const pdf = () => async (ctx: Context) => {
  try {
    const text = ctx.message?.text?.trim().toLowerCase();
    if (!text || !messageMap[text]) return;

    debug(`Forwarding message ID ${messageMap[text]} from ${fileStorageChatId}`);
    
    await ctx.telegram.forwardMessage(
      ctx.chat!.id,
      fileStorageChatId,
      messageMap[text]
    );
  } catch (err) {
    console.error('PDF command handler error:', err);
    await ctx.reply('An error occurred while fetching your file. Please try again later.');
  }
};

export { pdf };
