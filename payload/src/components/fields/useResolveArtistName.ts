'use client';

import { useCallback } from 'react';

const extractFromRelation = (rel: unknown): { id?: string; name?: string } => {
  if (
    typeof rel === 'object' && rel
    && 'name' in rel
    && typeof rel.name === 'string'
    && rel.name.trim()
  ) {
    return { name: rel.name.trim() };
  }

  if (typeof rel === 'string' || typeof rel === 'number') {
    return { id: String(rel) };
  }

  if (
    typeof rel === 'object' && rel
    && 'id' in rel
    && typeof rel.id === 'string'
  ) {
    return { id: rel.id };
  }

  return {};
};

/**
 * Extracts the artist ID or inline name from a Payload relationship field value.
 */
const extractArtistIdOrName = (rawArtist: unknown): { id?: string; name?: string } => {
  if (!rawArtist) return {};

  if (
    typeof rawArtist === 'object'
    && 'name' in rawArtist
    && typeof rawArtist.name === 'string'
    && rawArtist.name.trim()
  ) {
    return { name: rawArtist.name.trim() };
  }

  if (typeof rawArtist === 'string' || typeof rawArtist === 'number') {
    return { id: String(rawArtist) };
  }

  if (
    typeof rawArtist === 'object'
    && 'id' in rawArtist
    && typeof rawArtist.id === 'string'
  ) {
    return { id: rawArtist.id };
  }

  if (typeof rawArtist === 'object' && 'value' in rawArtist) {
    return extractFromRelation(rawArtist.value);
  }

  return {};
};

const fetchArtistName = async (artistId: string): Promise<string> => {
  try {
    const response = await fetch(`/api/artists/${artistId}?depth=0`);
    if (!response.ok) return '';
    const data = (await response.json()) as { name?: string };
    return data.name?.trim() || '';
  } catch {
    return '';
  }
};

/**
 * Resolves an artist name from a Payload relationship field value.
 *
 * Payload relationship fields can store the artist in several forms:
 * - A plain string/number ID → fetched from /api/artists/:id
 * - An object with a `name` property → used directly
 * - An object with an `id` property → fetched from /api/artists/:id
 * - An object with a `value` property (nested relation) → resolved recursively
 */
export const useResolveArtistName = (
  artistFieldValue: unknown,
): (() => Promise<string>) => useCallback(async (): Promise<string> => {
  const { id, name } = extractArtistIdOrName(artistFieldValue);
  if (name) return name;
  if (!id) return '';
  return fetchArtistName(id);
}, [artistFieldValue]);
