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

const handlePdfCommand = async (ctx: Context, keyword: string) => {
  try {
    debug(`Fetching message ID for keyword: ${keyword}`);
    
    // Get the message ID from Firebase
    const snapshot = await get(child(dbRef, `pdf_mappings/${keyword}`));
    
    if (!snapshot.exists()) {
      debug(`No message ID found for keyword: ${keyword}`);
      return;
    }

    const messageId = snapshot.val();
    debug(`Found message ID ${messageId} for keyword: ${keyword}`);

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

    // Handle /start with deep link
    if (message && 'text' in message && message.text.startsWith('/start')) {
      const parts = message.text.trim().split(' ');
      if (parts.length > 1) {
        const keyword = parts[1].toLowerCase();
        await handlePdfCommand(ctx, keyword);
        return;
      }
    }

    // Handle plain text commands
    if (message && 'text' in message) {
      const keyword = message.text.trim().toLowerCase();
      await handlePdfCommand(ctx, keyword);
    }
  } catch (err) {
    console.error('PDF command handler error:', err);
    await ctx.reply('An error occurred while processing your request. Please contact @NeetAspirantsBot for assistance.');
  }
};

export { pdf };
