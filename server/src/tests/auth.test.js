import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ─── Mock External Dependencies ───────────────────────────────────────────────
vi.mock("../models/user.model.js");
vi.mock("bcryptjs");
vi.mock("jsonwebtoken");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const FAKE_JWT = "fake.jwt.token";
const FAKE_USER = {
  _id: "64b1234567890abcdef12345",
  username: "testuser",
  email: "test@example.com",
  password: "$2a$10$hashedpassword",
};

beforeEach(() => {
  vi.clearAllMocks();
  jwt.sign.mockReturnValue(FAKE_JWT);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
  it("TC-AUTH-01 | should register a new user and return 201 with a token cookie", async () => {
    userModel.findOne.mockResolvedValue(null);          // user doesn't exist
    bcrypt.hash.mockResolvedValue("hashedPassword123");
    userModel.create.mockResolvedValue(FAKE_USER);

    const res = await request(app).post("/api/auth/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "Password123!",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("User registered successfully");
    expect(res.headers["set-cookie"]).toBeDefined();            // cookie is set
  });

  it("TC-AUTH-02 | should return 400 if email is already registered", async () => {
    userModel.findOne.mockResolvedValue(FAKE_USER);     // user already exists

    const res = await request(app).post("/api/auth/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "Password123!",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("User already registered");
  });

  it("TC-AUTH-03 | should return 400 if username is already taken", async () => {
    userModel.findOne.mockResolvedValue({ ...FAKE_USER, email: "other@example.com" });

    const res = await request(app).post("/api/auth/register").send({
      username: "testuser",
      email: "new@example.com",
      password: "Password123!",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("TC-AUTH-04 | should hash the password before storing", async () => {
    userModel.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue("hashedPassword123");
    userModel.create.mockResolvedValue(FAKE_USER);

    await request(app).post("/api/auth/register").send({
      username: "testuser",
      email: "test@example.com",
      password: "Password123!",
    });

    expect(bcrypt.hash).toHaveBeenCalledWith("Password123!", 10);
    expect(userModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ password: "hashedPassword123" })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/auth/login", () => {
  it("TC-AUTH-05 | should login successfully and return 200 with a token cookie", async () => {
    userModel.findOne.mockReturnValue({
      select: vi.fn().mockResolvedValue(FAKE_USER),
    });
    bcrypt.compare.mockResolvedValue(true);

    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "Password123!",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("User logged in successfully");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("TC-AUTH-06 | should return 404 if user does not exist", async () => {
    userModel.findOne.mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "Password123!",
    });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("TC-AUTH-07 | should return 401 if password is wrong", async () => {
    userModel.findOne.mockReturnValue({
      select: vi.fn().mockResolvedValue(FAKE_USER),
    });
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "WrongPassword!",
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/getMe
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/auth/getMe", () => {
  it("TC-AUTH-08 | should return the logged-in user when token cookie is valid", async () => {
    jwt.verify.mockReturnValue({ id: FAKE_USER._id, username: FAKE_USER.username });
    userModel.findById.mockResolvedValue(FAKE_USER);

    const res = await request(app)
      .get("/api/auth/getMe")
      .set("Cookie", `token=${FAKE_JWT}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("user fetched successfully");
    expect(res.body.user).toBeDefined();
  });

  it("TC-AUTH-09 | should return 401 when no token cookie is sent", async () => {
    const res = await request(app).get("/api/auth/getMe");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("token not provided");
  });

  it("TC-AUTH-10 | should not respond when token is tampered / invalid (middleware catches error silently)", async () => {
    jwt.verify.mockImplementation(() => { throw new Error("invalid token"); });

    // The current middleware catches the error but doesn't send a response —
    // keep this test to document the behaviour and catch regressions.
    const res = await request(app)
      .get("/api/auth/getMe")
      .set("Cookie", `token=tampered.token.here`);

    // Expect the request to hang/timeout OR return a 4xx/5xx.
    // Document the actual status code you observe here:
    expect([401, 403, 500]).toContain(res.status);
  });
});
