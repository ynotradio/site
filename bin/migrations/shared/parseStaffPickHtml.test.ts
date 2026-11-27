import { describe, expect, it } from 'vitest';
import { parseStaffPickHtml } from './parseStaffPickHtml';

const joey = `<table class="year_end_staff_pick">
  <tr>
    <td colspan="2" class="bottom-spacer_20">
      <div style="float: left;">
        <strong>Joey O.</strong>
      </div>
      <div style="float: right;">
        <strong>Music Director</strong><br>
        <strong>Thursdays 4-9pm</strong>
      </div>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3><u>Top 20 Songs</u></h3>
      <ol>
<li>	Wet Leg	"Catch These Fists"	</li>
<li>	Nine Inch Nails	"As Alive As You Need Me To Be"	</li>
      </ol>
    </td>
<td width="50%">
     <h3><u>Top 10 Albums</u></h3>
      <ol>
<li>	Wet Leg	- <i>	moisturizer	</i></li>
<li>	HAIM	- <i>	I quit	</i></li>
     </ol>
<br><br>
<iframe width="100%" height="60" src="https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&hide_artwork=1&feed=%2Fynotradio%2Fjoey-os-top-20-of-2025%2F" frameborder="0"></iframe>
    </td>
  </tr>
</table>`;

const shana = `<table class="year_end_staff_pick"><tr><td colspan="2">
  <div style="float: left;"><strong>Shana<br><em>Aussie Unlocked</em></strong></div>
  <div style="float: right;"><strong>Host</strong></div>
</td></tr><tr><td><h3><u>Top 20 Songs</u></h3><ol><li>Ratboys "Anywhere"</li></ol></td></tr></table>`;

const hannah = `<table class="year_end_staff_pick"><tr><td colspan="2">
  <div style="float: left;"><b>Hannah<br><i>Y-Not Philly</i></b></div>
  <div style="float: right;"><b>Mondays 1-5pm<br>Wednesdays 11am & 10pm</b></div>
</td></tr><tr><td>
<iframe src="https://player-widget.mixcloud.com/widget/iframe/?mini=1&feed=%2Fynotradio%2Fhannahs-top-20-of-2025%2F"></iframe>
<iframe src="https://player-widget.mixcloud.com/widget/iframe/?mini=1&feed=%2Fynotradio%2Fy-not-philly-121025%2F"></iframe>
<iframe src="https://www.youtube.com/embed/abc"></iframe>
</td></tr></table>`;

describe('parseStaffPickHtml', () => {
  it('reads the name, role lines, ranked lists and Mixcloud show', () => {
    expect(parseStaffPickHtml(joey)).toEqual({
      hidden: false,
      name: 'Joey O.',
      showName: '',
      details: 'Music Director\nThursdays 4-9pm',
      mixcloudUrls: 'https://www.mixcloud.com/ynotradio/joey-os-top-20-of-2025/',
      songs: [
        { artist: 'Wet Leg', title: 'Catch These Fists' },
        { artist: 'Nine Inch Nails', title: 'As Alive As You Need Me To Be' },
      ],
      albums: [
        { artist: 'Wet Leg', title: 'moisturizer' },
        { artist: 'HAIM', title: 'I quit' },
      ],
      warnings: [],
    });
  });

  it('splits the show name out of the name', () => {
    const pick = parseStaffPickHtml(shana);
    expect(pick.name).toBe('Shana');
    expect(pick.showName).toBe('Aussie Unlocked');
    expect(pick.details).toBe('Host');
    expect(pick.mixcloudUrls).toBe('');
    expect(pick.albums).toEqual([]);
  });

  it('handles <b>/<i> markup, multi-line roles and several players', () => {
    const pick = parseStaffPickHtml(hannah);
    expect(pick.name).toBe('Hannah');
    expect(pick.showName).toBe('Y-Not Philly');
    expect(pick.details).toBe('Mondays 1-5pm\nWednesdays 11am & 10pm');
    expect(pick.mixcloudUrls).toBe(
      'https://www.mixcloud.com/ynotradio/hannahs-top-20-of-2025/\nhttps://www.mixcloud.com/ynotradio/y-not-philly-121025/',
    );
    expect(pick.warnings).toEqual(['1 non-Mixcloud player(s) skipped']);
  });

  it('flags blocks commented out on the legacy page as hidden but still parses them', () => {
    const pick = parseStaffPickHtml(`<!--${shana}-->`);
    expect(pick.hidden).toBe(true);
    expect(pick.name).toBe('Shana');
  });

  it('warns when there is no name', () => {
    expect(parseStaffPickHtml('<p>nothing here</p>').warnings).toContain('no name found');
  });
});
