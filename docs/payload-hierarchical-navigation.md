# Payload CMS Hierarchical Navigation

## Overview

This document describes the hierarchical navigation structure implemented in Payload CMS to improve the content management experience.

## Implementation

All collections in the Payload CMS admin panel are now organized into logical groups using the `admin.group` property. This creates a hierarchical navigation structure in the sidebar, making it easier for content managers to find and navigate between related collections.

## Collection Groups

The collections are organized into the following groups:

### 📄 Content
- **Media** - Images and media files
- **Posts** - Blog posts and news articles

### 📻 Radio
- **DJs** - Radio show hosts and their profiles
- **Shows** - Radio show schedule and episodes
- **OnDemand** - On-demand audio content

### 🎵 Music
- **Artists** - Musicians and bands
- **Songs** - Individual tracks
- **Records** - Albums and releases
- **CD of the Week** - Featured album reviews

### 🎫 Events
- **Venues** - Concert and event locations
- **Concerts** - Upcoming and past concerts

### 👥 People
- **Users** - System users and administrators
- **People** - General people profiles

### 📢 Marketing
- **Ads** - Advertisements and sponsors

## Benefits

1. **Improved Organization**: Related collections are grouped together, reducing cognitive load
2. **Faster Navigation**: Content managers can quickly locate the collection they need
3. **Better User Experience**: The hierarchical structure matches the mental model of radio station content
4. **Scalability**: New collections can easily be added to existing groups or new groups can be created

## Technical Details

Each collection's `admin` configuration includes a `group` property:

```typescript
export const DJs: CollectionConfig = {
  slug: 'djs',
  admin: {
    useAsTitle: 'showName',
    defaultColumns: ['showName', 'person', 'onAir', 'updatedAt'],
    group: 'Radio', // <-- Hierarchical navigation group
  },
  // ... rest of configuration
};
```

## Future Enhancements

Possible future improvements:
- Add icons to groups for better visual distinction
- Allow collapsible groups for frequently used collections
- Add search within groups
- Customize group order based on user roles
