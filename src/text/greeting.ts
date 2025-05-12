import { Context } from 'telegraf';
import createDebug from 'debug';
import { Markup } from 'telegraf';

const debug = createDebug('bot:greeting_text');

const greeting = () => async (ctx: Context) => {
  try {
    debug('Triggered "greeting" text command');

    const message = ctx.message;
    if (!message || !('text' in message)) return;

    const text = message.text.trim().toLowerCase();
    const user = ctx.from;
    if (!user) return;

    const requiredChats = [
      { id: '@NEETUG_26', label: 'Join @NEETUG_26', url: 'https://t.me/NEETUG_26' },
      { id: '@neetpw01', label: 'Join @neetpw01', url: 'https://t.me/neetpw01' },
    ];

    // Check if user is a member of all required chats
    const notJoined = [];
    for (const chat of requiredChats) {
      try {
        const member = await ctx.telegram.getChatMember(chat.id, user.id);
        if (['left', 'kicked'].includes(member.status)) {
          notJoined.push(chat);
        }
      } catch (err) {
        console.error(`Error checking ${chat.id} membership:`, err);
        await ctx.reply('Unable to verify your group/channel membership. Please try again later.');
        return;
      }
    }

    // If not joined all, ask to join and retry
    if (notJoined.length > 0) {
      await ctx.telegram.sendMessage(
        user.id,
        `*Hey ${user.first_name}!* \n\nPlease join *all required channels/groups* to use this bot:`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            ...notJoined.map(chat => [Markup.button.url(`✅ ${chat.label}`, chat.url)]),
            [Markup.button.callback('🔄 Verify Again', 'verify_join')],
          ]),
        }
      );
      return;
    }

    // Skip messages like /p1, br, etc.
    if (/^[pbcq][0-9]+$/i.test(text) || /^[pbcq]r$/i.test(text)) return;

    const greetings = ['hi', 'hello', 'hey', 'hii', 'heyy', 'hola', 'start', '/start'];

    if (greetings.includes(text)) {
      await ctx.reply(`Welcome ${user.first_name}! How can I assist you today?`);
    }

  } catch (err) {
    console.error('Greeting handler error:', err);
  }
};

export { greeting };
