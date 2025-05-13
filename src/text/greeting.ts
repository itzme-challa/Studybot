import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:greeting_check');

// Define the required channels/groups
const channelId = '@NEETUG_26';
const groupLink = '@neetpw01';

// Middleware to verify user membership
const checkMembership = async (ctx: Context): Promise<boolean> => {
  try {
    const user = ctx.from;
    if (!user) return false;

    const check = async (chatId: string) => {
      try {
        const member = await ctx.telegram.getChatMember(chatId, user.id);
        return !['left', 'kicked'].includes(member.status);
      } catch (err) {
        console.error(`Error checking membership in ${chatId}:`, err);
        return false;
      }
    };

    const inChannel = await check(channelId);
    const inGroup = await check(groupLink);

    if (!inChannel || !inGroup) {
      await ctx.telegram.sendMessage(
        user.id,
        `Hello ${user.first_name},\n\nTo use this bot, please join all the required channels first:\n\n👉 [Join Channel](${channelId})\n👉 [Join Group](${groupLink})\n\nThen send /start again.`,
        {
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        } as any
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error('Membership verification error:', err);
    await ctx.reply('❌ Unable to verify your membership. Please try again later.');
    return false;
  }
};

// Optional: greeting response when matched
const greeting = () => async (ctx: Context) => {
  try {
    debug('Triggered "greeting" handler');
    const message = ctx.message;
    if (!message || !('text' in message)) return;

    const text = message.text.trim().toLowerCase();
    const user = ctx.from;
    if (!user) return;

    const greetings = ['hi', 'hello', 'hey', 'hii', 'heyy', 'hola', 'start', '/start'];
    if (greetings.includes(text)) {
      await ctx.reply(
        `Welcome ${user.first_name}! You have full access.\n\nUse /help to explore available commands and get started with your NEET Preparation!`,
        {
          parse_mode: 'Markdown',
        }
      );
    }
  } catch (err) {
    console.error('Greeting logic error:', err);
  }
};

export { greeting, checkMembership };
