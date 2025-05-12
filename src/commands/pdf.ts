import { Context, Markup } from 'telegraf';
import fs from 'fs/promises';
import path from 'path';
import createDebug from 'debug';

const debug = createDebug('bot:pdf_command');

const ITEMS_PER_PAGE = 5;

// Load JSON data from pdf.json
const loadData = async () => {
  const filePath = path.resolve(__dirname, '../../pdf.json');
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
};

// Build message text for a given page
const buildMessage = (data: any[], page: number) => {
  const start = page * ITEMS_PER_PAGE;
  const items = data.slice(start, start + ITEMS_PER_PAGE);
  const lines = items.map(item => `➥ [${item.title}](${item.link})`);
  return `*♡ TEAM EDUHUB-KMR CHECKLIST ॐ*\n────────┉┈◈◉◈┈┉───────\n` +
         lines.join('\n') +
         `\n────────┉┈◈◉◈┈┉───────`;
};

// Command to trigger the first page
const pdf = () => async (ctx: Context) => {
  const data = await loadData();
  const page = 0;
  const message = buildMessage(data, page);

  debug(`Sending PDF list page ${page}`);

  await ctx.replyWithMarkdownV2(message, Markup.inlineKeyboard([
    Markup.button.callback('Next ▶️', `pdf_page_${page + 1}`)
  ]));
};

// Handle pagination via inline buttons
const pdfPagination = async (ctx: Context) => {
  const data = await loadData();
  const callbackData = ctx.callbackQuery?.data;
  const match = callbackData?.match(/pdf_page_(\d+)/);
  if (!match) return;

  const page = parseInt(match[1]);
  const maxPage = Math.floor(data.length / ITEMS_PER_PAGE);
  const message = buildMessage(data, page);

  const buttons = [];
  if (page > 0) buttons.push(Markup.button.callback('◀️ Previous', `pdf_page_${page - 1}`));
  if (page < maxPage) buttons.push(Markup.button.callback('Next ▶️', `pdf_page_${page + 1}`));

  await ctx.editMessageText(message, {
    parse_mode: 'MarkdownV2',
    reply_markup: Markup.inlineKeyboard(buttons)
  });
};

export { pdf, pdfPagination };
