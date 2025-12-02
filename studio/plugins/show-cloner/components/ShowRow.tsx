// Component for displaying a show row
import React from 'react';
import { Text, Flex } from '@sanity/ui';
import { ShowRowProps } from '../types';

// Helper to get display name for a show
const getShowDisplayName = (show: Pick<Show, 'name' | 'djName'>): string => {
  if (show.name && show.djName) {
    return `${show.name} w/ ${show.djName}`;
  }
  if (show.djName) {
    return show.djName;
  }
  if (show.name) {
    return show.name;
  }
  return 'Untitled Show';
};

export const ShowRow = ({ show }: ShowRowProps) => {
  const style = {
    padding: '8px 12px',
    margin: '4px 0',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    background: '#fff',
  };

  const displayName = getShowDisplayName(show);

  return (
    <Flex style={style} align="center" justify="space-between">
      <Text size={1} weight="semibold">
        {displayName}
        {show.note && <span style={{ fontWeight: 'normal', marginLeft: '8px' }}>- {show.note}</span>}
      </Text>
      <Text size={1} muted>
        {show.startTime} - {show.endTime}
      </Text>
    </Flex>
  );
};

export default ShowRow;
