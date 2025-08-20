# Sample MCP

## Setup

```sh
# build
pnpm build

# lint
pnpm lint
```

## Use

```sh
# 1
pnpm build && npm pack

# 2
cd examples

# 3
pnpm reinstall

# 4
claude --mcp-config=.claude/mcp.json
```
