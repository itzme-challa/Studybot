// src/commands/admin.ts
import { Telegraf } from 'telegraf';
import { CallbackQuery, CallbackQueryData } from 'telegraf/typings/core/types/typegram';
import { fetchChatIdsFromSheet } from '../utils/chatStore';

const ADMIN_ID = 6930703214;

export const setupAdminCommands = (bot: Telegraf) => {
  // /users command
  bot.command('users', async (ctx) => {
    if (ctx.from?.id !== ADMIN_ID) return ctx.reply('You are not authorized.');

    try {
      const chatIds = await fetchChatIdsFromSheet();
      await ctx.reply(`📊 Total users: ${chatIds.length}`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: 'Refresh', callback_data: 'refresh_users' }]],
        },
      });
    } catch (err) {
      console.error('Error fetching user count:', err);
      await ctx.reply('❌ Unable to fetch user count.');
    }
  });

  // Handle inline callback for /users refresh
  bot.on('callback_query', async (ctx) => {
    const callback = ctx.callbackQuery;

    // Narrow to CallbackQuery.DataCallbackQuery
    if ('data' in callback && callback.data === 'refresh_users' && ctx.from?.id === ADMIN_ID) {
      try {
        const chatIds = await fetchChatIdsFromSheet();
        await ctx.editMessageText(`📊 Total users: ${chatIds.length}`, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: 'Refresh', callback_data: 'refresh_users' }]],
          },
        });
      } catch (err) {
        console.error('Error refreshing users:', err);
        await ctx.answerCbQuery('Failed to refresh.');
      }
    }
  });
};
