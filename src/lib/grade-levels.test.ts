import { describe, expect, it } from "vitest";
import {
  GRADE_OPTIONS,
  requiresTeacherName,
} from "./grade-levels";

describe("requiresTeacherName", () => {
  it("returns true for Educação Infantil", () => {
    expect(requiresTeacherName("Berçário")).toBe(true);
    expect(requiresTeacherName("Maternal I")).toBe(true);
    expect(requiresTeacherName("Maternal II")).toBe(true);
    expect(requiresTeacherName("Pré I")).toBe(true);
    expect(requiresTeacherName("Pré-Escola")).toBe(true);
    expect(requiresTeacherName("Jardim II")).toBe(true);
  });

  it("returns true for Fundamental I (1º a 5º ano)", () => {
    expect(requiresTeacherName("1º Ano")).toBe(true);
    expect(requiresTeacherName("3º Ano")).toBe(true);
    expect(requiresTeacherName("5º Ano")).toBe(true);
    expect(requiresTeacherName("Fundamental I")).toBe(true);
    expect(requiresTeacherName("Fund I")).toBe(true);
  });

  it("returns false for Fundamental II (6º a 9º ano)", () => {
    expect(requiresTeacherName("6º Ano")).toBe(false);
    expect(requiresTeacherName("7º Ano")).toBe(false);
    expect(requiresTeacherName("9º Ano")).toBe(false);
    expect(requiresTeacherName("Fundamental II")).toBe(false);
    expect(requiresTeacherName("Fund II")).toBe(false);
  });

  it("returns false for Ensino Médio", () => {
    expect(requiresTeacherName("1ª Série EM")).toBe(false);
    expect(requiresTeacherName("2ª Série EM")).toBe(false);
    expect(requiresTeacherName("3ª Série")).toBe(false);
    expect(requiresTeacherName("Ensino Médio")).toBe(false);
    expect(requiresTeacherName("EM")).toBe(false);
  });

  it("absorbs ordinal variants", () => {
    expect(requiresTeacherName("5o Ano")).toBe(true);
    expect(requiresTeacherName("5° Ano")).toBe(true);
    expect(requiresTeacherName("5 Ano")).toBe(true);
    expect(requiresTeacherName("6o Ano")).toBe(false);
    expect(requiresTeacherName("6° Ano")).toBe(false);
  });

  it("absorbs case + accents + extra whitespace", () => {
    expect(requiresTeacherName("MATERNAL I")).toBe(true);
    expect(requiresTeacherName("  3º Ano  ")).toBe(true);
    expect(requiresTeacherName("INFANTIL")).toBe(true);
  });

  it("supports G1-G5 (escola colombo style)", () => {
    expect(requiresTeacherName("G1")).toBe(true);
    expect(requiresTeacherName("G5")).toBe(true);
  });

  it("returns true (safe default) for unknown / null input", () => {
    expect(requiresTeacherName("")).toBe(true);
    expect(requiresTeacherName(null)).toBe(true);
    expect(requiresTeacherName(undefined)).toBe(true);
    expect(requiresTeacherName("Algum nível desconhecido")).toBe(true);
  });

  it("dropdown options match the heuristic outcome on their value", () => {
    for (const opt of GRADE_OPTIONS) {
      expect(requiresTeacherName(opt.value)).toBe(opt.requiresTeacher);
    }
  });
});
