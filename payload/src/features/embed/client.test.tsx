// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { render, screen } from '@testing-library/react';
import { EmbedComponent } from './client';
import { describe, it, expect, vi } from 'vitest';
import * as utils from './utils';

describe('EmbedComponent', () => {
  describe('YouTube Embeds', () => {
    it('should render YouTube embed with correct URL', () => {
      const { container } = render(
        <EmbedComponent url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />,
      );

      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe).toBeInTheDocument();
      expect(iframe.src).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should render YouTube short URL', () => {
      const { container } = render(<EmbedComponent url="https://youtu.be/dQw4w9WgXcQ" />);

      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.src).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });
  });

  describe('Vimeo Embeds', () => {
    it('should render Vimeo embed with correct URL', () => {
      const { container } = render(<EmbedComponent url="https://vimeo.com/123456789" />);

      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe).toBeInTheDocument();
      expect(iframe.src).toBe('https://player.vimeo.com/video/123456789');
    });
  });

  describe('Spotify Embeds', () => {
    it('should render Spotify track embed', () => {
      const { container } = render(
        <EmbedComponent url="https://open.spotify.com/track/abc123xyz" />,
      );

      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.src).toBe('https://open.spotify.com/embed/track/abc123xyz');
    });

    it('should render Spotify album embed', () => {
      const { container } = render(
        <EmbedComponent url="https://open.spotify.com/album/def456uvw" />,
      );

      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.src).toBe('https://open.spotify.com/embed/album/def456uvw');
    });
  });

  describe('SoundCloud Embeds', () => {
    it('should render SoundCloud embed with correct URL', () => {
      const { container } = render(
        <EmbedComponent url="https://soundcloud.com/artist-name/track-name" />,
      );

      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.src).toBe(
        'https://w.soundcloud.com/player/?url=https://soundcloud.com/artist-name/track-name',
      );
    });
  });

  describe('Caption', () => {
    it('should render caption when provided', () => {
      render(
        <EmbedComponent url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" caption="Test Caption" />,
      );

      expect(screen.getByText('Test Caption')).toBeInTheDocument();
    });

    it('should not render caption element when not provided', () => {
      const { container } = render(
        <EmbedComponent url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />,
      );

      const caption = container.querySelector('.embed-caption');
      expect(caption).not.toBeInTheDocument();
    });

    it('should render caption with correct CSS class', () => {
      const { container } = render(
        <EmbedComponent url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" caption="Test Caption" />,
      );

      const caption = container.querySelector('.embed-caption');
      expect(caption).toBeInTheDocument();
      expect(caption?.textContent).toBe('Test Caption');
    });
  });

  describe('Iframe Attributes', () => {
    it('should have correct allow attributes', () => {
      const { container } = render(
        <EmbedComponent url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />,
      );

      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.getAttribute('allow')).toBe(
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
      );
    });

    it('should have allowFullScreen attribute', () => {
      const { container } = render(
        <EmbedComponent url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />,
      );

      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.allowFullscreen).toBe(true);
    });

    it('should use caption as title when provided', () => {
      const { container } = render(
        <EmbedComponent
          url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          caption="My Custom Title"
        />,
      );

      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.title).toBe('My Custom Title');
    });

    it('should use default title when caption not provided', () => {
      const { container } = render(
        <EmbedComponent url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />,
      );

      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.title).toBe('Embedded content');
    });
  });

  describe('CSS Classes', () => {
    it('should render with correct CSS classes', () => {
      const { container } = render(
        <EmbedComponent url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />,
      );

      expect(container.querySelector('.embed-container')).toBeInTheDocument();
      expect(container.querySelector('.embed-wrapper')).toBeInTheDocument();
      expect(container.querySelector('.embed-wrapper__iframe')).toBeInTheDocument();
    });
  });

  describe('Generic Embeds', () => {
    it('should handle generic URLs by passing them through', () => {
      const genericUrl = 'https://example.com/embed/12345';
      const { container } = render(<EmbedComponent url={genericUrl} />);

      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.src).toBe(genericUrl);
    });
  });

  describe('detectEmbedType Integration', () => {
    it('should call detectEmbedType with provided URL', () => {
      const spy = vi.spyOn(utils, 'detectEmbedType');
      const testUrl = 'https://www.youtube.com/watch?v=test123';

      render(<EmbedComponent url={testUrl} />);

      expect(spy).toHaveBeenCalledWith(testUrl, { hideCoverImage: undefined });
      spy.mockRestore();
    });
  });

  describe('Mixcloud cover image', () => {
    const mixcloudUrl = 'https://www.mixcloud.com/ynotradio/rodney-anonymous-6526/';

    it('should hide the cover image by default', () => {
      const { container } = render(<EmbedComponent url={mixcloudUrl} />);

      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.src).toContain('hide_cover=1');
    });

    it('should show the cover image when hideCoverImage is false', () => {
      const { container } = render(<EmbedComponent url={mixcloudUrl} hideCoverImage={false} />);

      const iframe = container.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe.src).toContain('hide_cover=0');
    });
  });
});
