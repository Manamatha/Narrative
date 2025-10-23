Important: sensitive keys were detected in the repository's committed `.env` file.

Immediate recommended steps:

1. Rotate any exposed keys immediately (OpenAI API key, database passwords / Supabase keys).
2. Remove the committed `.env` from the repository's future commits and local working tree:
   - Add `.env` to `.gitignore` (already added).
   - Run locally: git rm --cached .env; commit and push.
3. If the secret was committed to any public or shared remote, consider purging it from history with a tool such as `git filter-repo` or `bfg` and then push force (be careful: rewriting history affects collaborators).
4. After rotating keys, create a fresh local `.env` from `.env.example` and do NOT commit it.

If you want, I can prepare exact commands for rotating and safely removing the file from git history for Windows PowerShell.
