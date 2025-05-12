import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:greeting_text');

const greeting = () => async (ctx: Context) => {
  try {
    debug('Triggered "greeting" text command');

    const message = ctx.message;
    if (!message || !('text' in message)) return;

    const text = message.text.trim().toLowerCase();
    const user = ctx.from;
    if (!user) return;

    const channelId = '@NEETUG_26';
    const groupLink = '@neetpw01';

    // Check if user has joined the required channel
    try {
      const member = await ctx.telegram.getChatMember(channelId, user.id);
      if (['left', 'kicked'].includes(member.status)) {
        await ctx.telegram.sendMessage(
          user.id,
          `Hello ${user.first_name},\n\nTo use this bot, please join all the required channels first:\n\n👉 [Join @NEETUG_26](https://t.me/NEETUG_26)\n👉 [Join Group ${groupLink}](https://t.me/${groupLink.replace('@', '')})\n\nThen send /start again.`,
          {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
          } as any
        );
        return;
      }
    } catch (err) {
      console.error('Error checking channel membership:', err);
      await ctx.reply('Unable to verify your membership. Please try again later.');
      return;
    }

    // If the user has access, respond with welcome message on /start or greetings
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
    console.error('Greeting handler error:', err);
  }
};

export { greeting };
