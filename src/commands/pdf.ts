import { Context, Markup } from 'telegraf';
import fs from 'fs/promises';
import path from 'path';
import createDebug from 'debug';

const debug = createDebug('bot:help_command');

const ITEMS_PER_PAGE = 5;

const loadData = async () => {
  const filePath = path.resolve(__dirname, '../../pdf.json');
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
};

const buildMessage = (data: any[], page: number) => {
  const start = page * ITEMS_PER_PAGE;
  const items = data.slice(start, start + ITEMS_PER_PAGE);
  const lines = items.map(item => `➥ [${item.title}](${item.link})`);
  return `*♡ TEAM EDUHUB-KMR CHECKLIST ॐ*\n────────┉┈◈◉◈┈┉───────\n` +
         lines.join('\n') +
         `\n────────┉┈◈◉◈┈┉───────`;
};

const help = () => async (ctx: Context) => {
  const data = await loadData();
  const page = 0;
  const message = buildMessage(data, page);

  debug(`Sending help page ${page}`);

  await ctx.replyWithMarkdownV2(message, Markup.inlineKeyboard([
    Markup.button.callback('Next ▶️', `help_page_${page + 1}`)
  ]));
};

const helpPagination = async (ctx: Context) => {
  const data = await loadData();
  const callbackData = ctx.callbackQuery?.data;
  const match = callbackData?.match(/help_page_(\d+)/);
  if (!match) return;

  const page = parseInt(match[1]);
  const maxPage = Math.floor(data.length / ITEMS_PER_PAGE);
  const message = buildMessage(data, page);

  const buttons = [];
  if (page > 0) buttons.push(Markup.button.callback('◀️ Previous', `help_page_${page - 1}`));
  if (page < maxPage) buttons.push(Markup.button.callback('Next ▶️', `help_page_${page + 1}`));

  await ctx.editMessageText(message, {
    parse_mode: 'MarkdownV2',
    reply_markup: Markup.inlineKeyboard(buttons)
  });
};

export { help, helpPagination };
