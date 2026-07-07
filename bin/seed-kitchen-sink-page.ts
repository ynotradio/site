/* eslint-disable no-console */
import { getPayloadHMR } from '@payloadcms/next/utilities';
import config from '@payload-config';
import { assertNotConnectedToProd } from './migrations/shared/payloadClient';

/**
 * Seeds (or updates in place) a single "Kitchen Sink QA" Page covering every
 * Lexical node type Pages.ts's editor config registers — the same set as
 * bin/seed-kitchen-sink-post.ts plus paypalButton/paypalSmartButtons, which
 * are only registered on Pages, not Posts. Also covers every legacy HTML
 * artifact ConvertsLexicalToHtml.php recovers (nbsp, <font size 1-5>, <hr>,
 * malformed b/i/em/u, hidden comments). Mirrors the fixture in
 * src/tests/Models/Concerns/ConvertsLexicalToHtmlTest.php's
 * testKitchenSinkDocumentConvertsEveryNodeTypeAndLegacyArtifact — keep the
 * two in sync when either changes.
 *
 * Purpose: visual QA. After changing the Lexical editor config or the PHP
 * renderer, run this and eyeball the rendered page (via PostgresCustomText)
 * or the admin editor, rather than authoring test content by hand each time.
 *
 * Usage: yarn tsx bin/seed-kitchen-sink-page.ts
 */

const TITLE = 'Kitchen Sink QA — Pages Lexical Nodes + Legacy Artifacts';
const SLUG = 'kitchen-sink-qa';

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
            {
              type: 'block',
              fields: { blockType: 'paypalButton', hostedButtonId: '5EHFMBVNYRVA8' },
            },
          ],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'block',
              fields: {
                blockType: 'paypalSmartButtons',
                orderDescription: 'Pick a tier',
                items: [{ label: 'Tier One', price: 1 }],
              },
            },
          ],
        },
        {
          type: 'paragraph',
          children: [
            { type: 'text', text: '<!--Hidden legacy note.-->Visible after: ' },
            { type: 'text', text: 'Lime Garden' },
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
    collection: 'pages',
    where: { slug: { equals: SLUG } },
    limit: 1,
  });

  const data = {
    title: TITLE,
    slug: SLUG,
    generateSlug: false,
    content,
    _status: 'published' as const,
  };

  if (existing.docs.length > 0) {
    await payload.update({ collection: 'pages', id: existing.docs[0].id, data });
    console.log(
      `✅ Updated existing Kitchen Sink QA page (id ${existing.docs[0].id}, slug: ${SLUG})`,
    );
  } else {
    const created = await payload.create({ collection: 'pages', data });
    console.log(`✅ Created Kitchen Sink QA page (id ${created.id}, slug: ${SLUG})`);
  }

  console.log(
    "   Visit it via PostgresCustomText's permalink route, or in /admin to eyeball the rendered HTML.",
  );

  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  console.error(JSON.stringify(error?.cause?.errors ?? error?.data?.errors, null, 2));
  process.exit(1);
});
