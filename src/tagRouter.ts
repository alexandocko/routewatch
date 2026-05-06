import { Router, Request, Response } from 'express';
import { getRecords } from './middleware';
import { applyTags, groupByTag, listTags, TagMap } from './tag';

/**
 * Creates an Express router that exposes tagging endpoints.
 *
 * The caller supplies a tagMap so that the router can be configured
 * once at startup and reused across requests.
 *
 * Routes:
 *   GET /tags          — list all active tags
 *   GET /tags/:tag     — records belonging to a specific tag
 *   GET /tags/grouped  — all records grouped by tag
 */
export function createTagRouter(tagMap: TagMap): Router {
  const router = Router();

  function getTagged() {
    return applyTags(getRecords(), tagMap);
  }

  // List all tags present in current records
  router.get('/tags', (_req: Request, res: Response) => {
    const tagged = getTagged();
    const tags = listTags(tagged);
    res.json({ tags });
  });

  // All records grouped by tag
  router.get('/tags/grouped', (_req: Request, res: Response) => {
    const tagged = getTagged();
    const groups = groupByTag(tagged);
    res.json({ groups });
  });

  // Records for a specific tag
  router.get('/tags/:tag', (req: Request, res: Response) => {
    const { tag } = req.params;
    const tagged = getTagged();
    const groups = groupByTag(tagged);
    const records = groups[tag] ?? [];
    if (records.length === 0 && !Object.keys(groups).includes(tag)) {
      res.status(404).json({ error: `Tag "${tag}" not found` });
      return;
    }
    res.json({ tag, records });
  });

  return router;
}
