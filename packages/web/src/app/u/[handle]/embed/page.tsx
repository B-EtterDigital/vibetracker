import type { Metadata } from "next";
import ProfilePage from "../page";

// The EMBED face of a public usage profile: the exact same page body, with the
// VibeUsage site chrome (ticker, header, footer, toolbar dock, C0VIBE band,
// flip button) suppressed so C0VIBE can frame it 1:1 inside the /u/ profile's
// "Vibe Usage" tab. Never linked from the site itself; parents are limited by
// the frame-ancestors policy in netlify.toml.
export const revalidate = 60;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const EMBED_CHROME_CSS = `
  .vticker-strip, .hdr, .ftr, .vflip-btn, .vjoin,
  [class*="vtooldock"] { display: none !important; }
  .wrap { padding-top: 10px !important; }
`;

// Internal links inside the frame open a full VibeUsage tab instead of
// navigating the embedded frame onto chrome-ful pages.
const EMBED_LINK_SCRIPT = `
  document.addEventListener('click', function (event) {
    var anchor = event.target && event.target.closest ? event.target.closest('a') : null;
    if (anchor && !anchor.target) anchor.target = '_blank';
  }, true);
`;

export default async function EmbeddedProfile(props: { params: Promise<{ handle: string }> }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: EMBED_CHROME_CSS }} />
      <script dangerouslySetInnerHTML={{ __html: EMBED_LINK_SCRIPT }} />
      {await ProfilePage(props)}
    </>
  );
}
