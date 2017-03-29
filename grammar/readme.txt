Grammar files will be automatically created here in this folder with the data
provided in data folder.

NOTE: This folder is intentionally named "grammar" (not "grammars" as it should've).
Atom loads the .cson files in "grammars" directory automatically at startup.
Since I want them loaded only by the package script instead, I've changed the folder
name to "grammar" so Atom won't see their existence and bother loading them
causing race conditions and them being loaded twice sometimes.
