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

// Post (Story/CustomText) interface
export interface Post {
  id: number;
  headline: string;
  start_date: string;
  end_date: string;
  content: string;
  image_url: string;
  priority: number;
  deleted: string;
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
    let query = "SELECT * FROM deejays WHERE deleted = 'No'";
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
    let query = "SELECT * FROM ads WHERE deleted = 'No'";
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

export async function getActivePosts(
  connection: mysql.Connection,
  options: ImportOptions = {},
): Promise<Post[]> {
  try {
    let query = "SELECT * FROM posts WHERE deleted = 'No'";
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
      `Retrieved ${rows.length} posts from the database.${filterMsg ? ` Filters:${filterMsg}` : ''}`,
    );
    return rows as Post[];
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
    let query = "SELECT * FROM ondemand WHERE deleted = 'n'";
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
    let query = "SELECT * FROM cdotw WHERE deleted = 'n'";
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
