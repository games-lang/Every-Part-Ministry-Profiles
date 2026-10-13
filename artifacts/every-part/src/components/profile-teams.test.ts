import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { Router } from "wouter";
import { getListTeamsQueryKey } from "@workspace/api-client-react";
import { ProfileTeams } from "./profile-teams";
import { readFileSync } from "node:fs";

function render(teamId: number | null, teams: unknown[] = []) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(getListTeamsQueryKey(), teams);
  return renderToStaticMarkup(createElement(QueryClientProvider, { client },
    createElement(Router, { ssrPath: "/profiles/1" }, createElement(ProfileTeams, { teamId })),
  ));
}

test("profile Teams section links only the current team, including archived membership", () => {
  const html = render(2, [
    { id: 1, name: "Other Team", isArchived: false },
    { id: 2, name: "Care & Connection", isArchived: true },
  ]);
  assert.match(html, /Teams/);
  assert.match(html, /href="\/teams#team-2"/);
  assert.match(html, /Care &amp; Connection/);
  assert.match(html, /Archived/);
  assert.doesNotMatch(html, /Other Team/);
  assert.match(html, /no-print/);
});

test("profile Teams section gives an explicit empty or unavailable membership state", () => {
  assert.match(render(null), /No current team assignment/);
  assert.match(render(9), /Team membership is unavailable/);
  assert.match(render(9), /href="\/teams"/);
});

test("assigning from Teams refreshes a previously visited full profile's current team", () => {
  const teams = readFileSync(new URL("../pages/teams.tsx", import.meta.url), "utf8");
  assert.match(teams, /invalidateQueries\(\{ queryKey: getGetProfileQueryKey\(selectedProfile\.id\) \}\)/);
});
