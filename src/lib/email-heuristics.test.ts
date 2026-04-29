import { describe, expect, it } from "vitest";
import { isLikelyInstitutionalEmail } from "./email-heuristics";

describe("isLikelyInstitutionalEmail", () => {
  it("returns false for personal webmail domains", () => {
    expect(isLikelyInstitutionalEmail("joao@gmail.com")).toBe(false);
    expect(isLikelyInstitutionalEmail("maria@hotmail.com")).toBe(false);
    expect(isLikelyInstitutionalEmail("ana@yahoo.com.br")).toBe(false);
    expect(isLikelyInstitutionalEmail("user@icloud.com")).toBe(false);
  });

  it("returns true for .edu.br domains", () => {
    expect(isLikelyInstitutionalEmail("coordenacao@escola.edu.br")).toBe(true);
    expect(isLikelyInstitutionalEmail("admin@unifesp.edu.br")).toBe(true);
  });

  it("returns true for .edu domains", () => {
    expect(isLikelyInstitutionalEmail("dept@stanford.edu")).toBe(true);
  });

  it("returns true for arbitrary institutional-looking domains", () => {
    expect(isLikelyInstitutionalEmail("coordenacao@colegioaurora.com.br")).toBe(true);
    expect(isLikelyInstitutionalEmail("contato@institutosaopaulo.org")).toBe(true);
    expect(isLikelyInstitutionalEmail("admin@empresa.com")).toBe(true);
  });

  it("returns false for malformed input", () => {
    expect(isLikelyInstitutionalEmail("not-an-email")).toBe(false);
    expect(isLikelyInstitutionalEmail("@nodomain.com")).toBe(false);
    expect(isLikelyInstitutionalEmail("nolocal@")).toBe(false);
    expect(isLikelyInstitutionalEmail("a@b")).toBe(false);
    expect(isLikelyInstitutionalEmail("with space@domain.com")).toBe(false);
  });

  it("returns false for null and undefined", () => {
    expect(isLikelyInstitutionalEmail(null)).toBe(false);
    expect(isLikelyInstitutionalEmail(undefined)).toBe(false);
    expect(isLikelyInstitutionalEmail("")).toBe(false);
  });

  it("is case-insensitive on the domain", () => {
    expect(isLikelyInstitutionalEmail("user@COLEGIO.COM.BR")).toBe(true);
    expect(isLikelyInstitutionalEmail("user@GMAIL.COM")).toBe(false);
  });
});
