import { Context } from 'telegraf';
import createDebug from 'debug';
import axios from 'axios';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

const debug = createDebug('bot:pdf_handler');

// Ensure this chat ID is correct and bot has access
const fileStorageChatId = -1002481747949;

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
          if (row.keyword && row.messageId) {
            const keyword = row.keyword.toLowerCase();
            const messageId = parseInt(row.messageId, 10);
            if (!isNaN(messageId)) {
              messageMap[keyword] = messageId;
            }
          }
        })
        .on('end', () => {
          debug('CSV parsed successfully');
          resolve(messageMap);
        })
        .on('error', (error) => {
          debug('CSV parsing error:', error);
          reject(error);
        });
    });
  } catch (error) {
    debug('Failed to fetch or parse CSV:', error);
    throw new Error('Could not retrieve file list. Please try again later.');
  }
};

// --- Handle PDF command ---
const handlePdfCommand = async (ctx: Context, keyword: string, messageMap: Record<string, number>) => {
  const messageId = messageMap[keyword];
  if (!messageId) {
    await ctx.reply('Invalid keyword. Please check and try again.');
    return;
  }

  try {
    debug(`Sending PDF for keyword: ${keyword} (messageId: ${messageId})`);

    await ctx.reply('Here is your file. Save or forward it — this message will not be stored permanently.');

    await ctx.telegram.copyMessage(
      ctx.chat!.id,
      fileStorageChatId,
      messageId
    );
  } catch (err) {
    debug('Telegram copyMessage error:', err);
    await ctx.reply('Unable to fetch the file. Make sure the keyword is correct or try again later.');
  }
};

// --- Main PDF handler ---
const pdf = () => async (ctx: Context) => {
  try {
    const messageMap = await fetchMessageMap();
    const message = ctx.message;

    if (message && 'text' in message) {
      const text = message.text.trim();

      // /start with deep link: /start keyword
      if (text.startsWith('/start')) {
        const parts = text.split(' ');
        if (parts.length > 1) {
          const keyword = parts[1].toLowerCase();
          return await handlePdfCommand(ctx, keyword, messageMap);
        } else {
          return await ctx.reply('Send a valid command or keyword to fetch a file.');
        }
      }

      // Text command like "neetpyq1"
      const keyword = text.toLowerCase();
      return await handlePdfCommand(ctx, keyword, messageMap);
    }
  } catch (err) {
    debug('PDF command handler error:', err);
    await ctx.reply('An error occurred while fetching your file. Please contact @NeetAspirantsBot for help.');
  }
};

export { pdf };
