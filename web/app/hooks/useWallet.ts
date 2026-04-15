"use client";

import { useState, useEffect } from "react";

const WALLET_KEY = "hyper-copy-wallet";
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export function useWallet() {
  const [address, setAddressState] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(WALLET_KEY);
      if (saved && ADDRESS_RE.test(saved)) {
        setAddressState(saved);
      }
    }
  }, []);

  const setAddress = (addr: string) => {
    if (!ADDRESS_RE.test(addr)) return false;
    localStorage.setItem(WALLET_KEY, addr);
    setAddressState(addr);
    return true;
  };

  const clearAddress = () => {
    localStorage.removeItem(WALLET_KEY);
    setAddressState("");
  };

  return {
    address,
    setAddress,
    clearAddress,
    isSet: address.length > 0,
  };
}
