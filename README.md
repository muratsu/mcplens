<img width="1392" alt="image" src="https://github.com/user-attachments/assets/18f181e2-d4eb-44bd-8c5a-a26f909c70bd" />

## Get started

Follow these steps to get started:

1. After clone run `npm install`
3. Start application in development mode by `npm start`.
 
That's all you need. 😉

## Known issues

1. If you're using `npx mcp/server` for invoking the mcp server, the first call will take a long time. The follow up calls will be faster because of cache. Currently there is no loading indicator.  
2. I'm currently using deprecated mastra memory (`import { Memory } from "@mastra/memory";`), I need to follow the instructions to migrate.
3. When you add/change your openapi key, it does not get propagated. You need to restart the application.
4. Currently only stdio mcp servers are supported SSE+Streaming HTTP will be added later.
