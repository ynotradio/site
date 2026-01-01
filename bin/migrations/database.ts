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

// Person interface (musicians, DJs, etc.)
export interface Person {
  id: number;
  name: string;
  bio: string;
  pic: string;
  deleted: string;
}

// Artist interface (bands, musicians)
export interface Artist {
  id: number;
  name: string;
  bio: string;
  pic: string;
  website: string;
  deleted: string;
}

// Venue interface
export interface Venue {
  id: number;
  name: string;
  address: string;
  city: string;
  website: string;
  deleted: string;
}

// Song interface
export interface Song {
  id: number;
  title: string;
  artist_id: number;
  artist_name: string;
  stream_url: string;
  release_date: string;
  feature_on_new_music: string;
  deleted: string;
}

// Record (Album) interface
export interface Record {
  id: number;
  title: string;
  artist_id: number;
  artist_name: string;
  label: string;
  release_date: string;
  cover_image_url: string;
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

// Show (Schedule) interface
export interface Show {
  id: number;
  date: string;
  day: string;
  start_time: string;
  end_time: string;
  dj_id: number;
  dj_name: string;
  note: string;
  deleted: string;
}

// OnDemand interface
export interface OnDemand {
  id: number;
  title: string;
  artist_id: number;
  artist_name: string;
  stream_url: string;
  deleted: string;
}

// CdOfTheWeek interface
export interface CdOfTheWeek {
  id: number;
  record_id: number;
  record_title: string;
  review: string;
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

export async function getActivePeople(
  connection: mysql.Connection,
  options: ImportOptions = {},
): Promise<Person[]> {
  try {
    let query = "SELECT * FROM people WHERE deleted = 'No'";
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
      `Retrieved ${rows.length} people from the database.${filterMsg ? ` Filters:${filterMsg}` : ''}`,
    );
    return rows as Person[];
  } catch (error) {
    console.error('Query failed:', error);
    throw error;
  }
}

export async function getActiveArtists(
  connection: mysql.Connection,
  options: ImportOptions = {},
): Promise<Artist[]> {
  try {
    let query = "SELECT * FROM artists WHERE deleted = 'No'";
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
      `Retrieved ${rows.length} artists from the database.${filterMsg ? ` Filters:${filterMsg}` : ''}`,
    );
    return rows as Artist[];
  } catch (error) {
    console.error('Query failed:', error);
    throw error;
  }
}

export async function getActiveVenues(
  connection: mysql.Connection,
  options: ImportOptions = {},
): Promise<Venue[]> {
  try {
    let query = "SELECT * FROM venues WHERE deleted = 'No'";
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
      `Retrieved ${rows.length} venues from the database.${filterMsg ? ` Filters:${filterMsg}` : ''}`,
    );
    return rows as Venue[];
  } catch (error) {
    console.error('Query failed:', error);
    throw error;
  }
}

export async function getActiveSongs(
  connection: mysql.Connection,
  options: ImportOptions = {},
): Promise<Song[]> {
  try {
    let query = `
      SELECT s.*, a.name as artist_name
      FROM songs s
      LEFT JOIN artists a ON s.artist_id = a.id
      WHERE s.deleted = 'No'
    `;
    const params: any[] = [];

    if (options.startId) {
      query += ' AND s.id >= ?';
      params.push(options.startId);
    }

    query += ' ORDER BY s.id ASC';

    const [rows] = await connection.query<mysql.RowDataPacket[]>(query, params);

    let filterMsg = '';
    if (options.startId) filterMsg += ` startId=${options.startId}`;

    console.log(
      `Retrieved ${rows.length} songs from the database.${filterMsg ? ` Filters:${filterMsg}` : ''}`,
    );
    return rows as Song[];
  } catch (error) {
    console.error('Query failed:', error);
    throw error;
  }
}

export async function getActiveRecords(
  connection: mysql.Connection,
  options: ImportOptions = {},
): Promise<Record[]> {
  try {
    let query = `
      SELECT r.*, a.name as artist_name
      FROM records r
      LEFT JOIN artists a ON r.artist_id = a.id
      WHERE r.deleted = 'No'
    `;
    const params: any[] = [];

    if (options.startId) {
      query += ' AND r.id >= ?';
      params.push(options.startId);
    }

    query += ' ORDER BY r.id ASC';

    const [rows] = await connection.query<mysql.RowDataPacket[]>(query, params);

    let filterMsg = '';
    if (options.startId) filterMsg += ` startId=${options.startId}`;

    console.log(
      `Retrieved ${rows.length} records from the database.${filterMsg ? ` Filters:${filterMsg}` : ''}`,
    );
    return rows as Record[];
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

export async function getActiveShows(
  connection: mysql.Connection,
  options: ImportOptions = {},
): Promise<Show[]> {
  try {
    let query = `
      SELECT s.*, d.name as dj_name
      FROM shows s
      LEFT JOIN deejays d ON s.dj_id = d.id
      WHERE s.deleted = 'No'
    `;
    const params: any[] = [];

    if (options.startId) {
      query += ' AND s.id >= ?';
      params.push(options.startId);
    }

    query += ' ORDER BY s.id ASC';

    const [rows] = await connection.query<mysql.RowDataPacket[]>(query, params);

    let filterMsg = '';
    if (options.startId) filterMsg += ` startId=${options.startId}`;

    console.log(
      `Retrieved ${rows.length} shows from the database.${filterMsg ? ` Filters:${filterMsg}` : ''}`,
    );
    return rows as Show[];
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
    let query = `
      SELECT o.*, a.name as artist_name
      FROM ondemand o
      LEFT JOIN artists a ON o.artist_id = a.id
      WHERE o.deleted = 'No'
    `;
    const params: any[] = [];

    if (options.startId) {
      query += ' AND o.id >= ?';
      params.push(options.startId);
    }

    query += ' ORDER BY o.id ASC';

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
    let query = `
      SELECT c.*, r.title as record_title
      FROM cdoftheweek c
      LEFT JOIN records r ON c.record_id = r.id
      WHERE c.deleted = 'No'
    `;
    const params: any[] = [];

    if (options.startId) {
      query += ' AND c.id >= ?';
      params.push(options.startId);
    }

    query += ' ORDER BY c.id ASC';

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
