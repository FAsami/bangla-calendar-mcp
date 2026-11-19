# bangla-calendar-mcp

[![CI](https://github.com/FAsami/bangla-calendar-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/FAsami/bangla-calendar-mcp/actions/workflows/ci.yml)

An [MCP](https://modelcontextprotocol.io) server that gives AI agents reliable answers about Bangladesh:
the official Bengali calendar, fixed national days, the 64 districts, and mobile numbers.
It comes with an **eval** that measures how much the tools help, against the same model without them.

Language models often get Bengali calendar conversion wrong. Bangladesh uses its own revised calendar,
which differs from the one used in West Bengal, so a model that half-remembers either one ends up off by a
day or a month. This server computes the answer instead.

## Tools

| Tool | What it does |
| --- | --- |
| `gregorian_to_bangla` | `2025-12-16` → 1 Poush 1432, Sheet (winter), Tuesday, `১ পৌষ ১৪৩২` |
| `bangla_to_gregorian` | 8 Falgun 1432 → `2026-02-21` (month as 1-12, English, or Bengali script) |
| `bd_national_days` | Fixed-date national days for a year, with weekday and Bengali date |
| `bd_district` | District → division, accepting old spellings (Comilla, Jessore, Bogra…), or all 64 |
| `bd_mobile_number` | Validates a number in any format and returns its operator and E.164 form |
| `to_bangla_digits` | `2026` → `২০২৬` |

All tools are read-only and need no network or API key.

## Use it

**Claude Code**

```bash
claude mcp add bangla-calendar -- npx -y github:FAsami/bangla-calendar-mcp
```

**Claude Desktop and other MCP clients** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "bangla-calendar": {
      "command": "npx",
      "args": ["-y", "github:FAsami/bangla-calendar-mcp"]
    }
  }
}
```

## Calendar rules

Bangladesh's calendar follows the Bangla Academy's 2019 revision:

- The year starts on **14 April** (Pohela Boishakh). Bengali year = Gregorian year − 593 from 14 April.
- **Boishakh to Ashshin** (months 1–6) have **31 days**.
- **Falgun** has **29 days**, or **30** in a Gregorian leap year.
- Every other month has **30 days**.

These rules keep national days on fixed Bengali dates: 21 February = 8 Falgun, 26 March = 12 Choitro,
16 December = 1 Poush. The tests check those anchors, historical weekdays (21 February 1952 and
16 December 1971 were both Thursdays), and a round trip through every day from 1990 to 2060.

## Eval

`eval/` asks Claude 50 questions twice, once **without tools** and once **with this server's tools**,
using the same system prompt. Answers are graded by code, not by another model, so runs are reproducible.

| Question type | Count | Example |
| --- | --- | --- |
| Gregorian → Bengali | 20 | What is the Bengali date for 2026-03-16? |
| Bengali → Gregorian | 12 | Which Gregorian date is 29 Ashshin 1431? |
| Weekday of a Bengali date | 6 | On which weekday does 1 Joishtho 1435 fall? |
| District → division | 6 | Which division is "Jessore" in? |
| Mobile operator | 6 | Which operator does +880 1912 345678 belong to? |

```bash
export ANTHROPIC_API_KEY=...         # or sign in with `ant auth login`
pnpm eval -- --limit 5               # quick trial
pnpm eval                            # all 50; prints a Markdown table
EVAL_MODEL=claude-haiku-5-5 pnpm eval   # compare a smaller model
```

### Results

_Not run yet: results will be added here with the model, effort level and date._

Expected answers come from the same code the tools use. That code is pinned to the official anchor
dates above by the tests, but the eval measures whether the agent **uses** the tools correctly, not whether
the calendar rules themselves are right.

## Limits

- Lunar holidays (the two Eids, Shab-e-Barat, Ashura, Eid-e-Milad-un-Nabi) depend on moon sighting and are
  not included. Check the government's yearly holiday list for those.
- The calendar rules apply from 1426 BS (2019) onwards. Dates before 2019 are converted with the same rules,
  which may differ by a day from what was printed at the time.

## Development

```bash
pnpm install
pnpm test        # Vitest
pnpm typecheck
pnpm build && pnpm start
```

MIT licensed.
