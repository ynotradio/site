import * as mysql from 'mysql2/promise';
import { dbConfig } from './config';

// Deejay interface matching the MySQL table structure
export interface Deejay {
  id: number;
  name: string;
  show: string;
  email: string;
  external_connect_text: string;
  external_connect_url: string;
  pic: string;
  sort: number;
  deleted: string;
}

// Concert interface matching the MySQL table structure
export interface Concert {
  id: number;
  date: string;
  artist: string;
  band_pic_url: string;
  band_url: string;
  venue: string;
  ticketinfo: string;
  ticketurl: string;
  featured: string;
  deleted: string;
}

// Ad (Sponsor) interface
export interface Ad {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  image_url: string;
  web_url: string;
  priority: number;
  deleted: string;
}

// Post (Story/CustomText) interface - unified from stories and custom_texts tables
export interface Post {
  id: number;
  headline: string;
  start_date: string;
  end_date: string;
  content: string;
  image_url: string;
  priority: number;
  deleted: string;
  source: 'story' | 'custom_text'; // Track which table it came from
  permalink?: string; // For custom texts only
}

// Story interface (from stories table)
export interface Story {
  id: number;
  headline: string;
  start_date: string;
  end_date: string;
  story: string; // Note: field name is 'story', not 'content'
  pic_url: string;
  priority: number;
  deleted: string;
}

// CustomText interface (from custom_texts table)
export interface CustomText {
  id: number;
  title: string;
  permalink: string;
  html: string;
  status: string; // 'active' or 'deleted'
}

// OnDemand interface - matches MySQL ondemand table
export interface OnDemand {
  id: number;
  date: string;
  image: string;
  headline: string;
  note: string;
  songs: string;
  audio_url: string;
  source: string;
  deleted: string;
}

// CdOfTheWeek interface - matches MySQL cdotw table
export interface CdOfTheWeek {
  id: number;
  artist: string;
  title: string;
  label: string;
  review: string;
  cd_pic_url: string;
  band: string;
  reviewer: string;
  date: string;
  deleted: string;
}

// Import options interface
export interface ImportOptions {
  fromLast?: boolean;
  startId?: number;
}

export async function connectToDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password,
    });
    console.log('Connected to database successfully.');
    return connection;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

export async function getActiveDeejays(
  connection: mysql.Connection,
  options: ImportOptions = {},
): Promise<Deejay[]> {
  try {
    // Import all records - deleted status will be handled as draft/published in Payload
    let query = 'SELECT * FROM deejays WHERE 1=1';
    const params: any[] = [];

    // Add ID filter if provided
    if (options.startId) {
      query += ' AND id >= ?';
      params.push(options.startId);
    }

    query += ' ORDER BY id ASC';

    const [rows] = await connection.query<mysql.RowDataPacket[]>(query, params);

    let filterMsg = '';
    if (options.startId) filterMsg += ` startId=${options.startId}`;

    console.log(
      `Retrieved ${rows.length} deejays from the database.${filterMsg ? ` Filters:${filterMsg}` : ''}`,
    );
    return rows as Deejay[];
  } catch (error) {
    console.error('Query failed:', error);
    throw error;
  }
}

export async function getActiveConcerts(
  connection: mysql.Connection,
  options: ImportOptions = {},
): Promise<Concert[]> {
  try {
    // Select only the fields we need for import
    let query = `
      SELECT id, date, artist, venue, ticketinfo, ticketurl, featured, deleted
      FROM concerts
      WHERE deleted != 'Y'
    `;
    const params: any[] = [];

    // Add ID filter if provided
    if (options.startId) {
      query += ' AND id >= ?';
      params.push(options.startId);
    }

    query += ' ORDER BY id ASC';

    const [rows] = await connection.query<mysql.RowDataPacket[]>(query, params);

    let filterMsg = '';
    if (options.startId) filterMsg += ` startId=${options.startId}`;

    console.log(
      `Retrieved ${rows.length} concerts from the database.${filterMsg ? ` Filters:${filterMsg}` : ''}`,
    );
    return rows as Concert[];
  } catch (error) {
    console.error('Query failed:', error);
    throw error;
  }
}

export async function getActiveAds(
  connection: mysql.Connection,
  options: ImportOptions = {},
): Promise<Ad[]> {
  try {
    // Import all records - deleted status will be handled as draft/published in Payload
    let query = 'SELECT * FROM ads WHERE 1=1';
    const params: any[] = [];

    if (options.startId) {
      query += ' AND id >= ?';
      params.push(options.startId);
    }

    query += ' ORDER BY id ASC';

    const [rows] = await connection.query<mysql.RowDataPacket[]>(query, params);

    let filterMsg = '';
    if (options.startId) filterMsg += ` startId=${options.startId}`;

    console.log(
      `Retrieved ${rows.length} ads from the database.${filterMsg ? ` Filters:${filterMsg}` : ''}`,
    );
    return rows as Ad[];
  } catch (error) {
    console.error('Query failed:', error);
    throw error;
  }
}

/**
 * Get active posts from both stories and custom_texts tables
 * Combines data from both sources into unified Post interface
 */
export async function getActivePosts(
  connection: mysql.Connection,
  options: ImportOptions = {},
): Promise<Post[]> {
  try {
    const posts: Post[] = [];

    // Fetch stories - import all records
    let storiesQuery = 'SELECT * FROM stories WHERE 1=1';
    const storiesParams: any[] = [];

    if (options.startId) {
      storiesQuery += ' AND id >= ?';
      storiesParams.push(options.startId);
    }

    storiesQuery += ' ORDER BY id ASC';

    const [stories] = await connection.query<mysql.RowDataPacket[]>(storiesQuery, storiesParams);

    // Convert stories to Post format
    (stories as Story[]).forEach((story) => {
      posts.push({
        id: story.id,
        headline: story.headline,
        start_date: story.start_date,
        end_date: story.end_date,
        content: story.story, // Map 'story' field to 'content'
        image_url: story.pic_url, // Map 'pic_url' to 'image_url'
        priority: story.priority,
        deleted: story.deleted,
        source: 'story',
      });
    });

    // Fetch custom texts - import only active records
    let customTextsQuery = 'SELECT * FROM custom_texts WHERE status = ?';
    const customTextsParams: any[] = ['active'];

    if (options.startId) {
      customTextsQuery += ' AND id >= ?';
      customTextsParams.push(options.startId);
    }

    customTextsQuery += ' ORDER BY id ASC';

    const [customTexts] = await connection.query<mysql.RowDataPacket[]>(
      customTextsQuery,
      customTextsParams,
    );

    // Convert custom texts to Post format
    (customTexts as CustomText[]).forEach((customText) => {
      posts.push({
        id: customText.id + 10000, // Offset IDs to avoid collisions with story IDs
        headline: customText.title, // Map 'title' field to 'headline'
        start_date: '2000-01-01', // Default start date for custom texts (always visible)
        end_date: '2099-12-31', // Default end date for custom texts (always visible)
        content: customText.html, // Map 'html' field to 'content'
        image_url: '', // Custom texts don't have images
        priority: 0, // Default priority
        deleted: customText.status === 'deleted' ? 'y' : 'n',
        source: 'custom_text',
        permalink: customText.permalink, // Preserve permalink for slug generation
      });
    });

    // Sort by priority (desc) then by start_date (desc)
    posts.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
    });

    let filterMsg = '';
    if (options.startId) filterMsg += ` startId=${options.startId}`;

    console.log(
      `Retrieved ${stories.length} stories and ${customTexts.length} custom texts (${posts.length} total posts) from the database.${filterMsg ? ` Filters:${filterMsg}` : ''}`,
    );
    return posts;
  } catch (error) {
    console.error('Query failed:', error);
    throw error;
  }
}

export async function getActiveOnDemand(
  connection: mysql.Connection,
  options: ImportOptions = {},
): Promise<OnDemand[]> {
  try {
    // Import all records - deleted status will be handled as draft/published in Payload
    let query = 'SELECT * FROM ondemand WHERE 1=1';
    const params: any[] = [];

    if (options.startId) {
      query += ' AND id >= ?';
      params.push(options.startId);
    }

    query += ' ORDER BY id ASC';

    const [rows] = await connection.query<mysql.RowDataPacket[]>(query, params);

    let filterMsg = '';
    if (options.startId) filterMsg += ` startId=${options.startId}`;

    console.log(
      `Retrieved ${rows.length} on-demand items from the database.${filterMsg ? ` Filters:${filterMsg}` : ''}`,
    );
    return rows as OnDemand[];
  } catch (error) {
    console.error('Query failed:', error);
    throw error;
  }
}

export async function getActiveCdOfTheWeek(
  connection: mysql.Connection,
  options: ImportOptions = {},
): Promise<CdOfTheWeek[]> {
  try {
    // Import all records - deleted status will be handled as draft/published in Payload
    let query = 'SELECT * FROM cdotw WHERE 1=1';
    const params: any[] = [];

    if (options.startId) {
      query += ' AND id >= ?';
      params.push(options.startId);
    }

    query += ' ORDER BY id ASC';

    const [rows] = await connection.query<mysql.RowDataPacket[]>(query, params);

    let filterMsg = '';
    if (options.startId) filterMsg += ` startId=${options.startId}`;

    console.log(
      `Retrieved ${rows.length} CD of the Week entries from the database.${filterMsg ? ` Filters:${filterMsg}` : ''}`,
    );
    return rows as CdOfTheWeek[];
  } catch (error) {
    console.error('Query failed:', error);
    throw error;
  }
}
