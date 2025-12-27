import React, { useEffect, useState } from 'react';
import {
  Card, Stack, Text, Heading, Box, Spinner, Button, Dialog, TextInput, Label, Flex, Checkbox, Radio, useToast,
} from '@sanity/ui';
import { useClient } from 'sanity';

interface SuspiciousArtist {
  _id: string;
  name: string;
  concertCount: number;
  reason: string;
  similarTo?: string;
}

interface ConcertWithDuplicates {
  _id: string;
  date: string;
  title?: string;
  artists: Array<{ _ref: string; _key: string }>;
  duplicatePairs: Array<{
    artist1: { _id: string; name: string };
    artist2: { _id: string; name: string };
    similarity: string;
  }>;
}

interface Artist {
  _id: string;
  name: string;
  concertCount: number;
}

interface SplitArtistMatch {
  name: string;
  existingArtistId?: string;
  existingArtistConcertCount?: number;
}

/**
 * Artist Cleanup Tool
 *
 * Helps identify potential data quality issues:
 * - Artists with suspicious names (parentheses, "and", "w/", etc.)
 * - Potential duplicates (similar names)
 * - Artists with only one concert (might be parsing errors)
 *
 * Features:
 * - Split artists into multiple artists
 * - Merge duplicate artists
 */
export default function ArtistCleanupTool() {
  const client = useClient({ apiVersion: '2023-03-01' });
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [suspiciousArtists, setSuspiciousArtists] = useState<SuspiciousArtist[]>([]);
  const [allArtists, setAllArtists] = useState<Artist[]>([]);
  const [concertsWithDuplicates, setConcertsWithDuplicates] = useState<ConcertWithDuplicates[]>([]);
  const [autoFixing, setAutoFixing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Split dialog state
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [splitArtist, setSplitArtist] = useState<SuspiciousArtist | null>(null);
  const [splitNames, setSplitNames] = useState<string[]>([]);
  const [splitMatches, setSplitMatches] = useState<SplitArtistMatch[]>([]);
  const [splitting, setSplitting] = useState(false);
  const [splitMethod, setSplitMethod] = useState<'manual' | 'and' | '&' | 'w/' | 'with' | 'parentheses'>('manual');

  // Merge dialog state
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeSourceArtist, setMergeSourceArtist] = useState<SuspiciousArtist | null>(null);
  const [mergeTargetSearch, setMergeTargetSearch] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    loadSuspiciousArtists();
  }, []);

  // Normalize artist name for duplicate detection
  function normalizeArtistName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove all punctuation
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Check if two artist names are similar (potential duplicates)
  function areArtistsSimilar(name1: string, name2: string): string | null {
    const norm1 = normalizeArtistName(name1);
    const norm2 = normalizeArtistName(name2);

    // Exact match after normalization
    if (norm1 === norm2) {
      return 'Identical after removing punctuation';
    }

    // Check if one is a substring of the other (e.g., "The Band" vs "Band")
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      return 'One name contains the other';
    }

    // Check for "The" prefix difference
    if (norm1 === `the ${norm2}` || norm2 === `the ${norm1}`) {
      return 'Differs only by "The" prefix';
    }

    return null;
  }

  async function checkConcertDuplicates() {
    setCheckingDuplicates(true);
    try {
      // Fetch all concerts with their artists
      const query = `*[_type == "concert" && count(artists) > 1] {
        _id,
        date,
        title,
        artists[]->{_id, name}
      } | order(date desc)`;

      const concerts = await client.fetch(query);

      const concertsWithDups: ConcertWithDuplicates[] = [];

      for (const concert of concerts) {
        const duplicatePairs: ConcertWithDuplicates['duplicatePairs'] = [];

        // Check each pair of artists in this concert
        for (let i = 0; i < concert.artists.length; i++) {
          for (let j = i + 1; j < concert.artists.length; j++) {
            const artist1 = concert.artists[i];
            const artist2 = concert.artists[j];

            if (!artist1 || !artist2) continue;

            const similarity = areArtistsSimilar(artist1.name, artist2.name);
            if (similarity) {
              duplicatePairs.push({
                artist1,
                artist2,
                similarity,
              });
            }
          }
        }

        if (duplicatePairs.length > 0) {
          concertsWithDups.push({
            _id: concert._id,
            date: concert.date,
            title: concert.title,
            artists: concert.artists,
            duplicatePairs,
          });
        }
      }

      setConcertsWithDuplicates(concertsWithDups);

      toast.push({
        status: concertsWithDups.length > 0 ? 'warning' : 'success',
        title: 'Duplicate check complete',
        description: concertsWithDups.length > 0
          ? `Found ${concertsWithDups.length} concerts with potential duplicate artists`
          : 'No duplicate artists found in concerts',
      });
    } catch (error) {
      console.error('Error checking duplicates:', error);
      toast.push({
        status: 'error',
        title: 'Error checking duplicates',
        description: (error as Error).message,
      });
    } finally {
      setCheckingDuplicates(false);
    }
  }

  async function loadSuspiciousArtists() {
    setLoading(true);
    try {
      // Fetch all artists with their concert count
      const query = `*[_type == "artist"] {
        _id,
        name,
        "concertCount": count(*[_type == "concert" && references(^._id)])
      } | order(name asc)`;

      const artists = await client.fetch(query);
      setAllArtists(artists);

      const suspicious: SuspiciousArtist[] = [];

      artists.forEach((artist: { _id: string; name: string; concertCount: number }) => {
        const reasons: string[] = [];

        // Check for parentheses (might be wrongly extracted from titles)
        if (artist.name.includes('(') || artist.name.includes(')')) {
          reasons.push('Contains parentheses - might be from a concert title');
        }

        // Check for "and" or "&" with multiple words (might need splitting)
        if (
          (artist.name.includes(' and ') || artist.name.includes(' & '))
          && !artist.name.match(/^[A-Z][a-z]+\s+&\s+The\s+/) // Not "Echo & The Bunnymen" pattern
        ) {
          reasons.push('Contains "and" or "&" - might be multiple artists');
        }

        // Check for "w/" or "with" (definitely multiple artists)
        if (artist.name.includes(' w/') || artist.name.includes(' with ')) {
          reasons.push('Contains "w/" or "with" - likely multiple artists');
        }

        // Check for "of" pattern
        if (artist.name.includes('(of ') || artist.name.includes('(from ')) {
          reasons.push('Contains "(of ...)" - might be wrongly extracted');
        }

        // Check for no concerts at all
        if (artist.concertCount === 0) {
          reasons.push('No concerts - orphaned artist');
        }

        // Only flag single concert when combined with other suspicious patterns
        if (artist.concertCount === 1 && reasons.length > 0) {
          reasons.push('Only 1 concert - verify this is correct');
        }

        if (reasons.length > 0) {
          suspicious.push({
            _id: artist._id,
            name: artist.name,
            concertCount: artist.concertCount,
            reason: reasons.join('; '),
          });
        }
      });

      // Sort by most suspicious (most reasons) first
      suspicious.sort((a, b) => {
        const aReasonCount = a.reason.split(';').length;
        const bReasonCount = b.reason.split(';').length;
        return bReasonCount - aReasonCount;
      });

      setSuspiciousArtists(suspicious);
    } catch (error) {
      console.error('Error loading artists:', error);
      toast.push({
        status: 'error',
        title: 'Error loading artists',
        description: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  }

  function openArtist(artistId: string) {
    // Open the artist document in Sanity Studio
    // Format: /intent/edit/id=<documentId>
    window.open(`/sanity/intent/edit/id=${artistId}`, '_blank');
  }

  function openSplitDialog(artist: SuspiciousArtist) {
    setSplitArtist(artist);

    // Detect what split methods are available
    let defaultMethod: typeof splitMethod = 'manual';
    if (artist.name.includes(' w/')) {
      defaultMethod = 'w/';
    } else if (artist.name.includes(' with ')) {
      defaultMethod = 'with';
    } else if (artist.name.includes(' and ')) {
      defaultMethod = 'and';
    } else if (artist.name.includes(' & ')) {
      defaultMethod = '&';
    } else if (artist.name.includes('(') || artist.name.includes(')')) {
      defaultMethod = 'parentheses';
    }

    setSplitMethod(defaultMethod);
    applySplitMethod(artist.name, defaultMethod);
    setSplitDialogOpen(true);
  }

  async function applySplitMethod(artistName: string, method: typeof splitMethod) {
    let suggested: string[] = [];

    switch (method) {
      case 'w/':
        suggested = artistName.split(' w/').map((n) => n.trim());
        break;
      case 'with':
        suggested = artistName.split(' with ').map((n) => n.trim());
        break;
      case 'and':
        suggested = artistName.split(' and ').map((n) => n.trim());
        break;
      case '&':
        suggested = artistName.split(' & ').map((n) => n.trim());
        break;
      case 'parentheses':
        // Remove parentheses and their contents
        suggested = [artistName.replace(/\s*\([^)]*\)/g, '').trim()];
        break;
      case 'manual':
        // Start with the original name
        suggested = [artistName];
        break;
    }

    const filteredNames = suggested.filter((n) => n.length > 0);
    setSplitNames(filteredNames);

    // Find existing artists that match these names
    const matches: SplitArtistMatch[] = [];
    for (const name of filteredNames) {
      const existingArtist = allArtists.find((a) => a.name.toLowerCase() === name.toLowerCase());
      matches.push({
        name,
        existingArtistId: existingArtist?._id,
        existingArtistConcertCount: existingArtist?.concertCount,
      });
    }
    setSplitMatches(matches);
  }

  async function handleSplit() {
    if (!splitArtist || splitNames.length === 0) return;

    setSplitting(true);
    try {
      // Get all concerts that reference this artist
      const concertsQuery = `*[_type == "concert" && references($artistId)] {
        _id,
        artists
      }`;
      const concerts = await client.fetch(concertsQuery, { artistId: splitArtist._id });

      // Create new artist documents for each split name
      const newArtistIds: { [name: string]: string } = {};
      for (const name of splitNames) {
        // Check if artist already exists
        const existingQuery = '*[_type == "artist" && name == $name][0]._id';
        const existingId = await client.fetch(existingQuery, { name });

        if (existingId) {
          newArtistIds[name] = existingId;
        } else {
          // Create new artist
          const newArtist = await client.create({
            _type: 'artist',
            name,
          });
          newArtistIds[name] = newArtist._id;
        }
      }

      // Update all concerts to reference the new artists instead
      for (const concert of concerts) {
        const updatedArtists = concert.artists
          .filter((ref: any) => ref._ref !== splitArtist._id)
          .concat(splitNames.map((name) => ({ _type: 'reference', _ref: newArtistIds[name] })));

        await client.patch(concert._id).set({ artists: updatedArtists }).commit();
      }

      // Delete the old artist
      await client.delete(splitArtist._id);

      toast.push({
        status: 'success',
        title: 'Artist split successfully',
        description: `Split "${splitArtist.name}" into ${splitNames.length} artists`,
      });

      setSplitDialogOpen(false);
      setSplitArtist(null);
      setSplitNames([]);

      // Reload artists
      loadSuspiciousArtists();
    } catch (error) {
      console.error('Error splitting artist:', error);
      toast.push({
        status: 'error',
        title: 'Error splitting artist',
        description: (error as Error).message,
      });
    } finally {
      setSplitting(false);
    }
  }

  function openMergeDialog(artist: SuspiciousArtist) {
    setMergeSourceArtist(artist);

    // Try to find similar artists by removing common patterns
    let searchTerm = artist.name;

    // Remove parentheses and their contents
    searchTerm = searchTerm.replace(/\s*\([^)]*\)/g, '').trim();

    // If there's still "and" or "with", take just the first part
    if (searchTerm.includes(' and ')) {
      searchTerm = searchTerm.split(' and ')[0].trim();
    } else if (searchTerm.includes(' & ')) {
      searchTerm = searchTerm.split(' & ')[0].trim();
    } else if (searchTerm.includes(' w/')) {
      searchTerm = searchTerm.split(' w/')[0].trim();
    } else if (searchTerm.includes(' with ')) {
      searchTerm = searchTerm.split(' with ')[0].trim();
    }

    setMergeTargetSearch(searchTerm);
    setMergeTargetId(null);
    setMergeDialogOpen(true);
  }

  async function handleMerge() {
    if (!mergeSourceArtist || !mergeTargetId) return;

    setMerging(true);
    try {
      // Get all concerts that reference the source artist
      const concertsQuery = `*[_type == "concert" && references($sourceId)] {
        _id,
        artists
      }`;
      const concerts = await client.fetch(concertsQuery, { sourceId: mergeSourceArtist._id });

      // Update all concerts to reference the target artist instead
      for (const concert of concerts) {
        // Remove source artist and add target artist if not already present
        const hasTarget = concert.artists.some((ref: any) => ref._ref === mergeTargetId);
        const updatedArtists = concert.artists
          .filter((ref: any) => ref._ref !== mergeSourceArtist._id)
          .concat(hasTarget ? [] : [{ _type: 'reference', _ref: mergeTargetId }]);

        await client.patch(concert._id).set({ artists: updatedArtists }).commit();
      }

      // Delete the source artist
      await client.delete(mergeSourceArtist._id);

      toast.push({
        status: 'success',
        title: 'Artists merged successfully',
        description: `Merged "${mergeSourceArtist.name}" into target artist`,
      });

      setMergeDialogOpen(false);
      setMergeSourceArtist(null);
      setMergeTargetSearch('');
      setMergeTargetId(null);

      // Reload artists
      loadSuspiciousArtists();
    } catch (error) {
      console.error('Error merging artists:', error);
      toast.push({
        status: 'error',
        title: 'Error merging artists',
        description: (error as Error).message,
      });
    } finally {
      setMerging(false);
    }
  }

  function getFilteredArtists() {
    if (!mergeTargetSearch) return [];
    const search = mergeTargetSearch.toLowerCase();
    return allArtists
      .filter((a) => a._id !== mergeSourceArtist?._id
        && a.name.toLowerCase().includes(search))
      .slice(0, 10); // Limit to 10 results
  }

  async function removeDuplicateFromConcert(
    concertId: string,
    keepArtistId: string,
    removeArtistId: string,
  ) {
    try {
      // Get the concert
      const concert = await client.fetch(
        '*[_type == "concert" && _id == $concertId][0]{ _id, artists }',
        { concertId },
      );

      if (!concert) {
        throw new Error('Concert not found');
      }

      // Remove the duplicate artist
      const updatedArtists = concert.artists.filter(
        (ref: any) => ref._ref !== removeArtistId,
      );

      await client.patch(concertId).set({ artists: updatedArtists }).commit();

      toast.push({
        status: 'success',
        title: 'Duplicate removed',
        description: 'Artist removed from concert',
      });

      // Refresh the duplicate check
      checkConcertDuplicates();
    } catch (error) {
      console.error('Error removing duplicate:', error);
      toast.push({
        status: 'error',
        title: 'Error removing duplicate',
        description: (error as Error).message,
      });
    }
  }

  function openConcert(concertId: string) {
    window.open(`/sanity/intent/edit/id=${concertId}`, '_blank');
  }

  async function handleAutoFix() {
    setAutoFixing(true);
    let fixed = 0;
    let errors = 0;

    try {
      for (const artist of suspiciousArtists) {
        try {
          // Rule 1: Delete orphaned artists (0 concerts)
          if (artist.concertCount === 0) {
            await client.delete(artist._id);
            fixed++;
            continue;
          }

          // Rule 2: Remove parentheses if clean version exists
          if (artist.name.includes('(') || artist.name.includes(')')) {
            const cleanName = artist.name.replace(/\s*\([^)]*\)/g, '').trim();
            const existingArtist = allArtists.find((a) => a.name.toLowerCase() === cleanName.toLowerCase() && a._id !== artist._id);

            if (existingArtist) {
              // Merge into clean version
              const concerts = await client.fetch(
                '*[_type == "concert" && references($artistId)] { _id, artists }',
                { artistId: artist._id },
              );

              for (const concert of concerts) {
                const hasTarget = concert.artists.some((ref: any) => ref._ref === existingArtist._id);
                const updatedArtists = concert.artists
                  .filter((ref: any) => ref._ref !== artist._id)
                  .concat(hasTarget ? [] : [{ _type: 'reference', _ref: existingArtist._id }]);

                await client.patch(concert._id).set({ artists: updatedArtists }).commit();
              }

              // Verify no references remain before deleting
              const remainingRefs = await client.fetch(
                'count(*[_type == "concert" && references($artistId)])',
                { artistId: artist._id },
              );

              if (remainingRefs === 0) {
                await client.delete(artist._id);
                fixed++;
              } else {
                console.warn(`Skipping delete of ${artist.name} - still has ${remainingRefs} references`);
                errors++;
              }
              continue;
            }
          }

          // Rule 3: Auto-split if both parts exist separately
          if (artist.concertCount === 1 && (artist.name.includes(' and ') || artist.name.includes(' & '))) {
            const parts = artist.name.includes(' and ')
              ? artist.name.split(' and ').map((n) => n.trim())
              : artist.name.split(' & ').map((n) => n.trim());

            // Check if all parts exist
            const existingParts = parts.map((part) => allArtists.find((a) => a.name.toLowerCase() === part.toLowerCase())).filter(Boolean);

            if (existingParts.length === parts.length) {
              // All parts exist, auto-split
              const concerts = await client.fetch(
                '*[_type == "concert" && references($artistId)] { _id, artists }',
                { artistId: artist._id },
              );

              for (const concert of concerts) {
                const updatedArtists = concert.artists
                  .filter((ref: any) => ref._ref !== artist._id)
                  .concat(existingParts.map((a) => ({ _type: 'reference', _ref: a!._id })));

                await client.patch(concert._id).set({ artists: updatedArtists }).commit();
              }

              // Verify no references remain before deleting
              const remainingRefs = await client.fetch(
                'count(*[_type == "concert" && references($artistId)])',
                { artistId: artist._id },
              );

              if (remainingRefs === 0) {
                await client.delete(artist._id);
                fixed++;
              } else {
                console.warn(`Skipping delete of ${artist.name} - still has ${remainingRefs} references`);
                errors++;
              }
              continue;
            }
          }
        } catch (error) {
          console.error(`Error auto-fixing ${artist.name}:`, error);
          errors++;
        }
      }

      toast.push({
        status: 'success',
        title: 'Auto-fix complete',
        description: `Fixed ${fixed} artists${errors > 0 ? ` (${errors} errors)` : ''}`,
      });

      // Reload the list
      loadSuspiciousArtists();
    } catch (error) {
      console.error('Error during auto-fix:', error);
      toast.push({
        status: 'error',
        title: 'Auto-fix failed',
        description: (error as Error).message,
      });
    } finally {
      setAutoFixing(false);
    }
  }

  function handleExportCSV() {
    setExporting(true);
    try {
      // Create CSV with suspicious artists
      const headers = ['ID', 'Name', 'Concert Count', 'Issues', 'Suggested Action', 'Target Artist'];
      const rows = suspiciousArtists.map((artist) => {
        let suggestedAction = '';
        let targetArtist = '';

        // Determine suggested action
        if (artist.concertCount === 0) {
          suggestedAction = 'DELETE';
        } else if (artist.name.includes('(') || artist.name.includes(')')) {
          const cleanName = artist.name.replace(/\s*\([^)]*\)/g, '').trim();
          const existing = allArtists.find((a) => a.name.toLowerCase() === cleanName.toLowerCase() && a._id !== artist._id);
          if (existing) {
            suggestedAction = 'MERGE';
            targetArtist = existing.name;
          } else {
            suggestedAction = 'MANUAL';
          }
        } else if (artist.name.includes(' and ') || artist.name.includes(' & ')) {
          suggestedAction = 'SPLIT';
          const parts = artist.name.includes(' and ')
            ? artist.name.split(' and ')
            : artist.name.split(' & ');
          targetArtist = parts.join(' | ');
        } else {
          suggestedAction = 'MANUAL';
        }

        return [
          artist._id,
          artist.name,
          artist.concertCount.toString(),
          artist.reason,
          suggestedAction,
          targetArtist,
        ];
      });

      // Convert to CSV
      const csv = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      // Download file
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `artist-cleanup-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.push({
        status: 'success',
        title: 'CSV exported',
        description: `Exported ${suspiciousArtists.length} artists`,
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.push({
        status: 'error',
        title: 'Export failed',
        description: (error as Error).message,
      });
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <Card padding={4}>
        <Stack space={4}>
          <Flex direction="column" align="center" gap={4}>
            <Spinner muted />
            <Text>Loading artists for cleanup review...</Text>
          </Flex>
        </Stack>
      </Card>
    );
  }

  return (
    <Card padding={4}>
      <Stack space={4}>
        <Box>
          <Heading size={3}>Artist Cleanup</Heading>
          <Text muted size={1}>
            {suspiciousArtists.length} artists need review
          </Text>
        </Box>

        <Flex gap={2}>
          <Button
            text="Refresh"
            onClick={loadSuspiciousArtists}
            tone="primary"
          />
          <Button
            text={checkingDuplicates ? 'Checking...' : 'Check Concert Duplicates'}
            onClick={checkConcertDuplicates}
            tone="caution"
            disabled={checkingDuplicates}
          />
          <Button
            text={autoFixing ? 'Auto-fixing...' : 'Auto-Fix Obvious Cases'}
            onClick={handleAutoFix}
            tone="positive"
            disabled={autoFixing || suspiciousArtists.length === 0}
          />
          <Button
            text={exporting ? 'Exporting...' : 'Export to CSV'}
            onClick={handleExportCSV}
            mode="ghost"
            disabled={exporting || suspiciousArtists.length === 0}
          />
        </Flex>

        {concertsWithDuplicates.length > 0 && (
          <Box>
            <Heading size={2}>Concerts with Duplicate Artists ({concertsWithDuplicates.length})</Heading>
            <Text muted size={1} style={{ marginTop: '8px' }}>
              These concerts have artists that appear to be duplicates
            </Text>
            <Stack space={3} style={{ marginTop: '16px' }}>
              {concertsWithDuplicates.map((concert) => (
                <Card
                  key={concert._id}
                  padding={3}
                  border
                  tone="critical"
                >
                  <Stack space={3}>
                    <Box>
                      <Heading size={1}>
                        {concert.title || 'Untitled Concert'}
                      </Heading>
                      <Text size={1} muted>
                        {new Date(concert.date).toLocaleDateString()} • {concert.artists.length} artists
                      </Text>
                    </Box>

                    {concert.duplicatePairs.map((pair, idx) => (
                      <Card key={idx} padding={2} tone="default" border>
                        <Stack space={2}>
                          <Text size={1} style={{ color: '#ff6b35' }}>
                            ⚠️ {pair.similarity}
                          </Text>
                          <Flex gap={2} align="center" wrap="wrap">
                            <Box flex={1}>
                              <Text weight="semibold">{pair.artist1.name}</Text>
                            </Box>
                            <Button
                              text="Keep"
                              onClick={() => removeDuplicateFromConcert(
                                concert._id,
                                pair.artist1._id,
                                pair.artist2._id,
                              )
                              }
                              mode="ghost"
                              tone="positive"
                              fontSize={1}
                            />
                          </Flex>
                          <Flex gap={2} align="center" wrap="wrap">
                            <Box flex={1}>
                              <Text weight="semibold">{pair.artist2.name}</Text>
                            </Box>
                            <Button
                              text="Keep"
                              onClick={() => removeDuplicateFromConcert(
                                concert._id,
                                pair.artist2._id,
                                pair.artist1._id,
                              )
                              }
                              mode="ghost"
                              tone="positive"
                              fontSize={1}
                            />
                          </Flex>
                        </Stack>
                      </Card>
                    ))}

                    <Button
                      text="View Concert"
                      onClick={() => openConcert(concert._id)}
                      mode="ghost"
                      fontSize={1}
                    />
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Box>
        )}

        <Box>
          <Heading size={2}>Suspicious Artists ({suspiciousArtists.length})</Heading>
          <Text muted size={1} style={{ marginTop: '8px' }}>
            Artists with potential naming issues
          </Text>
        </Box>

        <Stack space={3}>
          {suspiciousArtists.length === 0 ? (
            <Card padding={3} tone="positive">
              <Text>✅ No suspicious artists found! Everything looks clean.</Text>
            </Card>
          ) : (
            suspiciousArtists.map((artist) => (
              <Card
                key={artist._id}
                padding={3}
                border
                tone="caution"
              >
                <Stack space={2}>
                  <Box>
                    <Heading size={1}>{artist.name}</Heading>
                    <Text size={1} muted>
                      {artist.concertCount} concert{artist.concertCount !== 1 ? 's' : ''}
                    </Text>
                  </Box>
                  <Text size={1} style={{ color: '#ff6b35' }}>
                    ⚠️ {artist.reason}
                  </Text>
                  <Flex gap={2}>
                    <Button
                      text="View"
                      onClick={() => openArtist(artist._id)}
                      mode="ghost"
                      fontSize={1}
                    />
                    <Button
                      text="Split"
                      onClick={(e) => {
                        e.stopPropagation();
                        openSplitDialog(artist);
                      }}
                      mode="ghost"
                      tone="primary"
                      fontSize={1}
                    />
                    <Button
                      text="Merge"
                      onClick={(e) => {
                        e.stopPropagation();
                        openMergeDialog(artist);
                      }}
                      mode="ghost"
                      tone="caution"
                      fontSize={1}
                    />
                  </Flex>
                </Stack>
              </Card>
            ))
          )}
        </Stack>
      </Stack>

      {/* Split Dialog */}
      {splitDialogOpen && splitArtist && (
        <Dialog
          header={`Split Artist: ${splitArtist.name}`}
          id="split-dialog"
          onClose={() => setSplitDialogOpen(false)}
          width={1}
        >
          <Box padding={4}>
            <Stack space={4}>
              <Text>
                Choose how to split this artist:
              </Text>

              <Stack space={2}>
                <Label size={1}>Split method</Label>
                <Stack space={2}>
                  {splitArtist.name.includes(' and ') && (
                    <Flex align="center" gap={2}>
                      <Radio
                        checked={splitMethod === 'and'}
                        onChange={() => {
                          setSplitMethod('and');
                          applySplitMethod(splitArtist.name, 'and');
                        }}
                      />
                      <Text>Split by " and "</Text>
                    </Flex>
                  )}
                  {splitArtist.name.includes(' & ') && (
                    <Flex align="center" gap={2}>
                      <Radio
                        checked={splitMethod === '&'}
                        onChange={() => {
                          setSplitMethod('&');
                          applySplitMethod(splitArtist.name, '&');
                        }}
                      />
                      <Text>Split by " & "</Text>
                    </Flex>
                  )}
                  {splitArtist.name.includes(' w/') && (
                    <Flex align="center" gap={2}>
                      <Radio
                        checked={splitMethod === 'w/'}
                        onChange={() => {
                          setSplitMethod('w/');
                          applySplitMethod(splitArtist.name, 'w/');
                        }}
                      />
                      <Text>Split by " w/"</Text>
                    </Flex>
                  )}
                  {splitArtist.name.includes(' with ') && (
                    <Flex align="center" gap={2}>
                      <Radio
                        checked={splitMethod === 'with'}
                        onChange={() => {
                          setSplitMethod('with');
                          applySplitMethod(splitArtist.name, 'with');
                        }}
                      />
                      <Text>Split by " with "</Text>
                    </Flex>
                  )}
                  {(splitArtist.name.includes('(') || splitArtist.name.includes(')')) && (
                    <Flex align="center" gap={2}>
                      <Radio
                        checked={splitMethod === 'parentheses'}
                        onChange={() => {
                          setSplitMethod('parentheses');
                          applySplitMethod(splitArtist.name, 'parentheses');
                        }}
                      />
                      <Text>Remove parentheses</Text>
                    </Flex>
                  )}
                  <Flex align="center" gap={2}>
                    <Radio
                      checked={splitMethod === 'manual'}
                      onChange={() => {
                        setSplitMethod('manual');
                        applySplitMethod(splitArtist.name, 'manual');
                      }}
                    />
                    <Text>Manual split</Text>
                  </Flex>
                </Stack>
              </Stack>

              <Stack space={3}>
                {splitNames.map((name, index) => {
                  const match = splitMatches[index];
                  const hasExisting = match?.existingArtistId;

                  return (
                    <Box key={index}>
                      <Label size={1}>
                        Artist {index + 1}
                        {hasExisting && (
                          <Text size={1} style={{ color: '#2e7d32', marginLeft: '8px' }}>
                            ✓ Exists ({match.existingArtistConcertCount} concert{match.existingArtistConcertCount !== 1 ? 's' : ''})
                          </Text>
                        )}
                      </Label>
                      <Flex gap={2}>
                        <Box flex={1}>
                          <TextInput
                            value={name}
                            onChange={(e) => {
                              const newNames = [...splitNames];
                              newNames[index] = e.currentTarget.value;
                              setSplitNames(newNames);
                              // Re-check for matches when name changes
                              applySplitMethod(splitArtist?.name || '', splitMethod);
                            }}
                            fontSize={2}
                          />
                        </Box>
                        {splitNames.length > 1 && (
                          <Button
                            text="Remove"
                            onClick={() => {
                              const newNames = splitNames.filter((_, i) => i !== index);
                              setSplitNames(newNames);
                              const newMatches = splitMatches.filter((_, i) => i !== index);
                              setSplitMatches(newMatches);
                            }}
                            tone="critical"
                            mode="ghost"
                          />
                        )}
                      </Flex>
                    </Box>
                  );
                })}
              </Stack>

              <Button
                text="Add Another Artist"
                onClick={() => setSplitNames([...splitNames, ''])}
                mode="ghost"
              />

              <Flex gap={2} justify="flex-end">
                <Button
                  text="Cancel"
                  onClick={() => setSplitDialogOpen(false)}
                  mode="ghost"
                />
                <Button
                  text={splitting ? 'Splitting...' : 'Split Artist'}
                  onClick={handleSplit}
                  tone="primary"
                  disabled={splitting || splitNames.length === 0 || splitNames.some((n) => !n.trim())}
                />
              </Flex>
            </Stack>
          </Box>
        </Dialog>
      )}

      {/* Merge Dialog */}
      {mergeDialogOpen && mergeSourceArtist && (
        <Dialog
          header={`Merge Artist: ${mergeSourceArtist.name}`}
          id="merge-dialog"
          onClose={() => setMergeDialogOpen(false)}
          width={1}
        >
          <Box padding={4}>
            <Stack space={4}>
              <Text>
                Merge this artist into another artist. All concerts will be transferred to the target artist.
              </Text>

              <Box>
                <Label size={1}>Search for target artist</Label>
                <TextInput
                  value={mergeTargetSearch}
                  onChange={(e) => {
                    setMergeTargetSearch(e.currentTarget.value);
                    setMergeTargetId(null);
                  }}
                  placeholder="Type to search..."
                  fontSize={2}
                />
              </Box>

              {mergeTargetSearch && (
                <Stack space={2}>
                  {getFilteredArtists().map((artist) => (
                    <Card
                      key={artist._id}
                      padding={3}
                      border
                      tone={mergeTargetId === artist._id ? 'primary' : 'default'}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setMergeTargetId(artist._id)}
                    >
                      <Flex gap={2} align="center">
                        <Checkbox
                          checked={mergeTargetId === artist._id}
                          readOnly
                        />
                        <Box flex={1}>
                          <Text weight="semibold">{artist.name}</Text>
                          <Text size={1} muted>
                            {artist.concertCount} concert{artist.concertCount !== 1 ? 's' : ''}
                          </Text>
                        </Box>
                      </Flex>
                    </Card>
                  ))}
                  {getFilteredArtists().length === 0 && (
                    <Text muted>No matching artists found</Text>
                  )}
                </Stack>
              )}

              <Flex gap={2} justify="flex-end">
                <Button
                  text="Cancel"
                  onClick={() => setMergeDialogOpen(false)}
                  mode="ghost"
                />
                <Button
                  text={merging ? 'Merging...' : 'Merge Artists'}
                  onClick={handleMerge}
                  tone="critical"
                  disabled={merging || !mergeTargetId}
                />
              </Flex>
            </Stack>
          </Box>
        </Dialog>
      )}
    </Card>
  );
}
