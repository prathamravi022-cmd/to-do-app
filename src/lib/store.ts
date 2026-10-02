import { useEffect, useState } from "react";

export function useLocal<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, [key]);
  useEffect(() => {
    if (loaded) localStorage.setItem(key, JSON.stringify(value));
  }, [key, value, loaded]);
  return [value, setValue] as const;
}

export const uid = () => Math.random().toString(36).slice(2, 10);
export const dayKey = (d = new Date()) => d.toISOString().slice(0, 10);

export type Priority = "low" | "medium" | "high";
export interface Task { id: string; title: string; done: boolean; priority: Priority; due?: string | undefined; category: string; created: number }
export interface Habit { id: string; name: string; days: string[] }
export interface Note { id: string; title: string; body: string; pinned: boolean; updated: number }
export interface Goal { id: string; title: string; progress: number; deadline?: string | undefined }
export interface Mood { day: string; mood: number; text: string }

export const seedTasks: Task[] = [];
export const seedHabits: Habit[] = [];
export const seedNotes: Note[] = [];
export const seedGoals: Goal[] = [];
