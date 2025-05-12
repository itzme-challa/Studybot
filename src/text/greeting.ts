import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:greeting_text');

const greeting = () => async (ctx: Context) => {
  try {
    debug('Triggered "greeting" text command');

    const message = ctx.message;
    if (!message || !('text' in message)) {
      debug('No valid message received.');
      return;
    }

    const text = message.text.trim().toLowerCase();
    const user = ctx.from;
    if (!user) {
      debug('No user information found.');
      return;
    }

    const greetings = ['hi', 'hello', 'hey', 'hii', 'heyy', 'start', '/start'];
    if (greetings.includes(text)) {
      debug(`Greeting detected from user: ${user.first_name}`);
      await ctx.reply(`Hey ${user.first_name}! How can I assist you today?`);
    }
  } catch (err) {
    console.error('Greeting handler error:', err);
    await ctx.reply('Oops! Something went wrong. Please try again later.');
  }
};

export { greeting };
