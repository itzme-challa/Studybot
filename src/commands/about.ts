import { Context } from 'telegraf';
import createDebug from 'debug';
import { author, name, version } from '../../package.json';

const debug = createDebug('bot:about_command');

// Updated about command
const about = () => async (ctx: Context) => {
  try {
    const message =
      `*${escape(name)} ${escape(version)}*\n\n` +
      `*Author:* ${escape(author)}\n\n` +
      `This bot is designed to provide helpful resources and tools for students preparing for *NEET*, *JEE*, and other competitive exams\\.\n\n` +
      `*Features include:*\n` +
      `\\- Access to study materials for *NEET* and *JEE*\n` +
      `\\- Practice tests for *NEET* and *JEE*\n` +
      `\\- Links to study groups for peer interaction\n` +
      `\\- NCERT solutions and other helpful resources\n\n` +
      `You can also try [@EduhubKMR_bot](https://t.me/EduhubKMR_bot) \\– *EduhubKMR QuizBot* – Practice *NEET Biology*, *Physics* & *Chemistry* with answers and explanations\\! And more\\.`;

    debug(`Triggered "about" command with message: \n${message}`);

    // Send the about message
    await ctx.reply(message, { parse_mode: 'MarkdownV2' });
  } catch (error: unknown) {
    // Type assertion to 'Error' type
    if (error instanceof Error) {
      debug(`Error sending about message: ${error.message}`);
      await ctx.reply('Sorry, there was an error processing your request.');
    } else {
      debug('Unknown error occurred in about command');
      await ctx.reply('Sorry, there was an unexpected error.');
    }
  }
};

// Escape special characters for MarkdownV2
function escape(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

export { about };
