# routewatch

Lightweight Express middleware for logging and visualizing API route usage in dev.

## Installation

```bash
npm install routewatch
```

## Usage

```typescript
import express from "express";
import { routewatch } from "routewatch";

const app = express();

// Add routewatch middleware before your routes
app.use(routewatch());

app.get("/users", (req, res) => {
  res.json({ users: [] });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

Once your server is running, routewatch will log incoming requests to the console and track usage stats per route. By default, a summary is printed on process exit.

### Options

```typescript
app.use(
  routewatch({
    logLevel: "verbose", // 'minimal' | 'verbose' (default: 'minimal')
    showSummary: true,   // print route summary on exit (default: true)
    ignore: ["/health"], // routes to exclude from tracking
  })
);
```

### Output Example

```
[routewatch] GET /users        200  12ms
[routewatch] POST /users       201  34ms
[routewatch] GET /users/:id    404  5ms

Route Summary:
  GET  /users        → 1 hit  | avg 12ms
  POST /users        → 1 hit  | avg 34ms
  GET  /users/:id    → 1 hit  | avg 5ms
```

## License

MIT