import express, { Express } from "express";
import request from "supertest";
import { createNoteRouter } from "./noteRouter";
import { clearNotes, addNote } from "./note";

function buildApp(): Express {
  const app = express();
  app.use(express.json());
  app.use("/notes", createNoteRouter());
  return app;
}

beforeEach(() => {
  clearNotes();
});

describe("GET /notes", () => {
  it("returns empty array when no notes exist", async () => {
    const res = await request(buildApp()).get("/notes");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns all notes", async () => {
    addNote({ method: "GET", path: "/api/users" }, "check auth");
    addNote({ method: "POST", path: "/api/items" }, "rate limit candidate");
    const res = await request(buildApp()).get("/notes");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe("GET /notes/route", () => {
  it("returns 400 when query params are missing", async () => {
    const res = await request(buildApp()).get("/notes/route");
    expect(res.status).toBe(400);
  });

  it("returns notes for a specific route", async () => {
    addNote({ method: "GET", path: "/api/users" }, "note one");
    addNote({ method: "POST", path: "/api/users" }, "note two");
    const res = await request(buildApp()).get("/notes/route?method=GET&path=/api/users");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].text).toBe("note one");
  });
});

describe("POST /notes", () => {
  it("creates a new note", async () => {
    const res = await request(buildApp())
      .post("/notes")
      .send({ route: { method: "get", path: "/api/ping" }, text: "monitor this" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      route: { method: "GET", path: "/api/ping" },
      text: "monitor this",
    });
    expect(typeof res.body.id).toBe("string");
    expect(typeof res.body.createdAt).toBe("string");
  });

  it("returns 400 when body is incomplete", async () => {
    const res = await request(buildApp()).post("/notes").send({ text: "missing route" });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /notes/:id", () => {
  it("updates an existing note", async () => {
    const note = addNote({ method: "GET", path: "/api/health" }, "original");
    const res = await request(buildApp())
      .patch(`/notes/${note.id}`)
      .send({ text: "updated text" });
    expect(res.status).toBe(200);
    expect(res.body.text).toBe("updated text");
  });

  it("returns 404 for unknown id", async () => {
    const res = await request(buildApp()).patch("/notes/nonexistent").send({ text: "x" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /notes/:id", () => {
  it("deletes a note by id", async () => {
    const note = addNote({ method: "DELETE", path: "/api/items/:id" }, "to review");
    const res = await request(buildApp()).delete(`/notes/${note.id}`);
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(true);
  });

  it("returns 404 for unknown id", async () => {
    const res = await request(buildApp()).delete("/notes/ghost");
    expect(res.status).toBe(404);
  });
});

describe("DELETE /notes", () => {
  it("clears all notes", async () => {
    addNote({ method: "GET", path: "/api/a" }, "a");
    addNote({ method: "GET", path: "/api/b" }, "b");
    const res = await request(buildApp()).delete("/notes");
    expect(res.status).toBe(200);
    expect(res.body.cleared).toBe(true);
    const listRes = await request(buildApp()).get("/notes");
    expect(listRes.body).toHaveLength(0);
  });
});
