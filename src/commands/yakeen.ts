import { Context, Markup } from 'telegraf';
import createDebug from 'debug';
import { db, ref, onValue, set, DataSnapshot } from '../utils/firebase';

const debug = createDebug('bot:yakeen_handler');
const CHANNEL_ID = process.env.CHANNEL_ID || '-1002277073649';
const ADMIN_ID = 6930703214;

const ITEMS_PER_PAGE = 10;

interface SessionData {
  awaitingKeys?: { batch: string; subject: string; chapter: string };
}

interface MyContext extends Context {
  session: SessionData;
}

// Fetch subjects from Firebase
export const getSubjects = (batch: string): Promise<string[]> => {
  return new Promise((resolve) => {
    const subjectsRef = ref(db, `batches/${batch}`);
    onValue(subjectsRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      resolve(data ? Object.keys(data) : []);
    }, { onlyOnce: true });
  });
};

// Fetch chapters for a subject
export const getChapters = (batch: string, subject: string): Promise<string[]> => {
  return new Promise((resolve) => {
    const chaptersRef = ref(db, `batches/${batch}/${subject}`);
    onValue(chaptersRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      resolve(data ? Object.keys(data) : []);
    }, { onlyOnce: true });
  });
};

// Fetch keys for a chapter
export const getKeys = (batch: string, subject: string, chapter: string): Promise<Record<string, string>> => {
  return new Promise((resolve) => {
    const keysRef = ref(db, `batches/${batch}/${subject}/${chapter}/keys`);
    onValue(keysRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      resolve(data || {});
    }, { onlyOnce: true });
  });
};

// Handle /yakeen command
const handleYakeenCommand = async (ctx: MyContext, keyword: string) => {
  debug(`Handling Yakeen command for: ${keyword}`);
  const batch = '2026';
  const subjects = await getSubjects(batch);

  for (const subject of subjects) {
    const chapters = await getChapters(batch, subject);
    for (const chapter of chapters) {
      const keys = await getKeys(batch, subject, chapter);
      if (keys[keyword]) {
        await ctx.reply('Here is your file. Save or forward it to keep it — this message will not be stored permanently.');
        try {
          await ctx.telegram.copyMessage(
            ctx.chat!.id,
            CHANNEL_ID,
            parseInt(keys[keyword]),
            {} // Add options object to satisfy the 4-argument signature
          );
          return true;
        } catch (err) {
          debug(`Error forwarding message for key ${keyword}: ${err}`);
          await ctx.reply('Message ID not found. Please contact @itzfew for assistance.');
          return true;
        }
      }
    }
  }
  await ctx.reply('Key not found. Please contact @itzfew for assistance.');
  return false;
};

// Main yakeen command handler
export const yakeen = () => async (ctx: MyContext) => {
  try {
    if ('text' in ctx.message) {
      const text = ctx.message.text.trim().toLowerCase();
      if (text.startsWith('/yakeen_')) {
        const keyword = text.replace('/yakeen_', '');
        await handleYakeenCommand(ctx, keyword);
      } else {
        await ctx.reply('Please use /yakeen_<keyword> to request a file.');
      }
    }
  } catch (err) {
    console.error('Yakeen command handler error:', err);
    await ctx.reply('An error occurred while fetching your file. Please contact @itzfew for assistance.');
  }
};

// Handle subject selection for /publish
export const handleYakeenSubject = async (ctx: MyContext, batch: string) => {
  if (ctx.from?.id !== ADMIN_ID) {
    await ctx.answerCbQuery('You are not authorized.');
    return;
  }

  const subjects = await getSubjects(batch);
  if (subjects.length === 0) {
    await ctx.reply('No subjects found in Firebase.');
    return;
  }

  const keyboard = subjects.map(subject => [{
    text: subject.charAt(0).toUpperCase() + subject.slice(1),
    callback_data: `yakeen_chapter_${batch}_${subject}`
  }]);

  await ctx.editMessageText('Select a subject:', {
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
  await ctx.answerCbQuery();
};

// Handle chapter selection with pagination
export const handleYakeenChapter = async (ctx: MyContext, batch: string, subject: string) => {
  if (ctx.from?.id !== ADMIN_ID) {
    await ctx.answerCbQuery('You are not authorized.');
    return;
  }

  const chapters = await getChapters(batch, subject);
  if (chapters.length === 0) {
    await ctx.reply('No chapters found for this subject.');
    return;
  }

  await sendChapterPage(ctx, batch, subject, chapters, 1);
  await ctx.answerCbQuery();
};

// Send chapter page with pagination
const sendChapterPage = async (ctx: MyContext, batch: string, subject: string, chapters: string[], page: number) => {
  const totalPages = Math.ceil(chapters.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const paginatedChapters = chapters.slice(start, end);

  const keyboard = paginatedChapters.map(chapter => [{
    text: chapter.replace(/_/g, ' ').toUpperCase(),
    callback_data: `yakeen_keys_${batch}_${subject}_${chapter}`
  }]);

  const paginationButtons = [];
  if (page > 1) {
    paginationButtons.push({ text: 'Previous', callback_data: `yakeen_page_${batch}_${subject}_${page - 1}` });
  }
  if (page < totalPages) {
    paginationButtons.push({ text: 'Next', callback_data: `yakeen_page_${batch}_${subject}_${page + 1}` });
  }

  if (paginationButtons.length > 0) {
    keyboard.push(paginationButtons);
  }

  await ctx.editMessageText(`Select a chapter for ${subject}:`, {
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
};

// Handle chapter pagination
export const handleYakeenPagination = async (ctx: MyContext, batch: string, subject: string, page: string) => {
  if (ctx.from?.id !== ADMIN_ID) {
    await ctx.answerCbQuery('You are not authorized.');
    return;
  }

  const chapters = await getChapters(batch, subject);
  await sendChapterPage(ctx, batch, subject, chapters, parseInt(page));
  await ctx.answerCbQuery();
};

// Handle key input after chapter selection
export const handleYakeenKeys = async (ctx: MyContext, batch: string, subject: string, chapter: string) => {
  if (ctx.from?.id !== ADMIN_ID) {
    await ctx.answerCbQuery('You are not authorized.');
    return;
  }

  await ctx.editMessageText(
    `Please send the keys for ${chapter.replace(/_/g, ' ')} in ${subject} in the format: key1:id1,key2:id2,...`,
    { reply_markup: { inline_keyboard: [] } }
  );
  await ctx.answerCbQuery();

  // Set up session for key input
  ctx.session = ctx.session || {};
  ctx.session.awaitingKeys = { batch, subject, chapter };
};
