import { Context } from 'telegraf';
import createDebug from 'debug';
import axios from 'axios';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

const debug = createDebug('bot:pdf_handler');

const fileStorageChatId = -1002481747949;

// Function to fetch and parse CSV from Google Drive
const fetchMessageMap = async (): Promise<Record<string, number>> => {
  try {
    const csvUrl = 'https://drive.google.com/uc?export=download&id=1HGyXq81g2fVFldfpNRirpfsZe8OnSxAX';
    const response = await axios.get(csvUrl, { responseType: 'text' });
    const csvData = response.data;

    const messageMap: Record<string, number> = {};

    // Convert CSV string to a readable stream for parsing
    const stream = Readable.from(csvData);

    return new Promise((resolve, reject) => {
      stream
        .pipe(
          parse({
            columns: true, // Treat first row as headers
            skip_empty_lines: true,
            trim: true,
          })
        )
        .on('data', (row) => {
          // Assuming CSV has columns 'keyword' and 'messageId'
          if (row.keyword && row.messageId) {
            messageMap[row.keyword.toLowerCase()] = parseInt(row.messageId, 10);
          }
        })
        .on('end', () => {
          debug('CSV parsed successfully');
          resolve(messageMap);
        })
        .on('error', (error) => {
          debug('Error parsing CSV:', error);
          reject(error);
        });
    });
  } catch (error) {
    debug('Error fetching CSV:', error);
    throw new Error('Failed to fetch or parse CSV file');
  }
};

const handlePdfCommand = async (ctx: Context, keyword: string, messageMap: Record<string, number>) => {
  if (!messageMap[keyword]) {
    await ctx.reply('Invalid keyword. Please check the command and try again.');
    return;
  }

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
    // Fetch the message map from the CSV
    const messageMap = await fetchMessageMap();

    const message = ctx.message;

    // Handle /start with deep link
    if (message && 'text' in message && message.text.startsWith('/start')) {
      const parts = message.text.trim().split(' ');
      if (parts.length > 1) {
        const keyword = parts[1].toLowerCase();
        await handlePdfCommand(ctx, keyword, messageMap);
        return;
      }
    }

    // Handle plain text commands like "neetpyq1"
    if (message && 'text' in message) {
      const keyword = message.text.trim().toLowerCase();
      await handlePdfCommand(ctx, keyword, messageMap);
    }
  } catch (err) {
    console.error('PDF command handler error:', err);
    await ctx.reply('An error occurred while fetching your file. Please contact @NeetAspirantsBot for assistance and try again later.');
  }
};

export { pdf };
