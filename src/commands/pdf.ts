import { Context } from 'telegraf';
import createDebug from 'debug';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, child, get } from 'firebase/database';

const debug = createDebug('bot:pdf_handler');

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDNME0C__0yE84_fmabt9_qhnv7l4Y2osg",
  authDomain: "telegrambot-d9bde.firebaseapp.com",
  databaseURL: "https://telegrambot-d9bde-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "telegrambot-d9bde",
  storageBucket: "telegrambot-d9bde.firebasestorage.app",
  messagingSenderId: "1016643360568",
  appId: "1:1016643360568:web:a495de89c5f7f983e6d3cd",
  measurementId: "G-ZQLEPBPWZV"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const dbRef = ref(database);

const fileStorageChatId = -1002481747949;

interface ResourcePath {
  batch: string;
  subject: string;
  chapter?: string;
  resourceType: string;
  resourceKey: string;
}

const parseCommand = (text: string): ResourcePath | null => {
  // Example command format: "/start 2026_botany_biodiversity_and_conservation_pyqs_neet"
  const parts = text.trim().split('_');
  
  if (parts.length < 3) return null;

  return {
    batch: parts[0],
    subject: parts[1],
    chapter: parts.length > 3 ? parts[2] : undefined,
    resourceType: parts.length > 3 ? parts[3] : parts[2],
    resourceKey: parts.length > 3 ? parts.slice(3).join('_') : parts.slice(2).join('_')
  };
};

const getMessageId = async (path: ResourcePath): Promise<number | null> => {
  try {
    let dbPath: string;
    
    if (path.chapter) {
      dbPath = `batches/${path.batch}/${path.subject}/${path.chapter}/keys/${path.resourceKey}`;
    } else {
      dbPath = `batches/${path.batch}/${path.subject}/all_contents/keys/${path.resourceKey}`;
    }

    debug(`Fetching from Firebase path: ${dbPath}`);
    const snapshot = await get(child(dbRef, dbPath));
    
    if (!snapshot.exists()) {
      debug('No message ID found at path');
      return null;
    }

    return snapshot.val();
  } catch (error) {
    console.error('Error fetching from Firebase:', error);
    return null;
  }
};

const handlePdfCommand = async (ctx: Context, path: ResourcePath) => {
  try {
    const messageId = await getMessageId(path);
    
    if (!messageId) {
      await ctx.reply('The requested resource was not found. Please check the command and try again.');
      return;
    }

    await ctx.reply('Here is your file. Save or forward it to keep it — this message will not be stored permanently.');

    await ctx.telegram.copyMessage(
      ctx.chat!.id,
      fileStorageChatId,
      messageId
    );
  } catch (err) {
    console.error('Error handling PDF command:', err);
    await ctx.reply('An error occurred while fetching your file. Please try again later or contact support.');
  }
};

const pdf = () => async (ctx: Context) => {
  try {
    const message = ctx.message;

    if (!message || !('text' in message)) return;

    // Handle /start with deep link
    if (message.text.startsWith('/start')) {
      const commandParts = message.text.trim().split(' ');
      if (commandParts.length > 1) {
        const resourcePath = parseCommand(commandParts[1]);
        if (resourcePath) {
          await handlePdfCommand(ctx, resourcePath);
        } else {
          await ctx.reply('Invalid command format. Please use the correct format.');
        }
        return;
      }
    }

    // Handle plain text commands
    const resourcePath = parseCommand(message.text);
    if (resourcePath) {
      await handlePdfCommand(ctx, resourcePath);
    } else {
      await ctx.reply('Invalid command format. Please use: batch_subject_chapter_resource');
    }
  } catch (err) {
    console.error('PDF command handler error:', err);
    await ctx.reply('An error occurred while processing your request. Please contact support.');
  }
};

export { pdf };
