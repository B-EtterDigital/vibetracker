import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  fetchGitHubContributorPulse,
  type GitHubFetcher,
} from "../../app/contributors/contributor-pulse.ts";

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("GitHub contributor pulse parses public repository truth and excludes pull requests", async () => {
  const calls: string[] = [];
  const fetcher: GitHubFetcher = async (url, init) => {
    calls.push(url);
    assert.equal(init.next?.revalidate, 900);
    if (url.endsWith("/contributors?per_page=20")) {
      return response([
        { login: "B-EtterDigital", contributions: 4 },
        { login: "cyrill-etter", contributions: 2 },
        { login: "", contributions: 99 },
      ]);
    }
    if (url.includes("/issues?")) {
      return response([
        { number: 17, title: "Add an export adapter", labels: [{ name: "adapter" }], updated_at: "2026-07-14T20:00:00Z" },
        { number: 18, title: "Open pull request", pull_request: {}, labels: [], updated_at: "2026-07-14T21:00:00Z" },
      ]);
    }
    return response({
      default_branch: "main",
      open_issues_count: 2,
      stargazers_count: 3,
      forks_count: 1,
      pushed_at: "2026-07-14T23:31:48Z",
    });
  };

  const pulse = await fetchGitHubContributorPulse(fetcher);

  assert.equal(calls.length, 3);
  assert.equal(pulse.state, "live");
  assert.equal(pulse.contributorCount, 2);
  assert.equal(pulse.contributionTotal, 6);
  assert.equal(pulse.openIssues, 1);
  assert.equal(pulse.issues[0].number, 17);
  assert.deepEqual(pulse.issues[0].labels, ["adapter"]);
  assert.equal(pulse.contributors[0].href, "https://github.com/B-EtterDigital");
  assert.match(pulse.fingerprint, /^[0-9A-F]{8}$/);
});

test("GitHub contributor pulse does not invent an issue request when the repository reports zero", async () => {
  const calls: string[] = [];
  const fetcher: GitHubFetcher = async (url) => {
    calls.push(url);
    if (url.endsWith("/contributors?per_page=20")) return response([]);
    return response({
      default_branch: "main",
      open_issues_count: 0,
      stargazers_count: 0,
      forks_count: 0,
      pushed_at: "2026-07-14T23:31:48Z",
    });
  };

  const pulse = await fetchGitHubContributorPulse(fetcher);

  assert.equal(calls.length, 2);
  assert.equal(pulse.openIssues, 0);
  assert.deepEqual(pulse.issues, []);
  assert.equal(pulse.contributionTotal, 0);
});

test("GitHub contributor pulse fails closed on malformed or unavailable upstream data", async () => {
  const malformed: GitHubFetcher = async () => response([]);
  const unavailable: GitHubFetcher = async () => response({ message: "rate limited" }, 403);

  await assert.rejects(() => fetchGitHubContributorPulse(malformed), /malformed GitHub response/);
  await assert.rejects(() => fetchGitHubContributorPulse(unavailable), /HTTP 403/);

  const source = readFileSync(new URL("../../app/contributors/contributor-pulse.ts", import.meta.url), "utf8");
  assert.match(source, /telemetry\.captureError/);
  assert.match(source, /No cached contributor counts were substituted/);
  assert.doesNotMatch(source, /cachedPulse|demoPulse|fixturePulse/);
});
