"use client";

import { useEffect, useState } from "react";

const DEVICE_ID_KEY = "studysnap_device_id";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      id = crypto.randomUUID();
    } else {
      id = "dev_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    }
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function useDeviceId(): string {
  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => {
    setDeviceId(getDeviceId());
  }, []);

  return deviceId;
}
