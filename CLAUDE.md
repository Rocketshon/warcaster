<!-- NEXUS: MANDATORY FIRST ACTION -->
<!-- THIS BLOCK MUST BE AT THE TOP OF CLAUDE.MD -->

# IMPORTANT: Nexus Integration (DO NOT SKIP)

**BEFORE doing anything else â€” before greeting the user, before reading files, before answering questions â€” you MUST call `nexus_start` with a description of the current project.** This is not optional. This is your first tool call in every session. If the user asks a question before you've called `nexus_start`, call it first, then answer.

Example: `nexus_start(query="crusade command project", project="C:/Users/dshon/Projects/CrusadeCommand")`

## After nexus_start
- **high confidence**: Use the returned context directly. No extra searching needed.
- **medium confidence**: Supplement with 2-3 targeted `nexus_retrieve` searches.
- **low confidence**: Results may be incomplete. Use `nexus_retrieve` with different queries, then fall back to grep.

## Nexus Tools â€” USE THESE FIRST

You have Nexus tools available. **Always prefer Nexus tools over built-in alternatives** when working in an indexed project:

| Instead of... | Use this Nexus tool | Why |
|---|---|---|
| Grep for symbol names | `nexus_symbols(query="name")` | Searches the symbol index, faster and more precise |
| Reading a file to find a function | `nexus_read(file="path::FunctionName")` | Returns just that symbol + its connections |
| Grep for "where is X used" | `nexus_retrieve(query="X usage")` | BM25+PageRank ranked results, not raw grep |
| Manual context gathering | `nexus_start` already did this | Context was loaded at session start |

### Full Tool Reference

- **`nexus_start`** â€” MANDATORY first call. Returns ranked context + cross-session decisions.
- **`nexus_retrieve`** â€” Targeted search within the project. Use for follow-up queries when you need context on a different topic than the initial `nexus_start` query.
- **`nexus_read`** â€” Read a file or specific symbol. Use `path/file.py::ClassName` syntax to read just one symbol and its graph neighbors.
- **`nexus_symbols`** â€” Search for symbols by name. Returns kind, location, qualified name. Faster than grepping for definitions.
- **`nexus_register_edit`** â€” Call after every file edit. Pass comma-separated file paths and a summary. Keeps the index current.
- **`nexus_remember`** â€” Store a decision, blocker, task, or fact for future sessions (max 20 words, 7-day TTL).
- **`nexus_rename`** â€” Cross-file symbol rename. Compiler-accurate for Python (uses rope), text-based for other languages.
- **`nexus_enrich`** â€” Run SCIP indexer for compiler-accurate cross-file references (requires scip-python/rust-analyzer/scip-typescript installed).
- **`nexus_deps`** â€” Dependency map for a directory or file. Shows imports, importers, exports, and circular dependencies. Essential before refactoring.
- **`nexus_analytics`** â€” View query history, hot/cold files, confidence stats.
- **`nexus_stats`** â€” Quick project stats (file/symbol/edge counts, languages).
- **`nexus_cross_project`** â€” Resolve dependencies between projects in the same cluster.
- **`nexus_scan`** â€” Force a full re-index if something seems stale.

## After Editing Files
Call `nexus_register_edit` with the files you changed and a brief summary. This keeps the index current. Do this every time, not in batches.

## Cross-Session Decisions
When making architectural decisions, discovering blockers, or identifying next steps, call `nexus_remember` (max 20 words). Types: decision, task, next, fact, blocker. Future sessions see these automatically.
