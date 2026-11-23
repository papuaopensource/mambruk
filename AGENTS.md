# Mambruk Agent Guide

This guide applies to the whole repository. Use it as the main context when
analysing, changing and verifying the code.

The content is split across `.agent/`. Read the first four files before changing
code; read the others when the task touches their topic.

| File                                                       | Holds                                                                 |
| ---------------------------------------------------------- | --------------------------------------------------------------------- |
| [.agent/project.md](.agent/project.md)                     | Stack, repository layout, environment variables, development commands |
| [.agent/architecture.md](.agent/architecture.md)           | URL namespace, request flow, bindings, auth, how to add a route       |
| [.agent/code-style.md](.agent/code-style.md)               | Ponytail, language, tooling, formatting                               |
| [.agent/code-conventions.md](.agent/code-conventions.md)   | Comment conventions                                                   |
| [.agent/commit.md](.agent/commit.md)                       | Commit, branch and pull request rules                                 |
| [.agent/security.md](.agent/security.md)                   | Secrets, OAuth, URL validation, ownership checks                      |
| [.agent/testing.md](.agent/testing.md)                     | Tests and verification before finishing a change                      |
| [.agent/database.md](.agent/database.md)                   | D1 schema, migrations, seeding                                        |
| [.agent/change-discipline.md](.agent/change-discipline.md) | Limits on changes                                                     |

Work as a critical peer: question weak claims and give a recommendation.

Notes for one checkout, such as account names and team preferences, live in the
gitignored `.local/`. If `.local/AGENTS.md` exists, read it too. Nothing in a
committed file may depend on it.
