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

export async function getActiveDeejays(connection: mysql.Connection): Promise<Deejay[]> {
  try {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT * FROM deejays WHERE deleted = 'No' ORDER BY sort"
    );
    console.log(`Retrieved ${rows.length} deejays from the database.`);
    return rows as Deejay[];
  } catch (error) {
    console.error('Query failed:', error);
    throw error;
  }
}
