import { Context } from 'telegraf';
import createDebug from 'debug';
import axios from 'axios';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

const debug = createDebug('bot:pdf_handler');

// Replace this with your verified channel ID (see debug instructions below)
let fileStorageChatId = -1002562927518;

// --- Fetch and parse CSV from Google Drive ---
const fetchMessageMap = async (): Promise<Record<string, number>> => {
  try {
    const csvUrl = 'https://drive.google.com/uc?export=download&id=1HGyXq81g2fVFldfpNRirpfsZe8OnSxAX';
    const response = await axios.get(csvUrl, { responseType: 'text' });
    const csvData = response.data;

    const messageMap: Record<string, number> = {};
    const stream = Readable.from(csvData);

    return new Promise((resolve, reject) => {
      stream
        .pipe(
          parse({
            columns: true,
            skip_empty_lines: true,
            trim: true,
          })
        )
        .on('data', (row) => {
          const keyword = row.keyword?.trim().toLowerCase();
          const messageId = parseInt(row.messageId?.trim(), 10);
          if (keyword && !isNaN(messageId)) {
            messageMap[keyword] = messageId;
          }
        })
        .on('end', () => {
          debug('CSV parsed successfully');
          resolve(messageMap);
        })
        .on('error', (error) => {
          console.error('CSV parsing error:', error);
          reject(error);
        });
    });
  } catch (error) {
    console.error('Failed to fetch or parse CSV:', error);
    throw new Error('Could not retrieve file list. Please try again later.');
  }
};

// ...[imports and fetchMessageMap unchanged]

const handlePdfCommand = async (ctx: Context, keyword: string, messageMap: Record<string, number>) => {
  const messageId = messageMap[keyword];
  if (!messageId) {
    // Optional: If you want to silently ignore unknown keywords too, comment this line
    await ctx.reply('❌ Invalid keyword. Please check and try again.');
    return;
  }

  try {
    debug(`Trying to send PDF for keyword: ${keyword} (messageId: ${messageId})`);
    await ctx.reply('📎 Here is your file. Save or forward it — this message will not be stored permanently.');

    await ctx.telegram.copyMessage(ctx.chat!.id, fileStorageChatId, messageId);
  } catch (err: any) {
    console.error('Telegram copyMessage error:', err.response?.data || err.message || err);

    await ctx.reply('⚠️ File not sent via `copyMessage`. Trying fallback method...');

    try {
      await ctx.telegram.forwardMessage(ctx.chat!.id, fileStorageChatId, messageId);
    } catch (fallbackErr: any) {
      console.error('Telegram forwardMessage error:', fallbackErr.response?.data || fallbackErr.message || fallbackErr);
      await ctx.reply('❌ Unable to fetch the file. Make sure the keyword is correct or try again later.');
    }
  }
};

const pdf = () => async (ctx: Context) => {
  try {
    const message = ctx.message;

    const forwardFromChat = (ctx.message as any)?.forward_from_chat;
    if (forwardFromChat) {
      const actualChatId = forwardFromChat.id;
      console.log('📢 Forwarded message came from chat ID:', actualChatId);
      await ctx.reply(`This message is from chat ID: \`${actualChatId}\``, { parse_mode: 'Markdown' });
      return;
    }

    if (!message || !('text' in message)) {
      // 👇 Silently ignore non-text messages
      return;
    }

    const text = message.text.trim();
    const messageMap = await fetchMessageMap();

    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      if (parts.length > 1) {
        const keyword = parts[1].toLowerCase();
        return await handlePdfCommand(ctx, keyword, messageMap);
      } else {
        return await ctx.reply('ℹ️ Send a valid command or keyword to fetch a file.');
      }
    }

    // Direct keyword like "neetpyq1"
    const keyword = text.toLowerCase();
    if (messageMap[keyword]) {
      return await handlePdfCommand(ctx, keyword, messageMap);
    }

    // 👇 Ignore unknown text commands or keywords silently
    return;

  } catch (err: any) {
    console.error('PDF command handler error:', err.response?.data || err.message || err);
    await ctx.reply('❌ An error occurred while fetching your file. Please contact @NeetAspirantsBot for help.');
  }
};

export { pdf };
