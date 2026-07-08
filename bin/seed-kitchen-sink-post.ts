/* eslint-disable no-console */
import { getPayloadHMR } from '@payloadcms/next/utilities';
import config from '@payload-config';
import { assertNotConnectedToProd } from './migrations/shared/payloadClient';

/**
 * Seeds (or updates in place) a single "Kitchen Sink QA" Post covering every
 * Lexical node type Posts.ts's editor config actually registers, plus every
 * legacy HTML artifact ConvertsLexicalToHtml.php recovers (nbsp,
 * <font size 1-5>, <hr>, malformed b/i/em/u, hidden comments). Posts.ts only
 * registers EmbedFeature (not the PayPal blocks — those are Pages-only, see
 * bin/seed-kitchen-sink-page.ts), so this omits paypalButton/
 * paypalSmartButtons even though the PHP renderer supports them for any
 * collection. Mirrors the fixture in
 * src/tests/Models/Concerns/ConvertsLexicalToHtmlTest.php's
 * testKitchenSinkDocumentConvertsEveryNodeTypeAndLegacyArtifact — keep the
 * two in sync when either changes.
 *
 * Purpose: visual QA. After changing the Lexical editor config or the PHP
 * renderer, run this and eyeball the front page / admin editor for the
 * story it creates, rather than authoring test content by hand each time.
 *
 * Usage: yarn tsx bin/seed-kitchen-sink-post.ts
 */

const HEADLINE = 'Kitchen Sink QA — Posts Lexical Nodes + Legacy Artifacts';

async function seed() {
  assertNotConnectedToProd();

  const payload = await getPayloadHMR({ config });

  const content = {
    root: {
      type: 'root',
      children: [
        { type: 'heading', tag: 'h1', children: [{ type: 'text', text: 'Heading One' }] },
        { type: 'heading', tag: 'h2', children: [{ type: 'text', text: 'Heading Two' }] },
        { type: 'heading', tag: 'h3', children: [{ type: 'text', text: 'Heading Three' }] },
        { type: 'heading', tag: 'h4', children: [{ type: 'text', text: 'Heading Four' }] },
        { type: 'heading', tag: 'h5', children: [{ type: 'text', text: 'Heading Five' }] },
        { type: 'heading', tag: 'h6', children: [{ type: 'text', text: 'Heading Six' }] },
        {
          type: 'paragraph',
          children: [
            { type: 'text', text: 'Bold', format: 1 },
            { type: 'text', text: ' Italic', format: 2 },
            { type: 'text', text: ' Underline', format: 8 },
            { type: 'text', text: ' BoldItalic', format: 3 },
            { type: 'linebreak' },
            { type: 'text', text: 'Small state', $: { fontSize: 'small' } },
          ],
        },
        {
          type: 'paragraph',
          format: 'center',
          children: [{ type: 'text', text: 'Centered paragraph' }],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              fields: { url: 'https://example.com', linkType: 'custom' },
              children: [{ type: 'text', text: 'A link' }],
            },
            { type: 'text', text: ' and ' },
            {
              type: 'link',
              fields: { url: 'https://example.com/new-tab', newTab: true, linkType: 'custom' },
              children: [{ type: 'text', text: 'a new-tab link' }],
            },
          ],
        },
        {
          type: 'list',
          listType: 'bullet',
          children: [
            { type: 'listitem', children: [{ type: 'text', text: 'Bullet one' }] },
            { type: 'listitem', children: [{ type: 'text', text: 'Bullet two' }] },
          ],
        },
        {
          type: 'list',
          listType: 'number',
          children: [{ type: 'listitem', children: [{ type: 'text', text: 'Numbered one' }] }],
        },
        { type: 'quote', children: [{ type: 'text', text: 'A quotation' }] },
        { type: 'horizontalrule' },
        {
          type: 'table',
          children: [
            {
              type: 'tablerow',
              children: [
                {
                  type: 'tablecell',
                  headerState: 1,
                  children: [{ type: 'text', text: 'Header Cell' }],
                },
              ],
            },
            {
              type: 'tablerow',
              children: [{ type: 'tablecell', children: [{ type: 'text', text: 'Body Cell' }] }],
            },
          ],
        },
        {
          type: 'paragraph',
          children: [{ type: 'text', text: '[Table]\nRank | Artist\n1 | Sample Band' }],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'block',
              fields: { blockType: 'embed', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            },
          ],
        },
        {
          type: 'paragraph',
          children: [
            { type: 'text', text: '<!--Hidden legacy note.-->Visible after: ' },
            { type: 'text', text: 'Lime Garden' },
            { type: 'text', text: ' <font size=1>tiny</font> ' },
            { type: 'text', text: '<font size=2>small</font> ' },
            { type: 'text', text: '<font size=3>default</font> ' },
            { type: 'text', text: '<font size=4>large</font> ' },
            { type: 'text', text: '<font size=5>xlarge</font> ' },
            { type: 'text', text: '<hr /> ' },
            { type: 'text', text: '<b>recovered bold' },
            { type: 'text', text: '</b> <i>recovered italic' },
            { type: 'text', text: '</i> <u>recovered underline</u>' },
          ],
        },
      ],
    },
  };

  const existing = await payload.find({
    collection: 'posts',
    where: { headline: { equals: HEADLINE } },
    limit: 1,
  });

  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 10);

  const data = {
    headline: HEADLINE,
    content,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    priority: 999,
    showOnFrontPage: false,
    _status: 'published' as const,
  };

  if (existing.docs.length > 0) {
    await payload.update({ collection: 'posts', id: existing.docs[0].id, data });
    console.log(`✅ Updated existing Kitchen Sink QA post (id ${existing.docs[0].id})`);
  } else {
    const created = await payload.create({ collection: 'posts', data });
    console.log(`✅ Created Kitchen Sink QA post (id ${created.id})`);
  }

  console.log(
    '   showOnFrontPage is false — visit it directly in /admin to eyeball the rendered HTML,',
  );
  console.log('   or flip showOnFrontPage on to see it on the front page.');

  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  console.error(JSON.stringify(error?.cause?.errors ?? error?.data?.errors, null, 2));
  process.exit(1);
});
