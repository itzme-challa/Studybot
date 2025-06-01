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

const fileStorageChatId = -1002277073649;

interface ResourcePath {
  batch: string;
  subject: string;
  chapter?: string;
  resourceType: string;
  resourceKey: string;
}

interface MaterialItem {
  path: string;
  messageId: number;
}

let accessToken: string | null = null;

async function createTelegraphAccount() {
  try {
    const res = await fetch('https://api.telegra.ph/createAccount', {
      method: 'POST',
      body: new URLSearchParams({ 
        short_name: 'studybot', 
        author_name: 'Study Bot' 
      }),
    });
    const data = await res.json();
    if (data.ok) {
      accessToken = data.result.access_token;
      debug('Created new Telegraph account');
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error creating Telegraph account:', error);
    throw error;
  }
}

async function createTelegraphPage(query: string, matches: MaterialItem[]): Promise<string> {
  if (!accessToken) {
    await createTelegraphAccount();
  }

  // Prepare Telegraph page content
  const content = [
    {
      tag: 'h3',
      children: [`Search results for: ${query}`]
    },
    {
      tag: 'p',
      children: ['Found these matching resources:']
    },
    {
      tag: 'ul',
      children: matches.map(match => ({
        tag: 'li',
        children: [
          {
            tag: 'a',
            attrs: {
              href: `https://t.me/NeetJeestudy_bot?start=${match.path.replace(/\//g, '_')}`
            },
            children: [match.path.split('/').pop() || match.path]
          }
        ]
      }))
    },
    {
      tag: 'p',
      children: ['Click on any link to get the resource directly in Telegram']
    }
  ];

  try {
    const res = await fetch('https://api.telegra.ph/createPage', {
      method: 'POST',
      body: new URLSearchParams({
        access_token: accessToken!,
        title: `Study Material: ${query.slice(0, 50)}`,
        author_name: 'Study Bot',
        content: JSON.stringify(content),
        return_content: 'true',
      }),
    });
    const data = await res.json();
    if (data.ok) {
      return `https://telegra.ph/${data.result.path}`;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error creating Telegraph page:', error);
    throw error;
  }
}

async function findSimilarResources(path: ResourcePath): Promise<MaterialItem[]> {
  try {
    let searchPath: string;
    
    if (path.chapter) {
      searchPath = `batches/${path.batch}/${path.subject}/${path.chapter}/keys`;
    } else {
      searchPath = `batches/${path.batch}/${path.subject}/all_contents/keys`;
    }

    debug(`Searching for similar resources at: ${searchPath}`);
    const snapshot = await get(child(dbRef, searchPath));
    
    if (!snapshot.exists()) {
      return [];
    }

    const resources = snapshot.val();
    return Object.entries(resources).map(([key, messageId]) => ({
      path: `${searchPath}/${key}`.replace(/\//g, '_'),
      messageId: messageId as number
    }));
  } catch (error) {
    console.error('Error searching resources:', error);
    return [];
  }
}

const parseCommand = (text: string): ResourcePath | null => {
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

const handlePdfCommand = async (ctx: Context, path: ResourcePath, originalQuery: string) => {
  try {
    const messageId = await getMessageId(path);
    
    if (messageId) {
      await ctx.reply('Here is your file. Save or forward it to keep it — this message will not be stored permanently.');
      await ctx.telegram.copyMessage(
        ctx.chat!.id,
        fileStorageChatId,
        messageId
      );
      return;
    }

    // If exact match not found, look for similar resources
    const similarResources = await findSimilarResources(path);
    
    if (similarResources.length > 0) {
      const telegraphUrl = await createTelegraphPage(originalQuery, similarResources);
      await ctx.reply(`The exact resource wasn't found, but we found these similar ones:\n\n${telegraphUrl}`);
    } else {
      await ctx.reply('No matching resources found. Please check your query and try again.');
    }
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
          await handlePdfCommand(ctx, resourcePath, commandParts[1]);
        } else {
          await ctx.reply('Invalid command format. Please use the correct format.');
        }
        return;
      }
    }

    // Handle plain text commands
    const resourcePath = parseCommand(message.text);
    if (resourcePath) {
      await handlePdfCommand(ctx, resourcePath, message.text);
    } else {
      await ctx.reply('Invalid command format. Please use: batch_subject_chapter_resource');
    }
  } catch (err) {
    console.error('PDF command handler error:', err);
    await ctx.reply('An error occurred while processing your request. Please contact support.');
  }
};

export { pdf };
