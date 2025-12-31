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
    let query = "SELECT * FROM concerts WHERE deleted != 'Y'";
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
