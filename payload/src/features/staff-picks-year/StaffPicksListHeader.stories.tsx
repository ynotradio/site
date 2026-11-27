/* eslint-disable import/no-extraneous-dependencies */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { StaffPicksListHeader } from './StaffPicksListHeader';

const year = new Date().getFullYear();

const stubFetch = (body: object) => {
  window.fetch = async () => new Response(JSON.stringify(body));
};

const meta = {
  title: 'Features/Staff Picks/StaffPicksListHeader',
  component: StaffPicksListHeader,
  parameters: { layout: 'padded', nextjs: { appDirectory: true } },
} satisfies Meta<typeof StaffPicksListHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('button', {
        name: `Start ${year} picks from last year's staff`,
      }),
    ).toBeEnabled();
  },
};

export const Started: Story = {
  play: async ({ canvasElement }) => {
    stubFetch({
      fromYear: year - 1,
      toYear: year,
      created: 27,
      skipped: 0,
    });
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button'));
    await expect(await canvas.findByRole('status')).toHaveTextContent(
      `Added 27 staff from ${year - 1} to ${year}. Open each one to enter their picks.`,
    );
  },
};
