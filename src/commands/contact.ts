import { TelegrafContext } from '../types';
import { ADMIN_ID } from '../config';
import { Context } from 'telegraf';

// Cache for storing pending user replies
const userPending = new Map<number, number>();

// /contact command
export const contact = () => async (ctx: TelegrafContext) => {
  await ctx.reply(
    'Please type your message and I’ll forward it to the admin. You’ll be notified if they reply.'
  );
  userPending.set(ctx.chat.id, Date.now());
};

// Handle user messages
export const handleUserMessages = async (ctx: TelegrafContext) => {
  const chatId = ctx.chat.id;
  if (!userPending.has(chatId)) return;

  const user = ctx.from;
  const name = user?.first_name || 'Unknown';
  const username = user?.username ? `@${user.username}` : 'N/A';

  // Check that message has text or caption
  const text = ctx.message?.text || ctx.message?.caption;
  if (!text) {
    await ctx.reply('Only text or media with captions can be forwarded.');
    return;
  }

  // Forward or resend message
  try {
    const sent = await ctx.forwardMessage(ADMIN_ID);
    await ctx.telegram.sendMessage(
      ADMIN_ID,
      `*Reply to this user:* \n\nName: ${name}\nUsername: ${username}\nChat ID: ${chatId}`,
      {
        parse_mode: 'Markdown',
        reply_to_message_id: sent.message_id,
      }
    );
    await ctx.reply('Your message has been sent to the admin.');
  } catch (err) {
    console.error('Forward failed:', err);
    await ctx.reply('Failed to send message to admin.');
  }

  userPending.delete(chatId);
};

// Admin replying to users
export const handleAdminReply = async (ctx: TelegrafContext) => {
  if (!ctx.message?.reply_to_message) {
    return ctx.reply('Please reply to the user message you want to respond to.');
  }

  const replyText = ctx.message.text;
  if (!replyText) return ctx.reply('You need to type a reply.');

  const originalText = ctx.message.reply_to_message.text || ctx.message.reply_to_message.caption;
  const match = originalText?.match(/Chat ID: (\d+)/);
  const targetChatId = match?.[1];

  if (!targetChatId) {
    return ctx.reply('Could not find the target chat ID.');
  }

  try {
    await ctx.telegram.sendMessage(Number(targetChatId), `Admin replied:\n\n${replyText}`);
    await ctx.reply('Reply sent.');
  } catch (error) {
    console.error('Admin reply failed:', error);
    await ctx.reply('Failed to send reply.');
  }
};
