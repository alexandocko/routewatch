import { RouteRecord } from "./types";

export type PipelineStage = {
  name: string;
  transform: (records: RouteRecord[]) => RouteRecord[];
};

export type Pipeline = {
  id: string;
  name: string;
  stages: PipelineStage[];
};

const pipelines: Map<string, Pipeline> = new Map();

let _idCounter = 1;
export function generateId(): string {
  return `pipeline-${_idCounter++}`;
}

export function createPipeline(name: string, stages: PipelineStage[]): Pipeline {
  const id = generateId();
  const pipeline: Pipeline = { id, name, stages };
  pipelines.set(id, pipeline);
  return pipeline;
}

export function getPipeline(id: string): Pipeline | undefined {
  return pipelines.get(id);
}

export function listPipelines(): Pipeline[] {
  return Array.from(pipelines.values());
}

export function deletePipeline(id: string): boolean {
  return pipelines.delete(id);
}

export function clearPipelines(): void {
  pipelines.clear();
  _idCounter = 1;
}

export function runPipeline(id: string, records: RouteRecord[]): RouteRecord[] | null {
  const pipeline = pipelines.get(id);
  if (!pipeline) return null;
  return pipeline.stages.reduce(
    (acc: RouteRecord[], stage: PipelineStage) => stage.transform(acc),
    records
  );
}
