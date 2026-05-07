import { Router, Request, Response } from 'express';
import { getRecords } from './middleware';
import {
  createSnapshot,
  getSnapshot,
  listSnapshots,
  deleteSnapshot,
  clearSnapshots,
  getSnapshotCount,
} from './snapshot';

export function createSnapshotRouter(): Router {
  const router = Router();

  // List all snapshots
  router.get('/', (_req: Request, res: Response) => {
    const snaps = listSnapshots().map(({ id, label, createdAt, records }) => ({
      id,
      label,
      createdAt,
      recordCount: records.length,
    }));
    res.json({ count: getSnapshotCount(), snapshots: snaps });
  });

  // Create a snapshot from current records
  router.post('/', (req: Request, res: Response) => {
    const label: string | undefined = req.body?.label;
    const records = getRecords();
    if (records.length === 0) {
      res.status(400).json({ error: 'No records to snapshot' });
      return;
    }
    const snap = createSnapshot(records, label);
    res.status(201).json({
      id: snap.id,
      label: snap.label,
      createdAt: snap.createdAt,
      recordCount: snap.records.length,
    });
  });

  // Get a specific snapshot
  router.get('/:id', (req: Request, res: Response) => {
    const snap = getSnapshot(req.params.id);
    if (!snap) {
      res.status(404).json({ error: 'Snapshot not found' });
      return;
    }
    res.json(snap);
  });

  // Delete a specific snapshot
  router.delete('/:id', (req: Request, res: Response) => {
    const deleted = deleteSnapshot(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Snapshot not found' });
      return;
    }
    res.json({ success: true });
  });

  // Clear all snapshots
  router.delete('/', (_req: Request, res: Response) => {
    clearSnapshots();
    res.json({ success: true });
  });

  return router;
}
