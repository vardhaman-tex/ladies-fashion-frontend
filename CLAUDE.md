@AGENTS.md

# Working in this repo

## Always pull before making changes

Run `git fetch` before you start work, and again before cutting a branch.

Comparing a local branch against its `origin/...` ref proves only that they
agreed *as of the last fetch* — a remote-tracking ref is a cache, not a live
reading. Branching off a stale base is silent: everything merges, and the
regression only surfaces when a conflict resolution quietly reverts work that
was already merged upstream.

So, before starting:

```
git fetch --all --prune
git log --oneline <local-branch>..origin/<base-branch>   # empty = actually current
```

Cut branches from the remote ref (`git checkout -b my-work origin/feature/x`),
not from a local branch you assume is current.

When a conflict does come up, resolve it by re-applying your change on top of
the incoming version. Never resolve by taking your whole side of the file —
that is how upstream work gets deleted.
