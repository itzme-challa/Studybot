import { Telegraf } from 'telegraf';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { about } from './commands/about';
import { help, handleHelpPagination } from './commands/help';
import { pdf } from './commands/pdf';
import { greeting, checkMembership } from './text/greeting';
import { production, development } from './core';
import { isPrivateChat } from './utils/groupSettings';
import {
  handleUsersCommand,
  handleRefreshUsersCallback,
  notifyNewUser,
  handleReplyCommand,
  handleContactCommand,
} from './commands/admin';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';

if (!BOT_TOKEN) throw new Error('BOT_TOKEN not provided!');
console.log(`Running bot in ${ENVIRONMENT} mode`);

const bot = new Telegraf(BOT_TOKEN);

// Middleware: private chat & membership check
bot.use(async (ctx, next) => {
  if (!ctx.chat || !isPrivateChat(ctx.chat.type)) return;
  const isAllowed = await checkMembership(ctx);
  if (isAllowed) await next();
});

// --- Commands ---
bot.command('about', about());

const helpTriggers = ['help', 'study', 'material', 'pdf', 'pdfs'];
bot.command(helpTriggers, help());
bot.hears(/^(help|study|material|pdf|pdfs)$/i, help());

bot.command('users', handleUsersCommand());
bot.command('reply', handleReplyCommand());
bot.command('contact', handleContactCommand());

// --- Callback Handler ---
bot.on('callback_query', async (ctx) => {
  const callbackQuery = ctx.callbackQuery;
  if (!callbackQuery) return ctx.answerCbQuery('Unsupported callback type');
  
  // Type Guard for CallbackQuery
  if ('data' in callbackQuery) {
    const data = callbackQuery.data;
    if (data.startsWith('help_page_')) return handleHelpPagination()(ctx);
    if (data === 'refresh_users') return handleRefreshUsersCallback()(ctx);
  }

  return ctx.answerCbQuery('Unknown action');
});

// --- /start ---
bot.start(async (ctx) => {
  if (!ctx.chat || !isPrivateChat(ctx.chat.type)) return;
  await greeting()(ctx);
  await pdf()(ctx);
  await notifyNewUser(ctx, 'start');
});

// --- Text Handler ---
bot.on('text', async (ctx) => {
  if (!ctx.chat || !isPrivateChat(ctx.chat.type)) return;
  const text = ctx.message?.text?.toLowerCase(); // Optional chaining for text
  if (['help', 'study', 'material', 'pdf', 'pdfs'].includes(text)) {
    return help()(ctx);
  }
  await greeting()(ctx);
  await pdf()(ctx);
});

// --- New Member Welcome ---
bot.on('new_chat_members', async (ctx) => {
  for (const member of ctx.message.new_chat_members) {
    if (member.username === ctx.botInfo.username) {
      await ctx.reply(`Thanks for adding me! Type /help to get started.`);
    }
  }
});

// --- Message Tracker for Private Chats ---
bot.on('message', async (ctx) => {
  if (!ctx.chat || !isPrivateChat(ctx.chat.type)) return;
  await notifyNewUser(ctx, 'interacted');
});

// --- Vercel Export ---
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};

if (ENVIRONMENT !== 'production') {
  development(bot);
}
