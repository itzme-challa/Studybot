import { Context } from 'telegraf';
import { InlineKeyboard } from 'telegraf/typings/telegram-types';
import data from './pdf.json';
import createDebug from 'debug';

const debug = createDebug('bot:help_command');

const ITEMS_PER_PAGE = 4;

const help = () => async (ctx: Context) => {
  await sendPage(ctx, 0);
};

const sendPage = async (ctx: Context, page: number) => {
  const start = page * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const section = data.slice(start, end);

  let message = `*♡ 𝐓𝐄𝐀𝐌 EDUHUB\\-KMR 𝐂𝐇𝐄𝐂𝐊𝐋𝐈𝐒𝐓 ॐ*\n────────┉┈◈◉◈┈┉───────\n`;

  for (const block of section) {
    message += `*ꕥ ${block.title}*\n`;
    for (const item of block.items) {
      message += `➥ [${item.label}](https://t.me/Material_eduhubkmrbot?start=${item.key})\n`;
    }
    message += `────────┉┈◈◉◈┈┉───────\n`;
  }

  const keyboard: InlineKeyboard = { inline_keyboard: [] };
  if (page > 0) keyboard.inline_keyboard.push([{ text: '⬅ Previous', callback_data: `help_page_${page - 1}` }]);
  if (end < data.length) keyboard.inline_keyboard.push([{ text: 'Next ➡', callback_data: `help_page_${page + 1}` }]);

  await ctx.replyWithMarkdownV2(message, { reply_markup: keyboard });
};

const handleHelpPagination = () => async (ctx: Context) => {
  const callbackData = ctx.callbackQuery?.data;
  const match = callbackData?.match(/help_page_(\d+)/);
  if (!match) return;
  const page = parseInt(match[1]);
  await ctx.answerCbQuery();
  await sendPage(ctx, page);
};

export { help, handleHelpPagination };
