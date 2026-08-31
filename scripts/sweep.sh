#!/bin/sh
# One sweep, published. Run it with `make jobs` whenever you want the list at
# /cv/jobs/ refreshed — there is no schedule and nothing runs on its own.
#
# It stops after `publish`. The rest of the skill — shortlist, fetch, and the
# tiering that is the actual value — needs somebody to read descriptions and
# decide, so it is not something a script does. What this produces is the
# ranked sweep with what is new since the last one flagged.
#
# It deliberately does not run under launchd. macOS grants access to
# ~/Documents per responsible process: a terminal has that grant and everything
# it starts inherits it, which is why this works when you run it. A LaunchAgent
# is its own responsible process and starts with nothing, and the grant does not
# cover the whole tree — /bin/sh can be allowed while the go it calls is still
# refused. See docs/adr/0006.

set -eu

REPO=$(cd "$(dirname "$0")/.." && pwd)
SKILL="$REPO/.claude/skills/job-sweep"

for tool in go git agent-browser; do
	command -v "$tool" >/dev/null 2>&1 || {
		echo "sweep: $tool is not on PATH" >&2
		[ "$tool" = agent-browser ] &&
			echo "  install with: npm install -g agent-browser && agent-browser install" >&2
		exit 1
	}
done

cd "$SKILL"

# The binary is gitignored, so a fresh clone has none. Building is seconds and
# needs no network — the tool is stdlib only.
go build -o jobsweep .

./jobsweep sweep
./jobsweep score -mark-seen -new-only -limit 30
./jobsweep publish

cd "$REPO"

DAY=$(date +%F)
FILE="content/jobs/$DAY.json"

if git diff --quiet -- "$FILE" && [ -z "$(git status --porcelain -- "$FILE")" ]; then
	echo
	echo "sweep: nothing changed for $DAY, nothing committed"
	exit 0
fi

# Only ever the day's file. A sweep run while something else was being edited
# must not sweep that into the commit as well.
git add -- "$FILE"
git commit -q -m "Sweep for $DAY"

echo
echo "sweep: committed $FILE on $(git rev-parse --abbrev-ref HEAD)"
echo "       \`git push\` to put it on the page"
